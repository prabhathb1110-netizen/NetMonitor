export default function AlertPanel({ alerts, onAcknowledge }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="sonexo-empty-state">
        <div className="empty-ring-glow">🛡️</div>
        <h3 className="empty-title">All Network Interfaces Clear</h3>
        <p className="empty-desc">Zero active threshold breaches. All monitored endpoints operate within strict SLA bounds.</p>
      </div>
    );
  }

  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const resolvedAlerts = alerts.filter((a) => a.acknowledged);

  return (
    <div className="sonexo-card-section">
      {/* Alarms Header KPI Row */}
      <div className="alarm-kpi-strip">
        <div className="alarm-pill-stat stat-pill-active">
          <span className="dot-pulse-red"></span>
          <span>Active Critical Incidents: <strong>{activeAlerts.length}</strong></span>
        </div>
        <div className="alarm-pill-stat stat-pill-ack">
          <span>Acknowledged Incidents: <strong>{resolvedAlerts.length}</strong></span>
        </div>
      </div>

      <div className="table-responsive">
        <table className="glass-table">
          <thead>
            <tr>
              <th>Detection Time</th>
              <th>Incident Severity</th>
              <th>Target Device</th>
              <th>Telemetry Violation Message</th>
              <th>Incident State</th>
              <th style={{ textAlign: 'right' }}>Operator Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => {
              const isCrit = a.severity === 'CRITICAL';
              return (
                <tr
                  key={a.id}
                  className={`table-row ${!a.acknowledged ? (isCrit ? 'row-alert-crit-glow' : 'row-alert-warn-glow') : ''}`}
                >
                  <td className="mono-font text-dim" style={{ fontSize: '14px' }}>
                    {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td>
                    <span className={`pill-badge ${isCrit ? 'pill-down' : 'pill-degraded'}`}>
                      <span className="pill-dot"></span>
                      {a.severity}
                    </span>
                  </td>
                  <td>
                    <strong className="text-white" style={{ fontSize: '15px' }}>{a.deviceName}</strong>
                  </td>
                  <td>
                    <span className="violation-msg-text">{a.message}</span>
                  </td>
                  <td>
                    <span className={`state-chip ${a.acknowledged ? 'state-chip-ack' : 'state-chip-pending'}`}>
                      {a.acknowledged ? 'Acknowledged' : 'Pending Action'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {!a.acknowledged ? (
                      <button
                        className="btn-ack-glow"
                        onClick={() => onAcknowledge(a.id)}
                      >
                        ✓ Acknowledge
                      </button>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '14px' }}>Resolved</span>
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
