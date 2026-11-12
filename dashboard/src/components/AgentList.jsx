export default function AgentList({ agents, devices = [] }) {
  if (agents.length === 0) {
    return <p className="muted">No monitoring agents connected yet. Launch an agent with agent.properties.</p>;
  }

  return (
    <div className="agent-cards-grid">
      {agents.map((a) => {
        const assignedDevices = devices.filter((d) => d.agentId === a.id);
        const upCount = assignedDevices.filter((d) => d.status === 'UP').length;

        return (
          <div key={a.id} className={`agent-card ${a.online ? 'agent-card-online' : 'agent-card-offline'}`}>
            <div className="agent-card-header">
              <div className="agent-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                  <line x1="6" y1="6" x2="6.01" y2="6"></line>
                  <line x1="6" y1="18" x2="6.01" y2="18"></line>
                </svg>
              </div>
              <div>
                <h4 className="agent-title">{a.id}</h4>
                <span className="agent-segment-label">Segment Worker</span>
              </div>
              <span className={`pill-badge ${a.online ? 'pill-up' : 'pill-down'}`}>
                <span className="pill-dot"></span>
                {a.online ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            <div className="agent-stats-row">
              <div className="agent-mini-stat">
                <span className="mini-stat-label">Devices</span>
                <span className="mini-stat-val">{assignedDevices.length}</span>
              </div>
              <div className="agent-mini-stat">
                <span className="mini-stat-label">Active / Up</span>
                <span className="mini-stat-val text-green">{upCount}</span>
              </div>
              <div className="agent-mini-stat">
                <span className="mini-stat-label">Buffer Capacity</span>
                <span className="mini-stat-val">3600s</span>
              </div>
            </div>

            <div className="agent-footer-info">
              <span className="agent-hb-icon">⚡</span>
              <span>Last heartbeat: {a.lastHeartbeat ? new Date(a.lastHeartbeat).toLocaleTimeString() : 'Never'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
