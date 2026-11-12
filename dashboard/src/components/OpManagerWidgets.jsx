export default function OpManagerWidgets({ devices, alerts, onSelectDevice }) {
  // 1. Top Devices by CPU Utilization
  const topCpu = [...devices]
    .filter((d) => d.cpuUsage != null)
    .sort((a, b) => b.cpuUsage - a.cpuUsage)
    .slice(0, 4);

  // 2. Top Devices by Latency / Response Time
  const topLatency = [...devices]
    .filter((d) => d.latencyMs != null)
    .sort((a, b) => b.latencyMs - a.latencyMs)
    .slice(0, 4);

  // 3. Devices with Open Critical Alarms
  const downDevices = devices.filter((d) => d.status === 'DOWN' || d.status === 'DEGRADED');

  return (
    <div className="opm-widgets-grid">
      {/* Widget 1: Top Devices by CPU / Load */}
      <div className="opm-widget-card">
        <div className="opm-widget-header">
          <div className="opm-widget-title-group">
            <span className="opm-widget-icon">⚡</span>
            <h4>Top Devices by CPU Utilization</h4>
          </div>
          <span className="opm-badge-category">SNMP MIB-II</span>
        </div>
        <div className="opm-widget-body">
          {topCpu.length === 0 ? (
            <div className="opm-widget-empty">No SNMP CPU telemetry recorded</div>
          ) : (
            topCpu.map((d) => (
              <div
                key={d.id}
                className="opm-stat-row"
                onClick={() => onSelectDevice(d.id)}
              >
                <div className="opm-row-left">
                  <span className="opm-dev-name">{d.name}</span>
                  <span className="opm-dev-ip">{d.host}</span>
                </div>
                <div className="opm-row-right">
                  <div className="opm-gauge-bar">
                    <div
                      className="opm-gauge-fill"
                      style={{
                        width: `${d.cpuUsage}%`,
                        backgroundColor:
                          d.cpuUsage > 80 ? '#ef4444' : d.cpuUsage > 60 ? '#f59e0b' : '#10b981',
                      }}
                    ></div>
                  </div>
                  <span className="opm-metric-val">{Math.round(d.cpuUsage)}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Widget 2: Highest Response Time (Latency Dial) */}
      <div className="opm-widget-card">
        <div className="opm-widget-header">
          <div className="opm-widget-title-group">
            <span className="opm-widget-icon">⏱️</span>
            <h4>Highest Response Time (Latency)</h4>
          </div>
          <span className="opm-badge-category">ICMP Echo</span>
        </div>
        <div className="opm-widget-body">
          {topLatency.length === 0 ? (
            <div className="opm-widget-empty">No active latency measurements</div>
          ) : (
            topLatency.map((d) => (
              <div
                key={d.id}
                className="opm-stat-row"
                onClick={() => onSelectDevice(d.id)}
              >
                <div className="opm-row-left">
                  <span className="opm-dev-name">{d.name}</span>
                  <span className="opm-dev-ip">{d.host}</span>
                </div>
                <div className="opm-row-right">
                  <div className="opm-gauge-bar">
                    <div
                      className="opm-gauge-fill"
                      style={{
                        width: `${Math.min(100, (d.latencyMs / 60) * 100)}%`,
                        backgroundColor: d.latencyMs > 30 ? '#f59e0b' : '#38bdf8',
                      }}
                    ></div>
                  </div>
                  <span className="opm-metric-val">{d.latencyMs} ms</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Widget 3: Health & Alarm Severity Distribution */}
      <div className="opm-widget-card">
        <div className="opm-widget-header">
          <div className="opm-widget-title-group">
            <span className="opm-widget-icon">🚨</span>
            <h4>Critical Alarm Hotlist</h4>
          </div>
          <span className="opm-badge-crit">{alerts.filter((a) => !a.acknowledged).length} Active</span>
        </div>
        <div className="opm-widget-body">
          {downDevices.length === 0 ? (
            <div className="opm-widget-empty text-green">All interfaces & devices normal</div>
          ) : (
            downDevices.map((d) => (
              <div
                key={d.id}
                className="opm-alarm-row"
                onClick={() => onSelectDevice(d.id)}
              >
                <span className={`opm-status-pill pill-${d.status.toLowerCase()}`}>
                  {d.status}
                </span>
                <div className="opm-alarm-text">
                  <strong>{d.name}</strong> ({d.host})
                  <div className="opm-alarm-sub">
                    {d.status === 'DOWN'
                      ? 'Unreachable / 100% Packet Drop'
                      : `Closed Port: ${d.closedPorts || 'Degraded Service'}`}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

