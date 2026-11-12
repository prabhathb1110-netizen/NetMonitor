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
    <div className="netmonitor-app-layout">
      {/* Top Application Bar */}
      <header className="app-header-bar">
        <div className="header-brand-group">
          <div className="brand-logo-ring"></div>
          <div className="brand-title-text">
            NetMonitor <span>Enterprise</span>
          </div>
        </div>

        {/* System Health Indicators */}
        <div className="header-status-ticker">
          <div className="status-pill-capsule">
            <span className="ticker-dot-beacon"></span>
            <span className="ticker-label-lead">SYSTEM HEALTH:</span>
            <span className="ticker-badge-item badge-green">{count('UP')} UP</span>
            {count('DEGRADED') > 0 && (
              <span className="ticker-badge-item badge-amber">{count('DEGRADED')} WARN</span>
            )}
            {count('DOWN') > 0 && (
              <span className="ticker-badge-item badge-red">{count('DOWN')} CRITICAL</span>
            )}
          </div>
        </div>

        {/* Header Action Elements */}
        <div className="header-right-actions">
          <button
            className="btn-glowing-primary"
            onClick={() => setTab('discovery')}
          >
            <span>+ Scan Network</span>
          </button>

          <div className="user-profile-capsule">
            <div className="user-avatar-initial">{user.username[0]}</div>
            <span className="user-name-label">{user.username}</span>
          </div>
        </div>
      </header>

      {/* Main Container Hero */}
      <section className="app-hero-section">
        <div className="hero-top-badge">
          <span className="ticker-dot-beacon"></span>
          <span>Distributed Multi-Segment Polling · Real-time WebSocket</span>
        </div>
        <h1 className="hero-main-heading">
          High-Velocity Network Telemetry with <span>NetMonitor</span>
        </h1>
        <p className="hero-lead-text">
          Continuous ICMP ping, TCP port analysis, and SNMP MIB-II performance metrics across discrete segments with zero delay.
        </p>
        <div className="hero-buttons-row">
          <button
            className="btn-glowing-primary"
            onClick={() => setTab('noc')}
          >
            Launch NOC Console
          </button>
          <button
            className="btn-secondary-outline"
            onClick={() => setTab('topology')}
          >
            View Network Topology ➔
          </button>
        </div>
      </section>

      {/* Main Glass Workspace Shell */}
      <main className="app-workspace-shell">
        {error && <div className="app-error-banner">⚠️ {error}</div>}

        {/* Tab Navigation Shelf */}
        <div className="app-tabs-shelf">
          <button
            className={`tab-shelf-btn ${tab === 'noc' ? 'tab-btn-active' : ''}`}
            onClick={() => setTab('noc')}
          >
            <span>⚡ NOC Overview</span>
          </button>

          <button
            className={`tab-shelf-btn ${tab === 'topology' ? 'tab-btn-active' : ''}`}
            onClick={() => setTab('topology')}
          >
            <span>🗺️ Business View (Topology)</span>
          </button>

          <button
            className={`tab-shelf-btn ${tab === 'inventory' ? 'tab-btn-active' : ''}`}
            onClick={() => setTab('inventory')}
          >
            <span>🖥️ Device Inventory ({devices.length})</span>
          </button>

          <button
            className={`tab-shelf-btn ${tab === 'discovery' ? 'tab-btn-active' : ''}`}
            onClick={() => setTab('discovery')}
          >
            <span>🔍 Subnet Ping Sweep</span>
          </button>

          <button
            className={`tab-shelf-btn ${tab === 'alarms' ? 'tab-btn-active' : ''}`}
            onClick={() => setTab('alarms')}
          >
            <span>🚨 Incident Alarms</span>
            {unackAlertsCount > 0 && <span className="tab-counter-badge">{unackAlertsCount}</span>}
          </button>

          <button
            className={`tab-shelf-btn ${tab === 'sla' ? 'tab-btn-active' : ''}`}
            onClick={() => setTab('sla')}
          >
            <span>📈 SLA & Telemetry CSV</span>
          </button>
        </div>

        {/* Tab 1: NOC Dashboard */}
        {tab === 'noc' && (
          <div>
            {/* KPI Stat Cards */}
            <div className="stat-cards-row">
              <div className="stat-overview-card">
                <div className="stat-card-top">
                  <span className="stat-card-title">TOTAL MONITORED</span>
                  <span>🌐</span>
                </div>
                <div className="stat-numeric-display val-orange">{devices.length}</div>
                <div className="stat-card-footer">Across {agents.length} Polling Agents</div>
              </div>

              <div className="stat-overview-card">
                <div className="stat-card-top">
                  <span className="stat-card-title">OPERATIONAL (UP)</span>
                  <span>🟢</span>
                </div>
                <div className="stat-numeric-display val-green">{count('UP')}</div>
                <div className="stat-card-footer">100% In SLA Window</div>
              </div>

              <div className="stat-overview-card">
                <div className="stat-card-top">
                  <span className="stat-card-title">DEGRADED / DELAY</span>
                  <span>🟡</span>
                </div>
                <div className="stat-numeric-display val-amber">{count('DEGRADED')}</div>
                <div className="stat-card-footer">Port Closed or Latency Spike</div>
              </div>

              <div className="stat-overview-card">
                <div className="stat-card-top">
                  <span className="stat-card-title">CRITICAL (DOWN)</span>
                  <span>🔴</span>
                </div>
                <div className="stat-numeric-display val-red">{count('DOWN')}</div>
                <div className="stat-card-footer">Immediate Intervention Required</div>
              </div>

              <div className="stat-overview-card">
                <div className="stat-card-top">
                  <span className="stat-card-title">SEGMENT AGENTS</span>
                  <span>⚡</span>
                </div>
                <div className="stat-numeric-display val-orange">
                  {agents.filter((a) => a.online).length}/{agents.length}
                </div>
                <div className="stat-card-footer">TLS Heartbeat Connected</div>
              </div>
            </div>

            {/* Modular Top-Talker Widgets */}
            <OpManagerWidgets
              devices={devices}
              alerts={alerts}
              onSelectDevice={setSelectedId}
            />

            {/* Selected Device Telemetry Graph */}
            {selected && (
              <section className="app-content-panel">
                <div className="panel-header-row">
                  <div>
                    <h3 className="panel-title-text">Telemetry Snapshot · {selected.name}</h3>
                    <p className="panel-desc-text">Live RTT Response Time & Packet Loss Graph</p>
                  </div>
                  <span className="panel-ip-badge">{selected.host}</span>
                </div>
                <LatencyChart device={selected} />
              </section>
            )}
          </div>
        )}

        {/* Tab 2: Topology / Business View */}
        {tab === 'topology' && (
          <section className="app-content-panel">
            <div className="panel-header-row">
              <div>
                <h3 className="panel-title-text">Network Business View & Layer-2 Hierarchy</h3>
                <p className="panel-desc-text">Interconnected segments from Gateway Routers to Distribution & Endpoints</p>
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
          <div className="app-inventory-stack">
            <section className="app-content-panel">
              <div className="panel-header-row">
                <div>
                  <h3 className="panel-title-text">Multi-Vendor Device Roster</h3>
                  <p className="panel-desc-text">ICMP echo, TCP multi-port checks, and SNMP v2c/v3 profiles</p>
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

            <section className="app-content-panel">
              <div className="panel-header-row">
                <div>
                  <h3 className="panel-title-text">Distributed Monitoring Agents (FR6)</h3>
                  <p className="panel-desc-text">Outbound TLS socket links with 1-hour offline FIFO buffer</p>
                </div>
              </div>
              <AgentList agents={agents} devices={devices} />
            </section>
          </div>
        )}

        {/* Tab 4: Subnet Discovery */}
        {tab === 'discovery' && (
          <section className="app-content-panel">
            <SubnetDiscovery agents={agents} onAddDevice={addDevice} />
          </section>
        )}

        {/* Tab 5: Alarms */}
        {tab === 'alarms' && (
          <section className="app-content-panel">
            <div className="panel-header-row">
              <div>
                <h3 className="panel-title-text">Incident Alarm Feed & Threshold Breaches</h3>
                <p className="panel-desc-text">Event log with operator acknowledgement state</p>
              </div>
            </div>
            <AlertPanel alerts={alerts} onAcknowledge={ackAlert} />
          </section>
        )}

        {/* Tab 6: SLA Reports */}
        {tab === 'sla' && (
          <section className="app-content-panel">
            <ReportsView />
          </section>
        )}
      </main>

      <footer className="app-footer-bar">
        NetMonitor · Distributed Network Management System · Developed by Wijerathna K.A.A.M. (EG/2023/5971)
      </footer>
    </div>
  );
}
