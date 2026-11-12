import { useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SystemHealthPie({ devices = [], agents = [], alerts = [] }) {
  const [chartType, setChartType] = useState('donut'); // default donut or pie

  const upCount = devices.filter((d) => d.status === 'UP').length;
  const warnCount = devices.filter((d) => d.status === 'DEGRADED').length;
  const critCount = devices.filter((d) => d.status === 'DOWN').length;
  const total = devices.length;

  const pctUp = total > 0 ? Math.round((upCount / total) * 100) : 0;
  const pctWarn = total > 0 ? Math.round((warnCount / total) * 100) : 0;
  const pctCrit = total > 0 ? Math.round((critCount / total) * 100) : 0;
  const healthPct = total > 0 ? Math.round((upCount / total) * 100) : 100;

  const onlineAgents = agents.filter((a) => a.online).length;
  const totalAgents = agents.length || 2;
  const unackAlerts = alerts.filter((a) => !a.acknowledged).length;

  // Chart configuration
  const chartData = {
    labels: ['Operational (UP)', 'Degraded (WARN)', 'Critical (DOWN)'],
    datasets: [
      {
        data: total > 0 ? [upCount, warnCount, critCount] : [1, 0, 0],
        backgroundColor:
          total > 0
            ? [
                'rgba(16, 185, 129, 0.88)', // neon green
                'rgba(245, 158, 11, 0.88)', // neon amber
                'rgba(239, 68, 68, 0.88)',  // neon crimson
              ]
            : ['rgba(255, 255, 255, 0.12)'],
        borderColor:
          total > 0
            ? ['#10b981', '#f59e0b', '#ef4444']
            : ['rgba(255, 255, 255, 0.25)'],
        borderWidth: 2,
        hoverBorderColor: '#ffffff',
        hoverBorderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 500,
      easing: 'easeOutQuart',
    },
    cutout: chartType === 'donut' ? '64%' : '0%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(10, 14, 23, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#ffae57',
        borderColor: 'rgba(255, 106, 0, 0.4)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4,
        callbacks: {
          label: function (context) {
            if (total === 0) return ' No endpoints monitored';
            const val = context.raw || 0;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return ` ${context.label}: ${val} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="system-health-panoramic-card">
      {/* Deck Header Bar */}
      <div className="health-deck-header">
        <div className="deck-title-group">
          <span className="health-pulse-dot"></span>
          <div>
            <h3 className="deck-title">SYSTEM HEALTH & INFRASTRUCTURE TELEMETRY</h3>
            <span className="deck-subtitle">
              Live Network Telemetry · {total} Monitored Endpoints Across {totalAgents} Polling Agents
            </span>
          </div>
        </div>

        <div className="deck-header-right">
          <div className="deck-live-stream-badge">
            <span className="live-stream-beacon"></span>
            <span>100% LIVE WEBSOCKET</span>
          </div>

          <div className="health-pie-toggle-group">
            <button
              type="button"
              className={`health-toggle-pill ${chartType === 'donut' ? 'active' : ''}`}
              onClick={() => setChartType('donut')}
              title="Display as Donut Chart"
            >
              Donut
            </button>
            <button
              type="button"
              className={`health-toggle-pill ${chartType === 'pie' ? 'active' : ''}`}
              onClick={() => setChartType('pie')}
              title="Display as Pie Chart"
            >
              Pie
            </button>
          </div>
        </div>
      </div>

      {/* Panoramic 3-Column Grid Filling Full Width */}
      <div className="health-deck-grid">
        {/* Column 1: Visual Pie/Donut Chart */}
        <div className="deck-column deck-col-chart">
          <div className="deck-col-label">
            <span>HEALTH BREAKDOWN</span>
            <span className="col-subtag">{total} Devices</span>
          </div>

          <div className="health-chart-wrapper">
            {chartType === 'donut' ? (
              <Doughnut data={chartData} options={chartOptions} />
            ) : (
              <Pie data={chartData} options={chartOptions} />
            )}

            {chartType === 'donut' && (
              <div className="donut-center-badge">
                <span className="donut-center-value">{healthPct}%</span>
                <span className="donut-center-label">OPTIMAL</span>
              </div>
            )}
          </div>

          <div className="chart-quick-chips">
            <span className="chart-chip chip-green">
              <span className="chip-dot"></span>
              <strong>{upCount}</strong> UP
            </span>
            <span className="chart-chip chip-amber">
              <span className="chip-dot"></span>
              <strong>{warnCount}</strong> WARN
            </span>
            <span className="chart-chip chip-red">
              <span className="chip-dot"></span>
              <strong>{critCount}</strong> DOWN
            </span>
          </div>
        </div>

        {/* Column 2: Status Breakdown & SLA Bars */}
        <div className="deck-column deck-col-sla">
          <div className="deck-col-label">
            <span>DEVICE STATUS & SLA COMPLIANCE</span>
            <span className="col-subtag text-amber">
              {healthPct >= 80 ? 'Within Target' : 'Attention Required'}
            </span>
          </div>

          <div className="sla-progress-stack">
            {/* Operational Track */}
            <div className="sla-progress-item">
              <div className="sla-item-top">
                <div className="sla-item-title">
                  <span className="status-indicator-dot dot-green"></span>
                  <strong>Operational (UP)</strong>
                </div>
                <div className="sla-item-val text-green">
                  {upCount} of {total} Nodes ({pctUp}%)
                </div>
              </div>
              <div className="sla-track-bar">
                <div
                  className="sla-fill-bar bar-green"
                  style={{ width: `${pctUp}%` }}
                ></div>
              </div>
              <span className="sla-item-sub">Passing continuous ICMP & port handshakes</span>
            </div>

            {/* Degraded Track */}
            <div className="sla-progress-item">
              <div className="sla-item-top">
                <div className="sla-item-title">
                  <span className="status-indicator-dot dot-amber"></span>
                  <strong>Degraded (WARN)</strong>
                </div>
                <div className="sla-item-val text-amber">
                  {warnCount} of {total} Nodes ({pctWarn}%)
                </div>
              </div>
              <div className="sla-track-bar">
                <div
                  className="sla-fill-bar bar-amber"
                  style={{ width: `${pctWarn}%` }}
                ></div>
              </div>
              <span className="sla-item-sub">Closed TCP port or RTT latency spike</span>
            </div>

            {/* Critical Track */}
            <div className="sla-progress-item">
              <div className="sla-item-top">
                <div className="sla-item-title">
                  <span className="status-indicator-dot dot-red"></span>
                  <strong>Critical (DOWN)</strong>
                </div>
                <div className="sla-item-val text-red">
                  {critCount} of {total} Nodes ({pctCrit}%)
                </div>
              </div>
              <div className="sla-track-bar">
                <div
                  className="sla-fill-bar bar-red"
                  style={{ width: `${pctCrit}%` }}
                ></div>
              </div>
              <span className="sla-item-sub">Unreachable endpoint / 100% packet loss</span>
            </div>
          </div>

          <div className="sla-deck-footer">
            <span>Overall SLA Health:</span>
            <strong className={healthPct >= 80 ? 'text-green' : 'text-amber'}>
              {healthPct}% Optimal Telemetry
            </strong>
          </div>
        </div>

        {/* Column 3: Infrastructure Pulse & Agent Metrics */}
        <div className="deck-column deck-col-pulse">
          <div className="deck-col-label">
            <span>REAL-TIME INFRASTRUCTURE PULSE</span>
            <span className="col-subtag text-green">Telemetry Active</span>
          </div>

          <div className="pulse-tiles-grid">
            <div className="pulse-stat-tile">
              <div className="pulse-tile-header">
                <span className="pulse-tile-icon">🌐</span>
                <span className="pulse-tile-title">TOTAL MONITORED</span>
              </div>
              <div className="pulse-tile-value val-orange">{total}</div>
              <span className="pulse-tile-sub">Active Network Nodes</span>
            </div>

            <div className="pulse-stat-tile">
              <div className="pulse-tile-header">
                <span className="pulse-tile-icon">⚡</span>
                <span className="pulse-tile-title">POLLING AGENTS</span>
              </div>
              <div className="pulse-tile-value val-green">
                {onlineAgents}/{totalAgents}
              </div>
              <span className="pulse-tile-sub">TLS Heartbeat Connected</span>
            </div>

            <div className="pulse-stat-tile">
              <div className="pulse-tile-header">
                <span className="pulse-tile-icon">🚨</span>
                <span className="pulse-tile-title">INCIDENT ALARMS</span>
              </div>
              <div className={`pulse-tile-value ${unackAlerts > 0 ? 'val-red' : 'val-green'}`}>
                {unackAlerts}
              </div>
              <span className="pulse-tile-sub">
                {unackAlerts > 0 ? 'Pending Operator Ack' : 'All Clear / No Hotlist'}
              </span>
            </div>

            <div className="pulse-stat-tile">
              <div className="pulse-tile-header">
                <span className="pulse-tile-icon">📡</span>
                <span className="pulse-tile-title">SWEEP CADENCE</span>
              </div>
              <div className="pulse-tile-value val-orange">30s</div>
              <span className="pulse-tile-sub">Live ICMP & SNMP Poll</span>
            </div>
          </div>

          <div className="pulse-stream-footer">
            <span className="pulse-beacon-dot"></span>
            <span>Zero delay push broadcast via WebSocket gateway</span>
          </div>
        </div>
      </div>
    </div>
  );
}
