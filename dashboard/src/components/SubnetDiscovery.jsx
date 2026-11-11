import { useState } from 'react';

export default function SubnetDiscovery({ agents, onAddDevice }) {
  const [subnet, setSubnet] = useState('192.168.1.0/24');
  const [selectedAgent, setSelectedAgent] = useState(agents[0]?.id || 'agent-a');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  async function handleScan(e) {
    e.preventDefault();
    setScanning(true);
    setError('');
    try {
      const res = await fetch('/api/discovery/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subnet, agentId: selectedAgent })
      });
      if (!res.ok) throw new Error('Scan request failed');
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }

  function addDiscovered(item) {
    onAddDevice({
      name: `Host-${item.ip.split('.').pop()}`,
      host: item.ip,
      tcpPorts: '80,443',
      agentId: selectedAgent,
      deviceGroup: 'Discovered',
      snmpEnabled: false,
      snmpCommunity: 'public'
    });
    setResults((list) =>
      list.map((r) => (r.ip === item.ip ? { ...r, alreadyAdded: true } : r))
    );
  }

  return (
    <div className="discovery-pane">
      <form onSubmit={handleScan} className="scan-bar">
        <label>
          Target Subnet CIDR:
          <input
            type="text"
            value={subnet}
            onChange={(e) => setSubnet(e.target.value)}
            placeholder="192.168.1.0/24"
            required
          />
        </label>
        <label>
          Poller Agent:
          <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} ({a.online ? 'Online' : 'Offline'})
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={scanning} className="btn-primary">
          {scanning ? 'Sweeping Subnet…' : 'Start Ping Sweep'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {results.length > 0 && (
        <table className="devices-table">
          <thead>
            <tr>
              <th>Discovered IP</th>
              <th>Latency</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.ip}>
                <td><strong>{r.ip}</strong></td>
                <td>{r.latencyMs} ms</td>
                <td><span className="badge badge-up">{r.status}</span></td>
                <td>
                  {r.alreadyAdded ? (
                    <span className="muted">Monitored</span>
                  ) : (
                    <button
                      type="button"
                      className="btn-sm"
                      onClick={() => addDiscovered(r)}
                    >
                      + Monitor Host
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

