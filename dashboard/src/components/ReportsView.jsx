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
      <div className="report-controls">
        <label>
          Time Window:
          <select value={hours} onChange={(e) => setHours(Number(e.target.value))}>
            <option value={1}>Last 1 Hour</option>
            <option value={6}>Last 6 Hours</option>
            <option value={24}>Last 24 Hours</option>
            <option value={168}>Last 7 Days</option>
            <option value={720}>Last 30 Days</option>
          </select>
        </label>
        <a href={api.exportCsvUrl()} className="btn-primary" download>
          Export CSV Report
        </a>
      </div>

      {loading ? (
        <p>Loading analytics…</p>
      ) : (
        <table className="devices-table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Host</th>
              <th>Status</th>
              <th>Checks (Samples)</th>
              <th>Uptime %</th>
              <th>Avg Latency</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.deviceId}>
                <td><strong>{row.name}</strong></td>
                <td>{row.host}</td>
                <td>
                  <span className={`badge badge-${row.status.toLowerCase()}`}>
                    {row.status}
                  </span>
                </td>
                <td>{row.sampleCount}</td>
                <td>
                  <strong style={{ color: row.uptimePercentage > 95 ? '#10b981' : '#f59e0b' }}>
                    {row.uptimePercentage}%
                  </strong>
                </td>
                <td>{row.averageLatencyMs} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

