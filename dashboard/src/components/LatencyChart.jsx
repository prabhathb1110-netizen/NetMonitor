import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { api } from '../api.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip);

const RANGES = [1, 6, 24];

export default function LatencyChart({ device }) {
  const [hours, setHours] = useState(1);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getMeasurements(device.id, hours)
      .then((list) => {
        if (!cancelled) {
          setPoints(list);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPoints([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [device.id, device.lastChecked, hours]);

  const upCount = points.filter((p) => p.up).length;
  const uptime = points.length ? ((upCount / points.length) * 100).toFixed(1) : null;
  const avgLat = points.filter((p) => p.latencyMs != null).length
    ? (points.reduce((acc, p) => acc + (p.latencyMs || 0), 0) / points.filter((p) => p.latencyMs != null).length).toFixed(1)
    : '—';

  const data = {
    labels: points.map((p) => new Date(p.checkedAt || p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    datasets: [
      {
        label: 'Latency (ms)',
        data: points.map((p) => (p.up ? p.latencyMs : null)),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.08)',
        fill: true,
        borderWidth: 2.5,
        pointBackgroundColor: '#0284c7',
        pointBorderColor: '#38bdf8',
        pointRadius: points.length > 50 ? 0 : 3,
        pointHoverRadius: 6,
        tension: 0.35,
      },
    ],
  };

  const options = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f8fafc',
        bodyColor: '#38bdf8',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (ctx) => `Response Latency: ${ctx.parsed.y} ms`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.25)' },
        ticks: { color: '#64748b', maxTicksLimit: 10, font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(51, 65, 85, 0.25)' },
        ticks: { color: '#64748b', font: { size: 11 } },
        title: { display: true, text: 'Milliseconds (ms)', color: '#94a3b8', font: { size: 12 } },
      },
    },
  };

  return (
    <div className="analytics-card-inner">
      <div className="chart-header-row">
        <div>
          <div className="chart-device-badge">
            <span className={`pill-dot ${device.status === 'UP' ? 'dot-up' : 'dot-warn'}`}></span>
            <h3>{device.name}</h3>
            <code className="chart-ip-label">{device.host}</code>
          </div>
          <div className="chart-meta-chips">
            {uptime !== null && (
              <span className="metric-chip">
                Uptime: <strong style={{ color: uptime > 95 ? '#10b981' : '#f59e0b' }}>{uptime}%</strong>
              </span>
            )}
            <span className="metric-chip">
              Avg Latency: <strong>{avgLat} ms</strong>
            </span>
            <span className="metric-chip">
              Monitored by: <strong>{device.agentId}</strong>
            </span>
          </div>
        </div>

        <div className="range-selector-group">
          {RANGES.map((h) => (
            <button
              key={h}
              className={`btn-range ${h === hours ? 'btn-range-active' : ''}`}
              onClick={() => setHours(h)}
            >
              Last {h}h
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="chart-loading">Fetching telemetry data...</div>
      ) : points.length === 0 ? (
        <div className="chart-empty">No telemetry recorded for this timeframe.</div>
      ) : (
        <div className="chart-canvas-wrapper">
          <Line data={data} options={options} />
        </div>
      )}
    </div>
  );
}
