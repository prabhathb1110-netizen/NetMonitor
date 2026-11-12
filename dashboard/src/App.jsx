import { useCallback, useEffect, useState } from 'react';
import { api, connectLive } from './api.js';
import DeviceTable from './components/DeviceTable.jsx';
import DeviceForm from './components/DeviceForm.jsx';
import AgentList from './components/AgentList.jsx';
import LatencyChart from './components/LatencyChart.jsx';
import SubnetDiscovery from './components/SubnetDiscovery.jsx';
import AlertPanel from './components/AlertPanel.jsx';
import ReportsView from './components/ReportsView.jsx';
import OpManagerTopology from './components/OpManagerTopology.jsx';
import OpManagerWidgets from './components/OpManagerWidgets.jsx';

function upsert(list, item) {
  return list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [...list, item];
}

export default function App() {
  const [tab, setTab] = useState('noc');
  const [devices, setDevices] = useState([]);
  const [agents, setAgents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [live, setLive] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState({ username: 'Achintha', role: 'ADMIN' });

  const loadAll = useCallback(() => {
    Promise.all([api.getDevices(), api.getAgents(), api.getAlerts()])
      .then(([deviceList, agentList, alertList]) => {
        setDevices(deviceList);
        setAgents(agentList);
        setAlerts(alertList);
        setError('');
        if (!selectedId && deviceList.length > 0) {
          setSelectedId(deviceList[0].id);
        }
      })
      .catch((e) => setError(`Cannot reach the server: ${e.message}`));
  }, [selectedId]);

  useEffect(() => {
    return connectLive(
      (message) => {
        if (message.type === 'device') setDevices((list) => upsert(list, message.data));
        if (message.type === 'agent') setAgents((list) => upsert(list, message.data));
        if (message.type === 'alert') setAlerts((list) => [message.data, ...list]);
        if (message.type === 'alertAck') {
          setAlerts((list) =>
            list.map((a) => (a.id === message.data.id ? message.data : a))
          );
        }
        if (message.type === 'deviceRemoved') {
          setDevices((list) => list.filter((d) => d.id !== message.data));
        }
      },
      (connected) => {
        setLive(connected);
        if (connected) loadAll();
      }
    );
  }, [loadAll]);

  useEffect(loadAll, [loadAll]);

  async function addDevice(device) {
    await api.addDevice(device);
  }

  async function removeDevice(device) {
    if (user.role !== 'ADMIN') {
      alert('Only ADMIN users can remove devices.');
      return;
    }
    if (!window.confirm(`Remove ${device.name} and its telemetry history?`)) return;
    try {
      await api.deleteDevice(device.id);
      setDevices((list) => list.filter((d) => d.id !== device.id));
      if (selectedId === device.id) setSelectedId(null);
    } catch (e) {
      setError(e.message);
    }
  }

  async function ackAlert(id) {
    try {
      await api.acknowledgeAlert(id);
    } catch (e) {
      setError(e.message);
    }
  }

  const count = (status) => devices.filter((d) => d.status === status).length;
  const selected = devices.find((d) => d.id === selectedId) || null;
  const unackAlertsCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="sonexo-layout">
      {/* Sonexo-Style Top Navigation */}
      <header className="sonexo-header">
        <div className="sonexo-brand">
          <div className="sonexo-logo-ring"></div>
          <div className="sonexo-brand-name">
            NetMonitor <span>Sonexo</span>
          </div>
        </div>

        {/* Center Incident Pills */}
        <div className="sonexo-nav-center">
          <div className="pill-ticker-wrap">
            <span className="ticker-dot ticker-dot-orange"></span>
            <span>SYSTEM HEALTH:</span>
            <span className="ticker-badge-val ticker-badge-up">{count('UP')} UP</span>
            {count('DEGRADED') > 0 && (
              <span className="ticker-badge-val ticker-badge-warn">{count('DEGRADED')} WARN</span>
            )}
            {count('DOWN') > 0 && (
              <span className="ticker-badge-val ticker-badge-down">{count('DOWN')} CRITICAL</span>
            )}
          </div>
        </div>

        {/* Right Action Elements */}
        <div className="sonexo-header-right">
          <button
            className="btn-glowing-orange"
            onClick={() => setTab('discovery')}
          >
            <span>+ Scan Network</span>
          </button>

          <div className="sonexo-user-pill">
            <div className="user-avatar-glow">{user.username[0]}</div>
            <span>{user.username}</span>
          </div>
        </div>
      </header>

      {/* Hero Showcase (Matching Sonexo's glowing headline & capsule button layout) */}
      <section className="sonexo-hero-banner">
        <div className="hero-pill-badge">
          <span className="ticker-dot ticker-dot-orange"></span>
          <span>Distributed Multi-Segment Polling · Real-time WebSocket</span>
        </div>
        <h1 className="hero-headline">
          High-Velocity Network Telemetry with <span>NetMonitor</span>
        </h1>
        <p className="hero-subtext">
          Continuous ICMP ping, TCP port analysis, and SNMP MIB-II performance metrics across discrete segments with zero delay.
        </p>
        <div className="hero-cta-group">
          <button
            className="btn-glowing-orange"
            onClick={() => setTab('noc')}
          >
            Launch NOC Console
          </button>
          <button
            className="btn-secondary-glow"
            onClick={() => setTab('topology')}
          >
            View Network Topology ➔
          </button>
        </div>
      </section>

      {/* Master Framed Application Dashboard */}
      <main className="sonexo-main-shell">
        {error && <div className="error-banner">⚠️ {error}</div>}

        {/* Sonexo Segmented Navigation Bar */}
        <div className="sonexo-tabs-bar">
          <button
            className={`sonexo-tab-btn ${tab === 'noc' ? 'sonexo-tab-active' : ''}`}
            onClick={() => setTab('noc')}
          >
            <span>⚡ NOC Overview</span>
          </button>

          <button
            className={`sonexo-tab-btn ${tab === 'topology' ? 'sonexo-tab-active' : ''}`}
            onClick={() => setTab('topology')}
          >
            <span>🗺️ Business View (Topology)</span>
          </button>

          <button
            className={`sonexo-tab-btn ${tab === 'inventory' ? 'sonexo-tab-active' : ''}`}
            onClick={() => setTab('inventory')}
          >
            <span>🖥️ Device Inventory ({devices.length})</span>
          </button>

          <button
            className={`sonexo-tab-btn ${tab === 'discovery' ? 'sonexo-tab-active' : ''}`}
            onClick={() => setTab('discovery')}
          >
            <span>🔍 Subnet Ping Sweep</span>
          </button>

          <button
            className={`sonexo-tab-btn ${tab === 'alarms' ? 'sonexo-tab-active' : ''}`}
            onClick={() => setTab('alarms')}
          >
            <span>🚨 Incident Alarms</span>
            {unackAlertsCount > 0 && <span className="tab-badge-glow">{unackAlertsCount}</span>}
          </button>

          <button
            className={`sonexo-tab-btn ${tab === 'sla' ? 'sonexo-tab-active' : ''}`}
            onClick={() => setTab('sla')}
          >
            <span>📈 SLA & Telemetry CSV</span>
          </button>
        </div>

        {/* Tab 1: NOC Dashboard */}
        {tab === 'noc' && (
          <div>
            {/* KPI Stat Cards with Sonexo 3D Bevel & Neon Headers */}
            <div className="sonexo-stat-grid">
              <div className="sonexo-card">
                <div className="stat-top-row">
                  <span className="stat-label-title">TOTAL MONITORED</span>
                  <span>🌐</span>
                </div>
                <div className="stat-big-val val-orange">{devices.length}</div>
                <div className="stat-footer-text">Across {agents.length} Polling Agents</div>
              </div>

              <div className="sonexo-card">
                <div className="stat-top-row">
                  <span className="stat-label-title">OPERATIONAL (UP)</span>
                  <span>🟢</span>
                </div>
                <div className="stat-big-val val-green">{count('UP')}</div>
                <div className="stat-footer-text">100% In SLA Window</div>
              </div>

              <div className="sonexo-card">
                <div className="stat-top-row">
                  <span className="stat-label-title">DEGRADED / DELAY</span>
                  <span>🟡</span>
                </div>
                <div className="stat-big-val val-amber">{count('DEGRADED')}</div>
                <div className="stat-footer-text">Port Closed or Latency Spike</div>
              </div>

              <div className="sonexo-card">
                <div className="stat-top-row">
                  <span className="stat-label-title">CRITICAL (DOWN)</span>
                  <span>🔴</span>
                </div>
                <div className="stat-big-val val-red">{count('DOWN')}</div>
                <div className="stat-footer-text">Immediate Intervention Required</div>
              </div>

              <div className="sonexo-card">
                <div className="stat-top-row">
                  <span className="stat-label-title">SEGMENT AGENTS</span>
                  <span>⚡</span>
                </div>
                <div className="stat-big-val val-orange">
                  {agents.filter((a) => a.online).length}/{agents.length}
                </div>
                <div className="stat-footer-text">TLS Heartbeat Connected</div>
              </div>
            </div>

            {/* Modular OpManager Top-Talker Widgets */}
            <OpManagerWidgets
              devices={devices}
              alerts={alerts}
              onSelectDevice={setSelectedId}
            />

            {/* Selected Device Telemetry Graph */}
            {selected && (
              <section className="sonexo-panel">
                <div className="panel-header-row">
                  <div>
                    <h3 className="panel-title">Telemetry Snapshot · {selected.name}</h3>
                    <p className="muted">Live RTT Response Time & Packet Loss Graph</p>
                  </div>
                  <span className="sonexo-chip">{selected.host}</span>
                </div>
                <LatencyChart device={selected} />
              </section>
            )}
          </div>
        )}

        {/* Tab 2: Topology / Business View */}
        {tab === 'topology' && (
          <section className="sonexo-panel">
            <div className="panel-header-row">
              <div>
                <h3 className="panel-title">Network Business View & Layer-2 Hierarchy</h3>
                <p className="muted">Interconnected segments from Gateway Routers to Distribution & Endpoints</p>
              </div>
            </div>
            <OpManagerTopology
              devices={devices}
              selectedId={selectedId}
              onSelectDevice={(id) => {
                setSelectedId(id);
                setTab('noc');
              }}
            />
          </section>
        )}

        {/* Tab 3: Device Inventory */}
        {tab === 'inventory' && (
          <div className="sonexo-inventory">
            <section className="sonexo-panel">
              <div className="panel-header-row">
                <div>
                  <h3 className="panel-title">Multi-Vendor Device Roster</h3>
                  <p className="muted">ICMP echo, TCP multi-port checks, and SNMP v2c/v3 profiles</p>
                </div>
              </div>

              <DeviceTable
                devices={devices}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onRemove={removeDevice}
              />

              {user.role === 'ADMIN' && (
                <div style={{ marginTop: '24px' }}>
                  <DeviceForm agents={agents} onAdd={addDevice} />
                </div>
              )}
            </section>

            <section className="sonexo-panel">
              <div className="panel-header-row">
                <div>
                  <h3 className="panel-title">Distributed Monitoring Agents (FR6)</h3>
                  <p className="muted">Outbound TLS socket links with 1-hour offline FIFO buffer</p>
                </div>
              </div>
              <AgentList agents={agents} devices={devices} />
            </section>
          </div>
        )}

        {/* Tab 4: Subnet Discovery */}
        {tab === 'discovery' && (
          <section className="sonexo-panel">
            <SubnetDiscovery agents={agents} onAddDevice={addDevice} />
          </section>
        )}

        {/* Tab 5: Alarms */}
        {tab === 'alarms' && (
          <section className="sonexo-panel">
            <div className="panel-header-row">
              <div>
                <h3 className="panel-title">Incident Alarm Feed & Threshold Breaches</h3>
                <p className="muted">Event log with operator acknowledgement state</p>
              </div>
            </div>
            <AlertPanel alerts={alerts} onAcknowledge={ackAlert} />
          </section>
        )}

        {/* Tab 6: SLA Reports */}
        {tab === 'sla' && (
          <section className="sonexo-panel">
            <ReportsView />
          </section>
        )}
      </main>

      <footer className="sonexo-footer">
        NetMonitor · Distributed Network Management System · Designed by Wijerathna K.A.A.M. (EG/2023/5971)
      </footer>
    </div>
  );
}
