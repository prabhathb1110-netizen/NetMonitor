import { useEffect, useState, useRef } from 'react';
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
  const chartRef = useRef(null);

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
  const maxLat = points.filter((p) => p.latencyMs != null).length
    ? Math.max(...points.filter((p) => p.latencyMs != null).map((p) => p.latencyMs)).toFixed(1)
    : '—';
  const minLat = points.filter((p) => p.latencyMs != null).length
    ? Math.min(...points.filter((p) => p.latencyMs != null).map((p) => p.latencyMs)).toFixed(1)
    : '—';

  // Custom fiery orange glowing gradient
  const createGradient = (ctx) => {
    if (!ctx) return 'rgba(255, 106, 0, 0.15)';
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(255, 122, 24, 0.45)');
    gradient.addColorStop(0.5, 'rgba(255, 94, 0, 0.18)');
    gradient.addColorStop(1, 'rgba(255, 60, 0, 0.0)');
    return gradient;
  };

  const data = {
    labels: points.map((p) =>
      new Date(p.checkedAt || p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    ),
    datasets: [
      {
        label: 'Ping RTT (ms)',
        data: points.map((p) => (p.up ? p.latencyMs : null)),
        borderColor: '#ff7a18',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          return createGradient(ctx);
        },
        fill: true,
        borderWidth: 2.8,
        pointBackgroundColor: '#ff9d42',
        pointBorderColor: '#ff5e00',
        pointBorderWidth: 2,
        pointRadius: points.length > 50 ? 0 : 3.5,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#ff6a00',
        pointHoverBorderWidth: 3,
        tension: 0.38,
      },
    ],
  };

  const options = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(7, 10, 16, 0.92)',
        titleColor: '#f8fafc',
        bodyColor: '#ffae57',
        titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: '700' },
        bodyFont: { family: 'JetBrains Mono', size: 13, weight: '600' },
        borderColor: 'rgba(255, 120, 30, 0.4)',
        borderWidth: 1.5,
        padding: 12,
        cornerRadius: 10,
        displayColors: false,
        boxShadow: '0 0 16px rgba(255, 106, 0, 0.4)',
        callbacks: {
          label: (ctx) => `  ⚡ Response Time: ${ctx.parsed.y} ms`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false },
        ticks: { color: '#64748b', maxTicksLimit: 8, font: { family: 'Plus Jakarta Sans', size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false },
        ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 11 } },
        title: {
          display: true,
          text: 'Latency (ms)',
          color: '#8492a6',
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
        },
      },
    },
  };

  return (
    <div className="sonexo-graph-wrapper">
      {/* Graph Top Header Bar */}
      <div className="graph-header-flex">
        <div className="graph-device-meta">
          <div className="device-identity-group">
            <div className="device-beacon-glow"></div>
            <h3 className="device-heading">{device.name}</h3>
            <code className="device-ip-chip">{device.host}</code>
            <span className="device-group-chip">{device.deviceGroup || 'Infrastructure'}</span>
          </div>
          <div className="device-stat-pills">
            <div className="meta-pill">
              <span className="pill-lbl">Uptime SLA</span>
              <span className="pill-val text-green">{uptime !== null ? `${uptime}%` : '—'}</span>
            </div>
            <div className="meta-pill">
              <span className="pill-lbl">Avg Ping</span>
              <span className="pill-val val-orange">{avgLat} ms</span>
            </div>
            <div className="meta-pill">
              <span className="pill-lbl">Min / Max</span>
              <span className="pill-val text-dim">{minLat} / {maxLat} ms</span>
            </div>
            <div className="meta-pill">
              <span className="pill-lbl">Assigned Poller</span>
              <span className="pill-val val-orange">{device.agentId}</span>
            </div>
          </div>
        </div>

        {/* Time Window Capsule Buttons */}
        <div className="graph-range-capsule">
          {RANGES.map((h) => (
            <button
              key={h}
              className={`range-pill-btn ${h === hours ? 'range-pill-active' : ''}`}
              onClick={() => setHours(h)}
            >
              {h}h Window
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas Area */}
      {loading ? (
        <div className="graph-loading-state">
          <span className="sonexo-spinner"></span>
          <span>Streaming high-velocity telemetry points...</span>
        </div>
      ) : points.length === 0 ? (
        <div className="graph-empty-state">No telemetry recorded for this timeframe.</div>
      ) : (
        <div className="graph-canvas-container">
          <Line ref={chartRef} data={data} options={options} />
        </div>
      )}
    </div>
  );
}
