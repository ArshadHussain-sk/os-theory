export default function IPCMedium({ method, buffer, sharedMemory }) {
  return (
    <div className="panel medium-container">
      <h2>🌐 IPC Medium</h2>
      <h3>{method === 'pipe' ? 'Bounded Pipe' : method === 'mq' ? 'Message Queue' : 'Shared Memory Segment'}</h3>

      {(method === 'pipe' || method === 'mq') && (
        <div className="buffer">
          {buffer.length === 0 && <span style={{ color: 'var(--text-secondary)' }}>Empty</span>}
          {buffer.map((item, idx) => (
            <div key={idx} className="buffer-item">
              {item}
            </div>
          ))}
        </div>
      )}

      {method === 'shm' && (
        <div className="shared-memory">
          <div className={`lock-status ${sharedMemory.lockedBy ? 'lock-active' : ''}`}>
            🔒 Lock: {sharedMemory.lockedBy ? (sharedMemory.lockedBy === 'p1' ? 'Process 1' : 'Process 2') : 'Free'}
          </div>
          <div className="memory-data">
            {sharedMemory.data ? sharedMemory.data : <span style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Empty / Null</span>}
          </div>
        </div>
      )}
    </div>
  );
}
