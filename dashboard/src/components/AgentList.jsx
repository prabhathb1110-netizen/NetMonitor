export default function AgentList({ agents, devices = [] }) {
  if (agents.length === 0) {
    return (
      <div className="sonexo-empty-state">
        <p className="empty-desc">No monitoring collectors registered. Start an agent using agent.properties.</p>
      </div>
    );
  }

  return (
    <div className="sonexo-agents-grid">
      {agents.map((a) => {
        const assignedDevices = devices.filter((d) => d.agentId === a.id);
        const upCount = assignedDevices.filter((d) => d.status === 'UP').length;

        return (
          <div
            key={a.id}
            className={`sonexo-agent-card ${a.online ? 'agent-card-active-glow' : 'agent-card-offline'}`}
          >
            <div className="agent-card-top">
              <div className="agent-avatar-hex">
                <span className="hex-icon">⚡</span>
              </div>
              <div className="agent-identity">
                <h4 className="agent-name-title">{a.id}</h4>
                <span className="agent-segment-tag">Distributed Poller</span>
              </div>
              <span className={`pill-badge ${a.online ? 'pill-up' : 'pill-down'}`}>
                <span className="pill-dot"></span>
                {a.online ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            <div className="agent-telemetry-metrics">
              <div className="agent-metric-box">
                <span className="box-label">Assigned</span>
                <span className="box-val text-white">{assignedDevices.length}</span>
              </div>
              <div className="agent-metric-box">
                <span className="box-label">Healthy</span>
                <span className="box-val text-green">{upCount}</span>
              </div>
              <div className="agent-metric-box">
                <span className="box-label">Offline Buffer</span>
                <span className="box-val val-orange">3600s</span>
              </div>
            </div>

            <div className="agent-card-bottom">
              <span className="pulse-indicator-dot"></span>
              <span className="bottom-heartbeat-text">
                Last Heartbeat: {a.lastHeartbeat ? new Date(a.lastHeartbeat).toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
