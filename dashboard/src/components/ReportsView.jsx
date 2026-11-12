import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function ReportsView() {
  const [data, setData] = useState([]);
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getUptimeReport(hours)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [hours]);

  return (
    <div className="reports-pane">
      <div className="reports-top-bar">
        <div>
          <h3>Network SLA & Uptime Telemetry</h3>
          <p className="muted">Statistical aggregation across sliding measurement windows with CSV export compliance.</p>
        </div>

        <div className="reports-controls">
          <div className="select-wrapper">
            <label>Time Window:</label>
            <select
              className="select-field"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            >
              <option value={1}>Last 1 Hour (High Fidelity)</option>
              <option value={6}>Last 6 Hours</option>
              <option value={24}>Last 24 Hours (Daily SLA)</option>
              <option value={168}>Last 7 Days (Weekly)</option>
              <option value={720}>Last 30 Days (Monthly)</option>
            </select>
          </div>

          <a href={api.exportCsvUrl()} className="btn-modern-primary btn-export" download>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export Telemetry CSV
          </a>
        </div>
      </div>

      {loading ? (
        <div className="chart-loading">Compiling SLA reports...</div>
      ) : (
        <div className="table-responsive">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Device Name</th>
                <th>IP Address</th>
                <th>Current Status</th>
                <th>Telemetry Samples</th>
                <th>SLA Uptime %</th>
                <th>Avg Round-Trip Latency</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.deviceId} className="table-row">
                  <td>
                    <strong className="device-title">{row.name}</strong>
                  </td>
                  <td>
                    <code className="ip-badge">{row.host}</code>
                  </td>
                  <td>
                    <span className={`pill-badge pill-${row.status.toLowerCase()}`}>
                      <span className="pill-dot"></span>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <span className="samples-tag">{row.sampleCount} probes</span>
                  </td>
                  <td>
                    <div className="uptime-progress-cell">
                      <div className="uptime-bar-bg">
                        <div
                          className="uptime-bar-fill"
                          style={{
                            width: `${row.uptimePercentage}%`,
                            backgroundColor: row.uptimePercentage > 95 ? '#10b981' : row.uptimePercentage > 80 ? '#f59e0b' : '#ef4444'
                          }}
                        ></div>
                      </div>
                      <span className="uptime-val-text" style={{ color: row.uptimePercentage > 95 ? '#10b981' : '#f59e0b' }}>
                        {row.uptimePercentage}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="metric-num metric-good">{row.averageLatencyMs} ms</span>
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
