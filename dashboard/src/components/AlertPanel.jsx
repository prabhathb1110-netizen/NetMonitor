export default function AlertPanel({ alerts, onAcknowledge }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon text-green">🛡️</div>
        <h3>All Systems Nominal</h3>
        <p className="muted">No thresholds have been exceeded. All monitored devices are within SLA.</p>
      </div>
    );
  }

  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const resolvedAlerts = alerts.filter((a) => a.acknowledged);

  return (
    <div className="alerts-container">
      <div className="alerts-summary-strip">
        <div className="summary-pill active-pill">
          Active Incidents: <strong>{activeAlerts.length}</strong>
        </div>
        <div className="summary-pill resolved-pill">
          Acknowledged: <strong>{resolvedAlerts.length}</strong>
        </div>
      </div>

      <div className="table-responsive">
        <table className="glass-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Severity</th>
              <th>Device Target</th>
              <th>Incident Details</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => {
              const isCrit = a.severity === 'CRITICAL';
              return (
                <tr
                  key={a.id}
                  className={`table-row ${!a.acknowledged ? (isCrit ? 'alert-row-crit' : 'alert-row-warn') : 'alert-row-ack'}`}
                >
                  <td className="timestamp-cell">
                    {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td>
                    <span className={`pill-badge ${isCrit ? 'pill-down' : 'pill-degraded'}`}>
                      <span className="pill-dot"></span>
                      {a.severity}
                    </span>
                  </td>
                  <td>
                    <strong className="device-target-name">{a.deviceName}</strong>
                  </td>
                  <td className="incident-msg-cell">
                    <span className="incident-text">{a.message}</span>
                  </td>
                  <td>
                    <span className={`ack-badge ${a.acknowledged ? 'ack-done' : 'ack-pending'}`}>
                      {a.acknowledged ? 'Acknowledged' : 'Pending Action'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {!a.acknowledged ? (
                      <button
                        className="btn-ack"
                        onClick={() => onAcknowledge(a.id)}
                      >
                        ✓ Acknowledge
                      </button>
                    ) : (
                      <span className="muted-dash">Resolved</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
