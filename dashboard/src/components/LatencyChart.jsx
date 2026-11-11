import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { api } from '../api.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip);

const RANGES = [1, 6, 24];

export default function LatencyChart({ device }) {
  const [hours, setHours] = useState(1);
  const [points, setPoints] = useState([]);

  // Reload when another device or range is chosen, and after every new check of this device.
  useEffect(() => {
    let cancelled = false;
    api
      .getMeasurements(device.id, hours)
      .then((list) => !cancelled && setPoints(list))
      .catch(() => !cancelled && setPoints([]));
    return () => {
      cancelled = true;
    };
  }, [device.id, device.lastChecked, hours]);

  const upCount = points.filter((p) => p.up).length;
  const uptime = points.length ? ((upCount / points.length) * 100).toFixed(1) : null;

  const data = {
    labels: points.map((p) => new Date(p.checkedAt).toLocaleTimeString()),
    datasets: [
      {
        label: 'Latency (ms)',
        data: points.map((p) => (p.up ? p.latencyMs : null)), // gaps where the device was down
        borderColor: '#2a6fdb',
        borderWidth: 2,
        pointRadius: points.length > 120 ? 0 : 2,
        tension: 0.2,
      },
    ],
  };
  const options = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { maxTicksLimit: 8 } },
      y: { beginAtZero: true, title: { display: true, text: 'ms' } },
    },
  };

  return (
    <>
      <div className="chart-head">
        <h2>
          {device.name} <span className="muted mono">{device.host}</span>
        </h2>
        <div>
          {uptime !== null && <span className="muted">Uptime {uptime}% · </span>}
          {RANGES.map((h) => (
            <button key={h} className={h === hours ? 'range active' : 'range'} onClick={() => setHours(h)}>
              {h} h
            </button>
          ))}
        </div>
      </div>
      {points.length === 0 ? (
        <p className="muted">No measurements in this time range yet.</p>
      ) : (
        <div className="chart">
          <Line data={data} options={options} />
        </div>
      )}
    </>
  );
}
