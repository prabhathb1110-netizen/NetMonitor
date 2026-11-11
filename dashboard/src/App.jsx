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
      })
      .catch((e) => setError(`Cannot reach the server: ${e.message}`));
  }, []);

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
    if (!window.confirm(`Remove ${device.name} and its history?`)) return;
    try {
      await api.deleteDevice(device.id);
      setDevices((list) => list.filter((d) => d.id !== device.id));
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
    <div className="page">
      <header>
        <div>
          <h1>NetMonitor</h1>
          <span className="subtitle">Distributed Network Device Monitoring System</span>
        </div>
        <div className="header-right">
          <span className="role-tag">{user.username} ({user.role})</span>
          <span className={live ? 'live on' : 'live off'}>{live ? 'Live' : 'Offline'}</span>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <nav className="tab-bar">
        <button className={tab === 'devices' ? 'active' : ''} onClick={() => setTab('devices')}>
          Overview & Devices ({devices.length})
        </button>
        <button className={tab === 'discovery' ? 'active' : ''} onClick={() => setTab('discovery')}>
          Subnet Discovery (FR2)
        </button>
        <button className={tab === 'alerts' ? 'active' : ''} onClick={() => setTab('alerts')}>
          Alerts {unackAlertsCount > 0 && <span className="tab-badge">{unackAlertsCount}</span>}
        </button>
        <button className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>
          Reports & History (FR8)
        </button>
      </nav>

      {tab === 'devices' && (
        <>
          <section className="tiles">
            <div className="tile"><strong>{devices.length}</strong>Total Devices</div>
            <div className="tile up"><strong>{count('UP')}</strong>Up</div>
            <div className="tile degraded"><strong>{count('DEGRADED')}</strong>Degraded</div>
            <div className="tile down"><strong>{count('DOWN')}</strong>Down</div>
            <div className="tile unknown"><strong>{count('UNKNOWN')}</strong>Unknown</div>
          </section>

          <section className="card">
            <h2>Monitored Devices (FR1, FR3, FR4, FR5)</h2>
            <DeviceTable
              devices={devices}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onRemove={removeDevice}
            />
            {user.role === 'ADMIN' && <DeviceForm agents={agents} onAdd={addDevice} />}
          </section>

          {selected && (
            <section className="card">
              <LatencyChart device={selected} />
            </section>
          )}

          <section className="card">
            <h2>Distributed Agents (FR6)</h2>
            <AgentList agents={agents} />
          </section>
        </>
      )}

      {tab === 'discovery' && (
        <section className="card">
          <h2>Subnet Scanner & Host Discovery (FR2)</h2>
          <SubnetDiscovery agents={agents} onAddDevice={addDevice} />
        </section>
      )}

      {tab === 'alerts' && (
        <section className="card">
          <h2>Threshold Alerts & Incident Feed (FR9)</h2>
          <AlertPanel alerts={alerts} onAcknowledge={ackAlert} />
        </section>
      )}

      {tab === 'reports' && (
        <section className="card">
          <h2>Uptime Percentage & Measurement Export (FR8)</h2>
          <ReportsView />
        </section>
      )}
    </div>
  );
}
