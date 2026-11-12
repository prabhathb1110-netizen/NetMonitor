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
    <div className="sonexo-card-section">
      <div className="discovery-hero-card">
        <div className="discovery-badge-row">
          <span className="sonexo-chip">⚡ Automated Discovery Engine</span>
        </div>
        <h3 className="section-main-title">Subnet Ping Sweep & Host Detection</h3>
        <p className="section-desc">
          Dispatches ICMP Echo & SYN discovery probes across the network segment to detect live endpoints and services.
        </p>

        <form onSubmit={handleScan} className="sonexo-discovery-bar">
          <div className="discovery-input-wrap">
            <label className="field-label">Target Subnet (CIDR)</label>
            <input
              type="text"
              className="sonexo-input-field mono-font"
              value={subnet}
              onChange={(e) => setSubnet(e.target.value)}
              placeholder="192.168.1.0/24"
              required
            />
          </div>

          <div className="discovery-input-wrap">
            <label className="field-label">Assigned Collector Agent</label>
            <select
              className="sonexo-select-field"
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

          <button type="submit" disabled={scanning} className="btn-glowing-orange btn-sweep-trigger">
            {scanning ? (
              <span className="btn-loading-flex">
                <span className="sonexo-spinner"></span> Scanning Subnet...
              </span>
            ) : (
              '⚡ Launch Ping Sweep'
            )}
          </button>
        </form>
      </div>

      {error && <div className="sonexo-error-banner">⚠️ {error}</div>}

      {results.length > 0 && (
        <div className="discovery-results-panel">
          <div className="results-header-row">
            <h4>Discovered Active Endpoints ({results.length})</h4>
            <span className="results-sub">Responsive to ICMP / TCP SYN probe</span>
          </div>

          <div className="table-responsive">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Discovered Host IP</th>
                  <th>RTT Response Latency</th>
                  <th>Interface Availability</th>
                  <th style={{ textAlign: 'right' }}>Add to Telemetry Poller</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.ip} className="table-row">
                    <td>
                      <code className="ip-badge">{r.ip}</code>
                    </td>
                    <td>
                      <span className="metric-num val-orange">{r.latencyMs} ms</span>
                    </td>
                    <td>
                      <span className="pill-badge pill-up">
                        <span className="pill-dot"></span>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {r.alreadyAdded ? (
                        <span className="monitored-check">✓ Active in Poller</span>
                      ) : (
                        <button
                          type="button"
                          className="btn-add-poller-glow"
                          onClick={() => addDiscovered(r)}
                        >
                          + Monitor Device
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
