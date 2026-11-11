const time = (iso) => (iso ? new Date(iso).toLocaleTimeString() : '—');

export default function DeviceTable({ devices, selectedId, onSelect, onRemove }) {
  if (devices.length === 0) {
    return <p className="muted">No devices yet. Add one below.</p>;
  }
  const sorted = [...devices].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Name</th>
          <th>Host</th>
          <th>Agent</th>
          <th>Latency</th>
          <th>Loss</th>
          <th>Ports</th>
          <th>Last check</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((d) => (
          <tr
            key={d.id}
            className={d.id === selectedId ? 'selected' : ''}
            onClick={() => onSelect(d.id === selectedId ? null : d.id)}
          >
            <td><span className={`badge ${d.status.toLowerCase()}`}>{d.status}</span></td>
            <td>{d.name}</td>
            <td className="mono">{d.host}</td>
            <td>{d.agentId}</td>
            <td>{d.latencyMs == null ? '—' : `${d.latencyMs} ms`}</td>
            <td>{d.packetLoss == null ? '—' : `${Math.round(d.packetLoss * 100)}%`}</td>
            <td className="mono">
              {d.tcpPorts || '—'}
              {d.closedPorts && <span className="closed"> (closed: {d.closedPorts})</span>}
            </td>
            <td>{time(d.lastChecked)}</td>
            <td>
              <button
                className="link"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(d);
                }}
              >
                Remove
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
