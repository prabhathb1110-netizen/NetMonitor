const time = (iso) => (iso ? new Date(iso).toLocaleTimeString() : '—');

export default function DeviceTable({ devices, selectedId, onSelect, onRemove }) {
  if (devices.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📡</div>
        <h3>No devices monitored yet</h3>
        <p className="muted">Add a device below or run a subnet scan to auto-discover hosts.</p>
      </div>
    );
  }

  const sorted = [...devices].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="table-responsive">
      <table className="glass-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Device Name</th>
            <th>Host IP</th>
            <th>Group</th>
            <th>Agent</th>
            <th>Latency</th>
            <th>Loss</th>
            <th>Ports / Services</th>
            <th>SNMP Metrics</th>
            <th>Last Checked</th>
            <th style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d) => {
            const isSelected = d.id === selectedId;
            return (
              <tr
                key={d.id}
                className={`table-row ${isSelected ? 'row-selected' : ''}`}
                onClick={() => onSelect(isSelected ? null : d.id)}
              >
                <td>
                  <span className={`pill-badge pill-${d.status?.toLowerCase() || 'unknown'}`}>
                    <span className="pill-dot"></span>
                    {d.status || 'UNKNOWN'}
                  </span>
                </td>
                <td>
                  <div className="device-name-cell">
                    <span className="device-title">{d.name}</span>
                    <span className="device-id-sub">ID: #{d.id}</span>
                  </div>
                </td>
                <td>
                  <code className="ip-badge">{d.host}</code>
                </td>
                <td>
                  <span className="group-tag">{d.deviceGroup || 'Default'}</span>
                </td>
                <td>
                  <span className="agent-tag">
                    <span className="agent-dot"></span>
                    {d.agentId}
                  </span>
                </td>
                <td>
                  {d.latencyMs == null ? (
                    <span className="muted">—</span>
                  ) : (
                    <span className={`metric-num ${d.latencyMs > 50 ? 'metric-warn' : 'metric-good'}`}>
                      {d.latencyMs} ms
                    </span>
                  )}
                </td>
                <td>
                  {d.packetLoss == null ? (
                    <span className="muted">—</span>
                  ) : (
                    <span className={`metric-num ${d.packetLoss > 0 ? 'metric-danger' : 'metric-good'}`}>
                      {Math.round(d.packetLoss)}%
                    </span>
                  )}
                </td>
                <td>
                  <div className="ports-cell">
                    <span className="ports-text">{d.tcpPorts || 'ICMP Only'}</span>
                    {d.closedPorts && (
                      <span className="ports-closed-pill" title={`Closed: ${d.closedPorts}`}>
                        {d.closedPorts.split(',').length} Closed
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  {d.snmpEnabled ? (
                    <div className="snmp-cell">
                      <span className="snmp-badge">SNMP v2c</span>
                      {d.cpuUsage != null && (
                        <span className="snmp-stat" title={`Memory: ${d.memoryUsage}%`}>
                          CPU: {Math.round(d.cpuUsage)}%
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="muted-dash">—</span>
                  )}
                </td>
                <td className="timestamp-cell">
                  <span className="time-text">{time(d.lastChecked)}</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className="btn-icon-danger"
                    title="Remove device"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(d);
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
