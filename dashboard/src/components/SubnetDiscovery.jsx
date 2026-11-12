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
      <div className="discovery-header-card">
        <div className="discovery-intro">
          <h3>Subnet Ping Sweep & Host Discovery</h3>
          <p className="muted">
            The assigned agent runs ICMP echo & TCP SYN discovery probes across the CIDR subnet and reports active hosts.
          </p>
        </div>

        <form onSubmit={handleScan} className="discovery-scan-form">
          <div className="discovery-field">
            <label>Subnet Range (CIDR):</label>
            <input
              type="text"
              className="input-field mono-font"
              value={subnet}
              onChange={(e) => setSubnet(e.target.value)}
              placeholder="192.168.1.0/24"
              required
            />
          </div>

          <div className="discovery-field">
            <label>Discovery Agent:</label>
            <select
              className="select-field"
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} ({a.online ? 'Online' : 'Offline'})
                </option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={scanning} className="btn-modern-primary btn-scan">
            {scanning ? (
              <span className="scanning-indicator">
                <span className="spinner"></span> Sweeping Subnet...
              </span>
            ) : (
              '⚡ Run Subnet Sweep'
            )}
          </button>
        </form>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {results.length > 0 && (
        <div className="table-responsive discovery-results-table">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Discovered Host</th>
                <th>Response Time</th>
                <th>Availability</th>
                <th>Network Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.ip} className="table-row">
                  <td>
                    <code className="ip-badge">{r.ip}</code>
                  </td>
                  <td>
                    <span className="metric-num metric-good">{r.latencyMs} ms</span>
                  </td>
                  <td>
                    <span className="pill-badge pill-up">
                      <span className="pill-dot"></span>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.alreadyAdded ? (
                      <span className="already-monitored-badge">✓ In Monitoring List</span>
                    ) : (
                      <button
                        type="button"
                        className="btn-add-discovered"
                        onClick={() => addDiscovered(r)}
                      >
                        + Add To Poller
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
