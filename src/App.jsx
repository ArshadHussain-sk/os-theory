import { useState, useEffect } from 'react';
import Producer from './components/Producer';
import Consumer from './components/Consumer';
import IPCMedium from './components/IPCMedium';
import EventLog from './components/EventLog';
import SystemStatus from './components/SystemStatus';

export default function App() {
  const [method, setMethod] = useState('pipe');
  const [p1State, setP1State] = useState('idle');
  const [p2State, setP2State] = useState('idle');
  const [systemStatus, setSystemStatus] = useState('normal'); 
  
  const [buffer, setBuffer] = useState([]);
  const [sharedMemory, setSharedMemory] = useState({ data: null, lockedBy: null });
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    addLog(`Simulation initialized with ${method.toUpperCase()}`);
  }, []);

  const addLog = (msg, type = 'normal') => {
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg, type }, ...prev]);
  };

  const handleMethodChange = (newMethod) => {
    setMethod(newMethod);
    setP1State('idle');
    setP2State('idle');
    setSystemStatus('normal');
    setBuffer([]);
    setSharedMemory({ data: null, lockedBy: null });
    addLog(`Switched IPC Method to ${newMethod.toUpperCase()}`, 'warning');
  };

  const handleReset = () => {
    setP1State('idle');
    setP2State('idle');
    setSystemStatus('normal');
    setBuffer([]);
    setSharedMemory({ data: null, lockedBy: null });
    setLogs([]);
    addLog('Simulation reset.');
  };

  const handleTransmit = (data) => {
    if (systemStatus === 'deadlock') return;

    if (method === 'pipe') {
      if (buffer.length >= 3) {
        setSystemStatus('bottleneck');
        setP1State('blocked');
        addLog('Pipe is full! Producer blocked (Bottleneck).', 'error');
        return;
      }
      setP1State('sending');
      setTimeout(() => { if (p1State !== 'blocked') setP1State('idle') }, 500);
      setBuffer(prev => [...prev, data]);
      addLog(`Producer transmitted: ${data}`);
    } else if (method === 'mq') {
      setP1State('sending');
      setTimeout(() => setP1State('idle'), 500);
      setBuffer(prev => [...prev, data]);
      addLog(`Producer enqueued to MQ: ${data}`);
    }
  };

  const handleConsume = () => {
    if (systemStatus === 'deadlock') return;

    if (buffer.length === 0) {
      addLog('Message Queue is empty.', 'warning');
      return;
    }
    const item = buffer[0];
    setBuffer(prev => prev.slice(1));
    setP2State('receiving');
    setTimeout(() => setP2State('idle'), 500);
    addLog(`Consumer dequeued from MQ: ${item}`);
  };

  useEffect(() => {
    let timeout;
    if (method === 'pipe' && systemStatus !== 'deadlock' && buffer.length > 0) {
      timeout = setTimeout(() => {
        setBuffer(prev => {
          if (prev.length > 0) {
            const newBuffer = prev.slice(1);
            const item = prev[0];
            setP2State('receiving');
            setTimeout(() => setP2State('idle'), 500);
            addLog(`Consumer auto-read from Pipe: ${item}`);
            return newBuffer;
          }
          return prev;
        });
      }, 1000);
    }
    return () => clearTimeout(timeout);
  }, [buffer, method, systemStatus]);

  useEffect(() => {
    if (method === 'pipe' && systemStatus === 'bottleneck' && buffer.length < 3) {
      setSystemStatus('normal');
      setP1State('idle');
      addLog('Pipe space freed. Producer unblocked.', 'normal');
    }
  }, [buffer.length, method, systemStatus]);

  const handleAcquireLock = (process) => {
    if (systemStatus === 'deadlock') return;

    if (sharedMemory.lockedBy === null) {
      setSharedMemory(prev => ({ ...prev, lockedBy: process }));
      addLog(`${process === 'p1' ? 'Producer' : 'Consumer'} acquired the lock.`);
    } else {
      setSystemStatus('deadlock');
      setP1State('blocked');
      setP2State('blocked');
      addLog(`Deadlock! ${process} tried to acquire lock held by ${sharedMemory.lockedBy}`, 'error');
    }
  };

  const handleReleaseLock = (process) => {
    if (sharedMemory.lockedBy === process) {
      setSharedMemory(prev => ({ ...prev, lockedBy: null }));
      addLog(`${process === 'p1' ? 'Producer' : 'Consumer'} released the lock.`);
    }
  };

  const handleWriteSHM = (data, isUnsafe = false) => {
    if (systemStatus === 'deadlock') return;

    if (sharedMemory.lockedBy === 'p1' || isUnsafe) {
      if (sharedMemory.lockedBy !== 'p1' && sharedMemory.lockedBy === 'p2') {
         setSystemStatus('deadlock');
         setP1State('blocked');
         setP2State('blocked');
         addLog('Deadlock! Producer wrote to SHM while Consumer holds lock!', 'error');
         return;
      }
      setP1State('sending');
      setSharedMemory(prev => ({ ...prev, data }));
      addLog(`Producer wrote to SHM: ${data}`);
      setTimeout(() => setP1State('idle'), 500);
    } else {
       addLog('Producer cannot write. Lock not held.', 'warning');
    }
  };

  const handleReadSHM = (isUnsafe = false) => {
    if (systemStatus === 'deadlock') return;

    if (sharedMemory.lockedBy === 'p2' || isUnsafe) {
      if (sharedMemory.lockedBy !== 'p2' && sharedMemory.lockedBy === 'p1') {
         setSystemStatus('deadlock');
         setP1State('blocked');
         setP2State('blocked');
         addLog('Deadlock! Consumer read from SHM while Producer holds lock!', 'error');
         return;
      }
      setP2State('receiving');
      addLog(`Consumer read from SHM: ${sharedMemory.data}`);
      setTimeout(() => setP2State('idle'), 500);
    } else {
       addLog('Consumer cannot read. Lock not held.', 'warning');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="top-bar">
        <h1>IPC Simulator</h1>
        <div className="method-selector">
          <button className={method === 'pipe' ? 'active' : ''} onClick={() => handleMethodChange('pipe')}>Pipe</button>
          <button className={method === 'mq' ? 'active' : ''} onClick={() => handleMethodChange('mq')}>Message Queue</button>
          <button className={method === 'shm' ? 'active' : ''} onClick={() => handleMethodChange('shm')}>Shared Memory</button>
        </div>
        <button onClick={handleReset} className="danger">Reset Simulation</button>
      </div>

      <SystemStatus status={systemStatus} />

      <div className="main-sections">
        <Producer 
          method={method} 
          state={p1State} 
          onTransmit={handleTransmit} 
          onAcquireLock={() => handleAcquireLock('p1')}
          onReleaseLock={() => handleReleaseLock('p1')}
          onWriteSHM={handleWriteSHM}
          hasLock={sharedMemory.lockedBy === 'p1'}
        />
        
        <IPCMedium 
          method={method} 
          buffer={buffer} 
          sharedMemory={sharedMemory} 
        />
        
        <Consumer 
          method={method} 
          state={p2State} 
          onConsume={handleConsume}
          onAcquireLock={() => handleAcquireLock('p2')}
          onReleaseLock={() => handleReleaseLock('p2')}
          onReadSHM={handleReadSHM}
          hasLock={sharedMemory.lockedBy === 'p2'}
        />
      </div>

      <EventLog logs={logs} />
    </div>
  );
}
