export default function AgentList({ agents, devices }) {
  if (agents.length === 0) {
    return <p className="muted">No agent has connected yet. Start one with its agent.properties file.</p>;
  }
  return (
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Agent</th>
          <th>Devices</th>
          <th>Last heartbeat</th>
        </tr>
      </thead>
      <tbody>
        {agents.map((a) => (
          <tr key={a.id}>
            <td>
              <span className={`badge ${a.online ? 'up' : 'down'}`}>{a.online ? 'ONLINE' : 'OFFLINE'}</span>
            </td>
            <td>{a.id}</td>
            <td>{devices.filter((d) => d.agentId === a.id).length}</td>
            <td>{a.lastHeartbeat ? new Date(a.lastHeartbeat).toLocaleString() : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
