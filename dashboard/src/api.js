// NetMonitor API Client supporting all features (FR1-FR10)

const BASE = '';

export const api = {
  // Authentication (FR10)
  login: async (username, password) => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Invalid credentials');
    return res.json();
  },

  // Devices (FR1, FR3, FR4, FR5)
  getDevices: async () => {
    const res = await fetch(`${BASE}/api/devices`);
    if (!res.ok) throw new Error('Failed to load devices');
    return res.json();
  },

  addDevice: async (device) => {
    const res = await fetch(`${BASE}/api/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(device)
    });
    if (!res.ok) throw new Error('Failed to create device');
    return res.json();
  },

  updateDevice: async (id, device) => {
    const res = await fetch(`${BASE}/api/devices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(device)
    });
    if (!res.ok) throw new Error('Failed to update device');
    return res.json();
  },

  deleteDevice: async (id) => {
    const res = await fetch(`${BASE}/api/devices/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete device');
  },

  getDeviceHistory: async (id, hours = 24) => {
    const res = await fetch(`${BASE}/api/devices/${id}/measurements?hours=${hours}`);
    if (!res.ok) throw new Error('Failed to load device history');
    return res.json();
  },

  getMeasurements: async (id, hours = 24) => {
    const res = await fetch(`${BASE}/api/devices/${id}/measurements?hours=${hours}`);
    if (!res.ok) throw new Error('Failed to load device measurements');
    return res.json();
  },

  // Agents (FR6)
  getAgents: async () => {
    const res = await fetch(`${BASE}/api/agents`);
    if (!res.ok) throw new Error('Failed to load agents');
    return res.json();
  },

  // Alerts (FR9)
  getAlerts: async () => {
    const res = await fetch(`${BASE}/api/alerts`);
    if (!res.ok) throw new Error('Failed to load alerts');
    return res.json();
  },

  acknowledgeAlert: async (id) => {
    const res = await fetch(`${BASE}/api/alerts/${id}/acknowledge`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to acknowledge alert');
    return res.json();
  },

  // Subnet Discovery (FR2)
  scanSubnet: async (subnet, agentId) => {
    const res = await fetch(`${BASE}/api/discovery/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subnet, agentId })
    });
    if (!res.ok) throw new Error('Subnet scan failed');
    return res.json();
  },

  // Reports & Analytics (FR8)
  getUptimeReport: async (hours = 24) => {
    const res = await fetch(`${BASE}/api/reports/uptime?hours=${hours}`);
    if (!res.ok) throw new Error('Failed to fetch uptime report');
    return res.json();
  },

  exportCsvUrl: () => `${BASE}/api/reports/export/csv`
};

export function connectLive(onMessage, onStatusChange) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${window.location.host}/ws/dashboard`;

  let ws = null;
  let timer = null;

  function connect() {
    ws = new WebSocket(url);

    ws.onopen = () => {
      onStatusChange(true);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        onMessage(payload);
      } catch (e) {
        console.error('WS parse error', e);
      }
    };

    ws.onclose = () => {
      onStatusChange(false);
      timer = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  connect();

  return () => {
    clearTimeout(timer);
    if (ws) ws.close();
  };
}
