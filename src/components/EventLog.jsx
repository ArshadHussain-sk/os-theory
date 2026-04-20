export default function EventLog({ logs }) {
  return (
    <div className="panel" style={{ marginTop: 'auto' }}>
      <h2>📝 Event Log</h2>
      <div className="event-log">
        {logs.map((log, idx) => (
          <div key={idx} className="log-entry">
            <span className="log-time">[{log.time}]</span>
            <span className={`log-msg-${log.type}`}>{log.msg}</span>
          </div>
        ))}
        {logs.length === 0 && <span style={{ color: 'var(--text-secondary)' }}>No events yet.</span>}
      </div>
    </div>
  );
}
