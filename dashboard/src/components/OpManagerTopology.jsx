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
    <div className="topology-view-wrapper">
      <div className="topology-controls-bar">
        <div className="topology-legend">
          <span className="legend-item"><span className="legend-dot dot-up"></span> Operational (Up)</span>
          <span className="legend-item"><span className="legend-dot dot-warn"></span> Degraded (Port/Latency)</span>
          <span className="legend-item"><span className="legend-dot dot-crit"></span> Critical (Down)</span>
          <span className="legend-item"><span className="legend-dot dot-unknown"></span> Unreachable</span>
        </div>
        <div className="topology-help-hint">
          <span>Click any node to inspect telemetry snapshot</span>
        </div>
      </div>

      <div className="topology-canvas">
        {/* Layer 1: WAN & Core Gateways */}
        <div className="topo-layer">
          <div className="topo-layer-label">WAN & CORE GATEWAYS</div>
          <div className="topo-nodes-flex">
            {gateways.length === 0 && <span className="muted">No Gateways mapped</span>}
            {gateways.map((d) => (
              <TopoNode
                key={d.id}
                device={d}
                icon="🌐"
                selected={d.id === selectedId}
                onClick={() => onSelectDevice(d.id)}
              />
            ))}
          </div>
        </div>

        {/* Bus Connection Trunk */}
        <div className="topo-trunk-line">
          <div className="trunk-pulse"></div>
        </div>

        {/* Layer 2: Distribution & Infrastructure Services */}
        <div className="topo-layer">
          <div className="topo-layer-label">INFRASTRUCTURE & DISTRIBUTION (DNS / AGGREGATION)</div>
          <div className="topo-nodes-flex">
            {coreSwitches.length === 0 && <span className="muted">No Distribution devices</span>}
            {coreSwitches.map((d) => (
              <TopoNode
                key={d.id}
                device={d}
                icon="🔀"
                selected={d.id === selectedId}
                onClick={() => onSelectDevice(d.id)}
              />
            ))}
          </div>
        </div>

        {/* Bus Connection Trunk */}
        <div className="topo-trunk-line">
          <div className="trunk-pulse"></div>
        </div>

        {/* Layer 3: Application Servers, Storage & Segment Endpoints */}
        <div className="topo-layer">
          <div className="topo-layer-label">SERVERS, STORAGE & EDGE SEGMENTS</div>
          <div className="topo-nodes-flex">
            {endpoints.length === 0 && <span className="muted">No Endpoints mapped</span>}
            {endpoints.map((d) => (
              <TopoNode
                key={d.id}
                device={d}
                icon={d.name.toLowerCase().includes('nas') || d.name.toLowerCase().includes('storage') ? '💾' : '🖥️'}
                selected={d.id === selectedId}
                onClick={() => onSelectDevice(d.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopoNode({ device, icon, selected, onClick }) {
  const statusClass = (device.status || 'unknown').toLowerCase();

  return (
    <div
      className={`topo-node node-${statusClass} ${selected ? 'topo-node-selected' : ''}`}
      onClick={onClick}
    >
      <div className="topo-node-icon-bubble">
        <span className="node-emoji">{icon}</span>
        <span className={`node-ping-indicator dot-${statusClass}`}></span>
      </div>
      <div className="topo-node-info">
        <div className="topo-node-name">{device.name}</div>
        <code className="topo-node-ip">{device.host}</code>
        <div className="topo-node-metrics">
          <span>{device.latencyMs != null ? `${device.latencyMs} ms` : 'Loss: 100%'}</span>
          {device.cpuUsage != null && <span>· CPU {Math.round(device.cpuUsage)}%</span>}
        </div>
      </div>
    </div>
  );
}
