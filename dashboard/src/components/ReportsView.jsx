import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function ReportsView() {
  const [data, setData] = useState([]);
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getUptimeReport(hours)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [hours]);

  function handleExportClick() {
    if (exporting) return;
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
    }, 1800);
  }

  return (
    <div className="sonexo-card-section">
      <div className="reports-top-hero">
        <div>
          <span className="sonexo-chip">📊 Historical SLA Telemetry</span>
          <h3 className="section-main-title">Network Availability & SLA Compliance</h3>
          <p className="section-desc">
            Aggregated uptime compliance percentages and response latency records across sliding time intervals.
          </p>
        </div>

        <div className="reports-actions-flex">
          <div className="select-box-wrap">
            <label className="select-lbl">Report Window:</label>
            <select
              className="sonexo-select-field"
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

          <a
            href={api.exportCsvUrl()}
            className={`btn-glowing-orange ${exporting ? 'btn-exporting' : ''}`}
            download
            onClick={handleExportClick}
            title="Download full telemetry CSV record dataset"
          >
            {exporting ? (
              <span className="btn-loading-flex">
                <span className="sonexo-spinner"></span>
                <span>Exporting CSV...</span>
              </span>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Export CSV Dataset</span>
              </>
            )}
          </a>
        </div>
      </div>

      {loading ? (
        <div className="graph-loading-state">
          <span className="sonexo-spinner"></span>
          <span>Aggregating SLA telemetry records...</span>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Device Endpoint</th>
                <th>Host IP Address</th>
                <th>Current State</th>
                <th>Recorded Probes</th>
                <th>SLA Availability Score</th>
                <th>Average Ping Latency</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.deviceId} className="table-row">
                  <td>
                    <strong className="text-white" style={{ fontSize: '15px' }}>{row.name}</strong>
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
                    <span className="mono-font text-dim" style={{ fontSize: '14px' }}>{row.sampleCount} samples</span>
                  </td>
                  <td>
                    <div className="sonexo-progress-cell">
                      <div className="progress-track-bg">
                        <div
                          className="progress-fill-glow"
                          style={{
                            width: `${row.uptimePercentage}%`,
                            background:
                              row.uptimePercentage > 95
                                ? 'linear-gradient(90deg, #10b981, #34d399)'
                                : row.uptimePercentage > 80
                                ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                : 'linear-gradient(90deg, #ff334b, #f87171)',
                            boxShadow: row.uptimePercentage > 95 ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none',
                          }}
                        ></div>
                      </div>
                      <span
                        className="progress-pct-val mono-font"
                        style={{
                          color: row.uptimePercentage > 95 ? '#10b981' : row.uptimePercentage > 80 ? '#f59e0b' : '#ff334b',
                        }}
                      >
                        {row.uptimePercentage}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="metric-num val-orange">{row.averageLatencyMs} ms</span>
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
