export default function AlertPanel({ alerts, onAcknowledge }) {
  if (!alerts || alerts.length === 0) {
    return <p className="muted">No alerts currently raised. Network is healthy.</p>;
  }

  return (
    <div className="alerts-container">
      <table className="devices-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Severity</th>
            <th>Device</th>
            <th>Message</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((a) => (
            <tr key={a.id} className={a.severity === 'CRITICAL' ? 'row-alert-crit' : ''}>
              <td>{new Date(a.timestamp).toLocaleTimeString()}</td>
              <td>
                <span className={`badge badge-${a.severity.toLowerCase()}`}>
                  {a.severity}
                </span>
              </td>
              <td><strong>{a.deviceName}</strong></td>
              <td>{a.message}</td>
              <td>{a.acknowledged ? 'Acknowledged' : 'Active'}</td>
              <td>
                {!a.acknowledged ? (
                  <button
                    className="btn-sm"
                    onClick={() => onAcknowledge(a.id)}
                  >
                    Ack
                  </button>
                ) : (
                  <span className="muted">Done</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

