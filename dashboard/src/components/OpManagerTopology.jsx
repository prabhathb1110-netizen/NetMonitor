export default function OpManagerTopology({ devices, onSelectDevice, selectedId }) {
  // Categorize devices into logical topology layers
  const gateways = devices.filter(
    (d) => (d.deviceGroup || '').toLowerCase().includes('gate') || (d.name || '').toLowerCase().includes('router')
  );
  const coreSwitches = devices.filter(
    (d) => (d.deviceGroup || '').toLowerCase().includes('infra') || (d.name || '').toLowerCase().includes('dns') || (d.name || '').toLowerCase().includes('switch')
  );
  const endpoints = devices.filter(
    (d) => !gateways.includes(d) && !coreSwitches.includes(d)
  );

  return (
    <div className="sonexo-topology-container">
      {/* Top Legend and Guidance Bar */}
      <div className="topo-legend-bar">
        <div className="topo-legend-items">
          <span className="legend-chip">
            <span className="chip-dot dot-green"></span> Operational (Up)
          </span>
          <span className="legend-chip">
            <span className="chip-dot dot-amber"></span> Degraded (Port / Latency)
          </span>
          <span className="legend-chip">
            <span className="chip-dot dot-red"></span> Critical (Down)
          </span>
          <span className="legend-chip">
            <span className="chip-dot dot-gray"></span> Unreachable
          </span>
        </div>
        <div className="topo-hint-tag">
          <span>⚡ Select any node to view real-time latency snapshot</span>
        </div>
      </div>

      {/* Structured Topology Layers */}
      <div className="topo-layers-stack">
        {/* Layer 1: Core Gateways */}
        <div className="topo-tier-card">
          <div className="tier-header-strip">
            <div className="tier-title-flex">
              <span className="tier-badge-number">TIER 01</span>
              <h4 className="tier-name">WAN & CORE GATEWAYS</h4>
            </div>
            <span className="tier-count-pill">{gateways.length} Routers</span>
          </div>

          <div className="tier-nodes-grid">
            {gateways.length === 0 ? (
              <span className="tier-empty-msg">No Gateways mapped</span>
            ) : (
              gateways.map((d) => (
                <TopologyNodeCard
                  key={d.id}
                  device={d}
                  icon="🌐"
                  selected={d.id === selectedId}
                  onClick={() => onSelectDevice(d.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Dynamic Bus Trunk Connector */}
        <div className="topo-bus-trunk">
          <div className="trunk-line-pulse"></div>
        </div>

        {/* Layer 2: Distribution & Infrastructure Services */}
        <div className="topo-tier-card">
          <div className="tier-header-strip">
            <div className="tier-title-flex">
              <span className="tier-badge-number">TIER 02</span>
              <h4 className="tier-name">INFRASTRUCTURE & DISTRIBUTION (DNS / AGGREGATION)</h4>
            </div>
            <span className="tier-count-pill">{coreSwitches.length} Services</span>
          </div>

          <div className="tier-nodes-grid">
            {coreSwitches.length === 0 ? (
              <span className="tier-empty-msg">No Infrastructure devices</span>
            ) : (
              coreSwitches.map((d) => (
                <TopologyNodeCard
                  key={d.id}
                  device={d}
                  icon="🔀"
                  selected={d.id === selectedId}
                  onClick={() => onSelectDevice(d.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Dynamic Bus Trunk Connector */}
        <div className="topo-bus-trunk">
          <div className="trunk-line-pulse"></div>
        </div>

        {/* Layer 3: Application Servers & Endpoints */}
        <div className="topo-tier-card">
          <div className="tier-header-strip">
            <div className="tier-title-flex">
              <span className="tier-badge-number">TIER 03</span>
              <h4 className="tier-name">SERVERS, STORAGE & EDGE SEGMENTS</h4>
            </div>
            <span className="tier-count-pill">{endpoints.length} Endpoints</span>
          </div>

          <div className="tier-nodes-grid">
            {endpoints.length === 0 ? (
              <span className="tier-empty-msg">No Endpoints mapped</span>
            ) : (
              endpoints.map((d) => (
                <TopologyNodeCard
                  key={d.id}
                  device={d}
                  icon={
                    d.name.toLowerCase().includes('nas') || d.name.toLowerCase().includes('storage')
                      ? '💾'
                      : '🖥️'
                  }
                  selected={d.id === selectedId}
                  onClick={() => onSelectDevice(d.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopologyNodeCard({ device, icon, selected, onClick }) {
  const status = (device.status || 'unknown').toLowerCase();
  const isUp = status === 'up';
  const isDown = status === 'down';
  const isDegraded = status === 'degraded';

  return (
    <div
      className={`topo-node-card status-border-${status} ${selected ? 'node-selected-glow' : ''}`}
      onClick={onClick}
    >
      <div className="node-card-top-row">
        <div className="node-icon-avatar">
          <span className="node-emoji-symbol">{icon}</span>
          <span className={`node-ping-dot dot-${status}`}></span>
        </div>

        <span className={`pill-badge ${isUp ? 'pill-up' : isDown ? 'pill-down' : 'pill-degraded'}`}>
          <span className="pill-dot"></span>
          {device.status || 'UNKNOWN'}
        </span>
      </div>

      <div className="node-content-body">
        <h5 className="node-title-heading">{device.name}</h5>
        <div className="node-ip-badge-wrap">
          <code className="node-ip-code">{device.host}</code>
          <span className="node-agent-chip">{device.agentId}</span>
        </div>

        <div className="node-metrics-bar">
          <div className="metric-item">
            <span className="m-label">RTT Latency</span>
            <span className={`m-val ${isDown ? 'val-red' : 'val-orange'}`}>
              {device.latencyMs != null ? `${device.latencyMs} ms` : 'Loss: 100%'}
            </span>
          </div>
          {device.cpuUsage != null && (
            <div className="metric-item">
              <span className="m-label">CPU Load</span>
              <span className="m-val text-white">{Math.round(device.cpuUsage)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
