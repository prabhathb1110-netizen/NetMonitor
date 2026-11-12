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
  const [user, setUser] = useState({ username: 'admin', role: 'ADMIN' });
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());

  const loadAll = useCallback(() => {
    Promise.all([api.getDevices(), api.getAgents(), api.getAlerts()])
      .then(([deviceList, agentList, alertList]) => {
        setDevices(deviceList);
        setAgents(agentList);
        setAlerts(alertList);
        setLastRefreshed(new Date().toLocaleTimeString());
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
    <div className="netmonitor-layout opmanager-theme">
      {/* OpManager Top App Bar */}
      <header className="opm-navbar">
        <div className="opm-nav-left">
          <div className="opm-brand-badge">
            <span className="opm-brand-logo">📊</span>
            <div>
              <div className="opm-brand-name">
                NetMonitor <span>OpManager Edition</span>
              </div>
              <div className="opm-brand-sub">Enterprise IT Infrastructure Monitoring</div>
            </div>
          </div>
        </div>

        <div className="opm-nav-center">
          <div className="opm-alarm-ticker">
            <span className="ticker-label">INCIDENT ALARMS:</span>
            <span className="ticker-badge ticker-crit">{count('DOWN')} Down</span>
            <span className="ticker-badge ticker-warn">{count('DEGRADED')} Trouble</span>
            <span className="ticker-badge ticker-good">{count('UP')} Clear</span>
          </div>
        </div>

        <div className="opm-nav-right">
          <div className="opm-refresh-badge">
            <span className="refresh-icon">🔄</span>
            <span>Live Polling (Every 5s) · {lastRefreshed}</span>
          </div>
          <div className="opm-live-indicator">
            <span className={`opm-beacon ${live ? 'beacon-pulse' : 'beacon-offline'}`}></span>
            <span>{live ? 'NOC LIVE' : 'DISCONNECTED'}</span>
          </div>
          <div className="opm-user-chip">
            <div className="user-initial">{user.username[0].toUpperCase()}</div>
            <span>{user.username} ({user.role})</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="opm-main-content">
        {error && <div className="error-banner">⚠️ {error}</div>}

        {/* Tab Navigation (OpManager Style) */}
        <div className="opm-tabs-shelf">
          <button
            className={`opm-tab ${tab === 'noc' ? 'opm-tab-active' : ''}`}
            onClick={() => setTab('noc')}
          >
            <span className="tab-icon">🖥️</span>
            <span>NOC Overview & Top-Talkers</span>
          </button>

          <button
            className={`opm-tab ${tab === 'topology' ? 'opm-tab-active' : ''}`}
            onClick={() => setTab('topology')}
          >
            <span className="tab-icon">🗺️</span>
            <span>Business View (Topology)</span>
          </button>

          <button
            className={`opm-tab ${tab === 'inventory' ? 'opm-tab-active' : ''}`}
            onClick={() => setTab('inventory')}
          >
            <span className="tab-icon">📋</span>
            <span>Device Inventory ({devices.length})</span>
          </button>

          <button
            className={`opm-tab ${tab === 'discovery' ? 'opm-tab-active' : ''}`}
            onClick={() => setTab('discovery')}
          >
            <span className="tab-icon">🔍</span>
            <span>Subnet Discovery</span>
          </button>

          <button
            className={`opm-tab ${tab === 'alarms' ? 'opm-tab-active' : ''}`}
            onClick={() => setTab('alarms')}
          >
            <span className="tab-icon">🚨</span>
            <span>Alarms & Traps</span>
            {unackAlertsCount > 0 && <span className="tab-pill-alert">{unackAlertsCount}</span>}
          </button>

          <button
            className={`opm-tab ${tab === 'sla' ? 'opm-tab-active' : ''}`}
            onClick={() => setTab('sla')}
          >
            <span className="tab-icon">📈</span>
            <span>SLA Performance & CSV</span>
          </button>
        </div>

        {/* Tab 1: NOC Overview (OpManager Dashboards) */}
        {tab === 'noc' && (
          <div className="opm-dashboard-view">
            {/* OpManager Top Metric Dials */}
            <div className="opm-metric-tiles">
              <div className="opm-tile opm-tile-total">
                <div className="tile-head">TOTAL MONITORED</div>
                <div className="tile-value">{devices.length}</div>
                <div className="tile-footer">Across {agents.length} Polling Segments</div>
              </div>

              <div className="opm-tile opm-tile-healthy">
                <div className="tile-head">HEALTHY / AVAILABLE</div>
                <div className="tile-value text-green">{count('UP')}</div>
                <div className="tile-footer">100% In Service</div>
              </div>

              <div className="opm-tile opm-tile-warn">
                <div className="tile-head">ATTENTION REQUIRED</div>
                <div className="tile-value text-amber">{count('DEGRADED')}</div>
                <div className="tile-footer">Closed Ports / Latency Spikes</div>
              </div>

              <div className="opm-tile opm-tile-down">
                <div className="tile-head">DEVICES DOWN</div>
                <div className="tile-value text-red">{count('DOWN')}</div>
                <div className="tile-footer">Unreachable Node Alarm</div>
              </div>

              <div className="opm-tile opm-tile-agents">
                <div className="tile-head">DISTRIBUTED COLLECTORS</div>
                <div className="tile-value text-cyan">
                  {agents.filter((a) => a.online).length} / {agents.length}
                </div>
                <div className="tile-footer">Active TLS Socket Agents</div>
              </div>
            </div>

            {/* Modular OpManager Widgets (Top CPU, Response Time, Alarms) */}
            <OpManagerWidgets
              devices={devices}
              alerts={alerts}
              onSelectDevice={setSelectedId}
            />

            {/* Live Telemetry Dial & Drill-Down Snapshot */}
            {selected && (
              <section className="glass-panel opm-drilldown-panel">
                <div className="panel-header-row">
                  <div>
                    <h3 className="panel-title">Device Telemetry Snapshot · {selected.name}</h3>
                    <p className="muted">Live Response Time, Packet Loss & Interface Analytics</p>
                  </div>
                  <span className="badge-opm-tag">{selected.host}</span>
                </div>
                <LatencyChart device={selected} />
              </section>
            )}
          </div>
        )}

        {/* Tab 2: Topology / Business View */}
        {tab === 'topology' && (
          <section className="glass-panel">
            <div className="panel-header-row">
              <div>
                <h3 className="panel-title">Network Business View & Layer-2 Topology Map</h3>
                <p className="muted">Visual network hierarchy with live traffic light status and link telemetry</p>
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
          <div className="opm-inventory-view">
            <section className="glass-panel">
              <div className="panel-header-row">
                <div>
                  <h3 className="panel-title">Infrastructure Device Inventory</h3>
                  <p className="muted">Full multi-vendor device roster with SNMP MIB attributes & port checks</p>
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

            <section className="glass-panel">
              <div className="panel-header-row">
                <div>
                  <h3 className="panel-title">Distributed Polling Collectors (FR6)</h3>
                  <p className="muted">Agent daemons collecting ICMP & SNMP across discrete subnets</p>
                </div>
              </div>
              <AgentList agents={agents} devices={devices} />
            </section>
          </div>
        )}

        {/* Tab 4: Subnet Discovery */}
        {tab === 'discovery' && (
          <section className="glass-panel">
            <SubnetDiscovery agents={agents} onAddDevice={addDevice} />
          </section>
        )}

        {/* Tab 5: Alarms */}
        {tab === 'alarms' && (
          <section className="glass-panel">
            <div className="panel-header-row">
              <div>
                <h3 className="panel-title">Alarm & Trap Console (Root Cause Hotlist)</h3>
                <p className="muted">OpManager-grade fault management and operator acknowledgement workflow</p>
              </div>
            </div>
            <AlertPanel alerts={alerts} onAcknowledge={ackAlert} />
          </section>
        )}

        {/* Tab 6: SLA Reports */}
        {tab === 'sla' && (
          <section className="glass-panel">
            <ReportsView />
          </section>
        )}
      </main>
    </div>
  );
}
