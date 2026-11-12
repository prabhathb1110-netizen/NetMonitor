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
    <div className="sonexo-widgets-grid">
      {/* Widget 1: Top Devices by CPU / Load */}
      <div className="sonexo-widget-card">
        <div className="widget-header-strip">
          <div className="widget-title-flex">
            <span className="widget-icon-box">⚡</span>
            <div>
              <h4 className="widget-title-text">Top Devices by CPU</h4>
              <span className="widget-subtitle">SNMP MIB-II Utilization</span>
            </div>
          </div>
          <span className="widget-tag-pill">Telemetry</span>
        </div>

        <div className="widget-items-list">
          {topCpu.length === 0 ? (
            <div className="widget-empty-text">No SNMP CPU telemetry recorded</div>
          ) : (
            topCpu.map((d) => (
              <div
                key={d.id}
                className="widget-item-row"
                onClick={() => onSelectDevice(d.id)}
              >
                <div className="item-meta-group">
                  <span className="item-primary-name">{d.name}</span>
                  <code className="item-host-ip">{d.host}</code>
                </div>

                <div className="item-gauge-group">
                  <div className="item-bar-track">
                    <div
                      className="item-bar-fill"
                      style={{
                        width: `${d.cpuUsage}%`,
                        backgroundColor:
                          d.cpuUsage > 80 ? '#ff334b' : d.cpuUsage > 60 ? '#f59e0b' : '#ff7a18',
                        boxShadow: d.cpuUsage > 80 ? '0 0 8px rgba(255, 51, 75, 0.6)' : '0 0 8px rgba(255, 122, 24, 0.4)'
                      }}
                    ></div>
                  </div>
                  <span className="item-val-badge">{Math.round(d.cpuUsage)}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Widget 2: Highest Response Time (Latency) */}
      <div className="sonexo-widget-card">
        <div className="widget-header-strip">
          <div className="widget-title-flex">
            <span className="widget-icon-box">⏱️</span>
            <div>
              <h4 className="widget-title-text">Highest Response Time</h4>
              <span className="widget-subtitle">ICMP Round-Trip Ping</span>
            </div>
          </div>
          <span className="widget-tag-pill">Latency</span>
        </div>

        <div className="widget-items-list">
          {topLatency.length === 0 ? (
            <div className="widget-empty-text">No active latency measurements</div>
          ) : (
            topLatency.map((d) => (
              <div
                key={d.id}
                className="widget-item-row"
                onClick={() => onSelectDevice(d.id)}
              >
                <div className="item-meta-group">
                  <span className="item-primary-name">{d.name}</span>
                  <code className="item-host-ip">{d.host}</code>
                </div>

                <div className="item-gauge-group">
                  <div className="item-bar-track">
                    <div
                      className="item-bar-fill"
                      style={{
                        width: `${Math.min(100, (d.latencyMs / 50) * 100)}%`,
                        backgroundColor: d.latencyMs > 30 ? '#f59e0b' : '#ff9d42',
                        boxShadow: '0 0 8px rgba(255, 157, 66, 0.4)'
                      }}
                    ></div>
                  </div>
                  <span className="item-val-badge val-orange">{d.latencyMs} ms</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Widget 3: Critical Alarm Hotlist */}
      <div className="sonexo-widget-card">
        <div className="widget-header-strip">
          <div className="widget-title-flex">
            <span className="widget-icon-box alert-box-glow">🚨</span>
            <div>
              <h4 className="widget-title-text">Critical Alarm Hotlist</h4>
              <span className="widget-subtitle">Actionable Interface Faults</span>
            </div>
          </div>
          <span className="widget-alert-pill">
            {alerts.filter((a) => !a.acknowledged).length} Active
          </span>
        </div>

        <div className="widget-items-list">
          {downDevices.length === 0 ? (
            <div className="widget-empty-text text-green">All interfaces & devices normal</div>
          ) : (
            downDevices.map((d) => (
              <div
                key={d.id}
                className="widget-alarm-card"
                onClick={() => onSelectDevice(d.id)}
              >
                <div className="alarm-card-top">
                  <span className={`pill-badge ${d.status === 'DOWN' ? 'pill-down' : 'pill-degraded'}`}>
                    <span className="pill-dot"></span>
                    {d.status}
                  </span>
                  <span className="alarm-device-id">{d.name}</span>
                </div>

                <div className="alarm-card-body">
                  <span className="alarm-host-mono">{d.host}</span>
                  <p className="alarm-reason-text">
                    {d.status === 'DOWN'
                      ? 'Unreachable / 100% Packet Drop'
                      : `Closed Port: ${d.closedPorts || 'Degraded Service'}`}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
