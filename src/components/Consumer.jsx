export default function Consumer({ method, state, onConsume, onAcquireLock, onReleaseLock, onReadSHM, hasLock }) {
  return (
    <div className={`panel process-panel`}>
      <h2>📥 Process 2 (Consumer)</h2>
      <div className={`status-indicator status-${state}`}>
        Status: {state.toUpperCase()}
      </div>

      <div style={{ minHeight: '50px' }}></div> 

      {method === 'pipe' && (
        <p style={{ color: 'var(--text-secondary)' }}>
          Auto-reading from Pipe every 1s...
        </p>
      )}

      {method === 'mq' && (
        <button 
          onClick={onConsume}
          disabled={state === 'blocked'}
        >
          Consume from MQ
        </button>
      )}

      {method === 'shm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {!hasLock ? (
             <button onClick={onAcquireLock}>Acquire Lock & Read</button>
          ) : (
             <>
               <button onClick={() => onReadSHM()}>Read Data</button>
               <button className="danger" onClick={onReleaseLock}>Release Lock</button>
             </>
          )}
          <button 
            className="danger" 
            style={{ marginTop: '1rem', background: 'transparent' }} 
            onClick={() => onReadSHM(true)}
          >
            Read (Unsafe / Ignore Lock)
          </button>
        </div>
      )}
    </div>
  );
}
