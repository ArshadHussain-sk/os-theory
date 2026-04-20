import { useState } from 'react';

export default function Producer({ method, state, onTransmit, onAcquireLock, onReleaseLock, onWriteSHM, hasLock }) {
  const [data, setData] = useState('');

  return (
    <div className={`panel process-panel`}>
      <h2>🚀 Process 1 (Producer)</h2>
      <div className={`status-indicator status-${state}`}>
        Status: {state.toUpperCase()}
      </div>

      <input 
        type="text" 
        placeholder="Enter payload data..." 
        value={data}
        onChange={(e) => setData(e.target.value)}
      />

      {(method === 'pipe' || method === 'mq') && (
        <button 
          onClick={() => {
            if (data) {
              onTransmit(data);
              setData('');
            }
          }}
          disabled={state === 'blocked'}
        >
          Transmit Data
        </button>
      )}

      {method === 'shm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {!hasLock ? (
            <button onClick={onAcquireLock}>Acquire Lock & Write</button>
          ) : (
            <>
              <button 
                onClick={() => {
                  if (data) onWriteSHM(data);
                }}
              >
                Write Data
              </button>
              <button className="danger" onClick={onReleaseLock}>Release Lock</button>
            </>
          )}
          <button 
            className="danger" 
            style={{ marginTop: '1rem', background: 'transparent' }} 
            onClick={() => {
              if (data) onWriteSHM(data, true);
            }}
          >
            Write (Unsafe / Ignore Lock)
          </button>
        </div>
      )}
    </div>
  );
}
