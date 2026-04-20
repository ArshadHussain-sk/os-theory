export default function SystemStatus({ status }) {
  return (
    <div className={`global-status global-${status}`}>
      System Status: {status.toUpperCase()}
    </div>
  );
}
