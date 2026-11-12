import { useCallback, useEffect, useState } from 'react';
import { api, connectLive } from './api.js';
import DeviceTable from './components/DeviceTable.jsx';
import DeviceForm from './components/DeviceForm.jsx';
import AgentList from './components/AgentList.jsx';
import LatencyChart from './components/LatencyChart.jsx';
import SubnetDiscovery from './components/SubnetDiscovery.jsx';
import AlertPanel from './components/AlertPanel.jsx';
import ReportsView from './components/ReportsView.jsx';

function upsert(list, item) {
  return list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [...list, item];
}

export default function App() {
  const [tab, setTab] = useState('devices');
  const [devices, setDevices] = useState([]);
  const [agents, setAgents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [live, setLive] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState({ username: 'admin', role: 'ADMIN' });

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
    <div className="netmonitor-layout">
      {/* Top Navigation Bar */}
      <header className="netmonitor-navbar">
        <div className="navbar-brand">
          <div className="brand-logo-hex">
            <span className="hex-icon">⚡</span>
          </div>
          <div>
            <div className="brand-title">
              NET<span>MONITOR</span>
            </div>
            <div className="brand-sub">Distributed Network Management Suite</div>
          </div>
        </div>

        <div className="navbar-controls">
          <div className="live-pill-glass">
            <span className={`live-beacon ${live ? 'beacon-pulse-green' : 'beacon-red'}`}></span>
            <span>{live ? 'TELEMETRY LIVE' : 'RECONNECTING'}</span>
          </div>

          <div className="user-profile-badge">
            <div className="user-avatar-circle">
              {user.username.slice(0, 1).toUpperCase()}
            </div>
            <div className="user-text-info">
              <span className="user-name">{user.username}</span>
              <span className="user-role-tag">{user.role}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="netmonitor-content">
        {error && <div className="error-banner">⚠️ {error}</div>}

        {/* Navigation Tabs */}
        <div className="nav-tabs-glass">
          <button
            className={`tab-item ${tab === 'devices' ? 'tab-item-active' : ''}`}
            onClick={() => setTab('devices')}
          >
            <span className="tab-icon">📊</span>
            <span>Dashboard & Devices</span>
            <span className="tab-pill-count">{devices.length}</span>
          </button>

          <button
            className={`tab-item ${tab === 'discovery' ? 'tab-item-active' : ''}`}
            onClick={() => setTab('discovery')}
          >
            <span className="tab-icon">🔍</span>
            <span>Subnet Discovery</span>
          </button>

          <button
            className={`tab-item ${tab === 'alerts' ? 'tab-item-active' : ''}`}
            onClick={() => setTab('alerts')}
          >
            <span className="tab-icon">🚨</span>
            <span>Incident Alerts</span>
            {unackAlertsCount > 0 && (
              <span className="tab-pill-alert">{unackAlertsCount}</span>
            )}
          </button>

          <button
            className={`tab-item ${tab === 'reports' ? 'tab-item-active' : ''}`}
            onClick={() => setTab('reports')}
          >
            <span className="tab-icon">📈</span>
            <span>SLA Reports & CSV</span>
          </button>
        </div>

        {/* Tab 1: Dashboard & Devices */}
        {tab === 'devices' && (
          <div className="dashboard-grid">
            {/* KPI Stat Cards */}
            <div className="kpi-cards-grid">
              <div className="kpi-card kpi-total">
                <div className="kpi-top">
                  <span className="kpi-title">TOTAL DEVICES</span>
                  <span className="kpi-icon">🖥️</span>
                </div>
                <div className="kpi-value">{devices.length}</div>
                <div className="kpi-sub">Across {agents.length} network segments</div>
              </div>

              <div className="kpi-card kpi-up">
                <div className="kpi-top">
                  <span className="kpi-title">HEALTHY (UP)</span>
                  <span className="kpi-icon">🟢</span>
                </div>
                <div className="kpi-value text-green">{count('UP')}</div>
                <div className="kpi-sub">Operational within SLA</div>
              </div>

              <div className="kpi-card kpi-warn">
                <div className="kpi-top">
                  <span className="kpi-title">DEGRADED</span>
                  <span className="kpi-icon">🟡</span>
                </div>
                <div className="kpi-value text-amber">{count('DEGRADED')}</div>
                <div className="kpi-sub">Packet loss or closed port</div>
              </div>

              <div className="kpi-card kpi-down">
                <div className="kpi-top">
                  <span className="kpi-title">CRITICAL (DOWN)</span>
                  <span className="kpi-icon">🔴</span>
                </div>
                <div className="kpi-value text-red">{count('DOWN')}</div>
                <div className="kpi-sub">Immediate action required</div>
              </div>

              <div className="kpi-card kpi-agents">
                <div className="kpi-top">
                  <span className="kpi-title">ACTIVE AGENTS</span>
                  <span className="kpi-icon">⚡</span>
                </div>
                <div className="kpi-value text-cyan">
                  {agents.filter((a) => a.online).length}/{agents.length}
                </div>
                <div className="kpi-sub">Distributed polling workers</div>
              </div>
            </div>

            {/* Live Chart Section */}
            {selected && (
              <section className="glass-panel">
                <LatencyChart device={selected} />
              </section>
            )}

            {/* Devices Table Panel */}
            <section className="glass-panel">
              <div className="panel-header-row">
                <div>
                  <h3 className="panel-title">Monitored Network Endpoints</h3>
                  <p className="muted">Live ICMP, TCP service state & SNMP telemetry across segments</p>
                </div>
              </div>

              <DeviceTable
                devices={devices}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onRemove={removeDevice}
              />

              {user.role === 'ADMIN' && (
                <div style={{ marginTop: '20px' }}>
                  <DeviceForm agents={agents} onAdd={addDevice} />
                </div>
              )}
            </section>

            {/* Distributed Agents Panel */}
            <section className="glass-panel">
              <div className="panel-header-row">
                <div>
                  <h3 className="panel-title">Distributed Monitoring Agents</h3>
                  <p className="muted">Outbound TLS sockets with 1-hour offline FIFO buffering</p>
                </div>
              </div>
              <AgentList agents={agents} devices={devices} />
            </section>
          </div>
        )}

        {/* Tab 2: Discovery */}
        {tab === 'discovery' && (
          <section className="glass-panel">
            <SubnetDiscovery agents={agents} onAddDevice={addDevice} />
          </section>
        )}

        {/* Tab 3: Alerts */}
        {tab === 'alerts' && (
          <section className="glass-panel">
            <div className="panel-header-row">
              <div>
                <h3 className="panel-title">Threshold Violations & Incidents</h3>
                <p className="muted">Real-time alerts triggered on packet loss, host failures, or latency spikes</p>
              </div>
            </div>
            <AlertPanel alerts={alerts} onAcknowledge={ackAlert} />
          </section>
        )}

        {/* Tab 4: Reports */}
        {tab === 'reports' && (
          <section className="glass-panel">
            <ReportsView />
          </section>
        )}
      </main>
    </div>
  );
}
