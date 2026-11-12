// Lightweight NetMonitor Simulation Server
// Serves Spring Boot REST API endpoints & live WebSocket feed for the React Dashboard

const http = require('http');
const net = require('net');
const url = require('url');

const PORT = 8080;
const AGENT_PORT = 9090;

let devices = [
  {
    id: 1,
    name: 'Core-Router',
    host: '192.168.1.1',
    tcpPorts: '22,80',
    agentId: 'agent-a',
    deviceGroup: 'Gateway',
    status: 'UP',
    latencyMs: 3.2,
    packetLoss: 0,
    snmpEnabled: true,
    uptimeSeconds: 845200,
    cpuUsage: 14.2,
    memoryUsage: 36.8,
    lastChecked: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Primary-DNS',
    host: '8.8.8.8',
    tcpPorts: '53',
    agentId: 'agent-a',
    deviceGroup: 'Infra',
    status: 'UP',
    latencyMs: 14.5,
    packetLoss: 0,
    snmpEnabled: false,
    uptimeSeconds: null,
    cpuUsage: null,
    memoryUsage: null,
    lastChecked: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Web-App-Server',
    host: '192.168.1.50',
    tcpPorts: '80,443',
    agentId: 'agent-b',
    deviceGroup: 'Servers',
    status: 'DEGRADED',
    latencyMs: 25.1,
    packetLoss: 5,
    snmpEnabled: true,
    uptimeSeconds: 312000,
    cpuUsage: 78.4,
    memoryUsage: 82.1,
    lastChecked: new Date().toISOString()
  },
  {
    id: 4,
    name: 'Backup-NAS',
    host: '192.168.1.100',
    tcpPorts: '445',
    agentId: 'agent-b',
    deviceGroup: 'Storage',
    status: 'DOWN',
    latencyMs: null,
    packetLoss: 100,
    snmpEnabled: false,
    uptimeSeconds: null,
    cpuUsage: null,
    memoryUsage: null,
    lastChecked: new Date().toISOString()
  }
];

let agents = [
  { id: 'agent-a', online: true, lastHeartbeat: new Date().toISOString() },
  { id: 'agent-b', online: true, lastHeartbeat: new Date().toISOString() },
  { id: 'agent-c', online: false, lastHeartbeat: new Date(Date.now() - 3600000).toISOString() }
];

let alerts = [
  {
    id: 101,
    deviceId: 4,
    deviceName: 'Backup-NAS',
    severity: 'CRITICAL',
    message: 'Device is DOWN or completely unreachable',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    acknowledged: false
  },
  {
    id: 102,
    deviceId: 3,
    deviceName: 'Web-App-Server',
    severity: 'WARNING',
    message: 'High latency detected: 25.1 ms & elevated CPU (78%)',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    acknowledged: true
  }
];

let historyData = {};

function initHistory() {
  devices.forEach(d => {
    historyData[d.id] = [];
    const now = Date.now();
    for (let i = 24; i >= 0; i--) {
      const ts = now - i * 3600 * 1000;
      historyData[d.id].push({
        id: Math.floor(Math.random() * 100000),
        deviceId: d.id,
        timestamp: new Date(ts).toISOString(),
        up: d.status !== 'DOWN',
        latencyMs: d.latencyMs ? +(d.latencyMs + (Math.random() * 4 - 2)).toFixed(1) : null,
        packetLoss: d.packetLoss || 0
      });
    }
  });
}
initHistory();

// Active WebSocket connections
let wsClients = new Set();

function broadcast(type, data) {
  const msg = JSON.stringify({ type, data });
  for (const client of wsClients) {
    try {
      sendWsFrame(client, msg);
    } catch (e) {
      wsClients.delete(client);
    }
  }
}

// Background poller simulator to keep live charts and metrics ticking
setInterval(() => {
  devices.forEach(d => {
    if (d.status === 'UP') {
      d.latencyMs = +(Math.max(1.2, (d.latencyMs || 5) + (Math.random() * 2 - 1))).toFixed(1);
      d.lastChecked = new Date().toISOString();
      if (!historyData[d.id]) historyData[d.id] = [];
      historyData[d.id].push({
        id: Math.floor(Math.random() * 100000),
        deviceId: d.id,
        timestamp: d.lastChecked,
        up: true,
        latencyMs: d.latencyMs,
        packetLoss: 0
      });
      if (historyData[d.id].length > 60) historyData[d.id].shift();
      broadcast('device', d);
    }
  });
}, 5000);

// Basic HTTP Server
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const path = parsed.pathname;
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Auth (FR10)
  if (path === '/api/auth/login' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { username, password } = JSON.parse(body || '{}');
      if (username === 'admin' && password === 'admin123') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ token: 'mock-admin-token', username: 'admin', role: 'ADMIN' }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ token: 'mock-viewer-token', username: 'viewer', role: 'VIEWER' }));
      }
    });
    return;
  }

  // Devices (FR1)
  if (path === '/api/devices' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(devices));
    return;
  }

  if (path === '/api/devices' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body || '{}');
      const newDev = {
        id: Date.now(),
        name: data.name || 'New Device',
        host: data.host || '127.0.0.1',
        tcpPorts: data.tcpPorts || '',
        agentId: data.agentId || 'agent-a',
        deviceGroup: data.deviceGroup || 'Default',
        status: 'UP',
        latencyMs: 5.0,
        packetLoss: 0,
        snmpEnabled: Boolean(data.snmpEnabled),
        snmpCommunity: data.snmpCommunity || 'public',
        uptimeSeconds: 120,
        cpuUsage: 12.0,
        memoryUsage: 25.0,
        lastChecked: new Date().toISOString()
      };
      devices.push(newDev);
      broadcast('device', newDev);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newDev));
    });
    return;
  }

  // Delete Device
  if (path.startsWith('/api/devices/') && method === 'DELETE') {
    const id = parseInt(path.split('/').pop(), 10);
    devices = devices.filter(d => d.id !== id);
    broadcast('deviceRemoved', id);
    res.writeHead(204);
    res.end();
    return;
  }

  // Measurements / Latency History
  if (path.match(/\/api\/devices\/(\d+)\/measurements/)) {
    const id = parseInt(path.match(/\/api\/devices\/(\d+)\/measurements/)[1], 10);
    const history = historyData[id] || [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(history));
    return;
  }

  // Agents (FR6)
  if (path === '/api/agents' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(agents));
    return;
  }

  // Alerts (FR9)
  if (path === '/api/alerts' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(alerts));
    return;
  }

  if (path.match(/\/api\/alerts\/(\d+)\/acknowledge/) && method === 'POST') {
    const id = parseInt(path.match(/\/api\/alerts\/(\d+)\/acknowledge/)[1], 10);
    const target = alerts.find(a => a.id === id);
    if (target) {
      target.acknowledged = true;
      target.acknowledgedAt = new Date().toISOString();
      broadcast('alertAck', target);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(target));
    } else {
      res.writeHead(404);
      res.end();
    }
    return;
  }

  // Subnet Discovery (FR2)
  if (path === '/api/discovery/scan' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { subnet } = JSON.parse(body || '{}');
      const base = (subnet || '192.168.1.0/24').split('.')[0] + '.' + (subnet || '192.168.1.0/24').split('.')[1] + '.' + (subnet || '192.168.1.0/24').split('.')[2];
      const results = [
        { ip: `${base}.1`, latencyMs: 2.1, status: 'UP', alreadyAdded: true },
        { ip: `${base}.15`, latencyMs: 5.4, status: 'UP', alreadyAdded: false },
        { ip: `${base}.42`, latencyMs: 8.7, status: 'UP', alreadyAdded: false },
        { ip: `${base}.105`, latencyMs: 12.3, status: 'UP', alreadyAdded: false }
      ];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
    });
    return;
  }

  // Reports & Analytics (FR8)
  if (path === '/api/reports/uptime' && method === 'GET') {
    const report = devices.map(d => ({
      deviceId: d.id,
      name: d.name,
      host: d.host,
      status: d.status,
      sampleCount: 144,
      uptimePercentage: d.status === 'UP' ? 99.8 : d.status === 'DEGRADED' ? 94.2 : 45.0,
      averageLatencyMs: d.latencyMs || 0.0
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(report));
    return;
  }

  // Export CSV (FR8)
  if (path === '/api/reports/export/csv' && method === 'GET') {
    let csv = 'DeviceId,Name,Host,Group,Status,LatencyMs,PacketLoss,LastChecked,AgentId\n';
    devices.forEach(d => {
      csv += `${d.id},"${d.name}","${d.host}","${d.deviceGroup}",${d.status},${d.latencyMs || ''},${d.packetLoss || ''},"${d.lastChecked}","${d.agentId}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="netmonitor-report.csv"');
    res.writeHead(200);
    res.end(csv);
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

// WebSocket Protocol Handling
server.on('upgrade', (req, socket, head) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }
  const crypto = require('crypto');
  const acceptKey = crypto.createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${acceptKey}\r\n\r\n`
  );

  wsClients.add(socket);
  socket.on('close', () => wsClients.delete(socket));
  socket.on('error', () => wsClients.delete(socket));
});

function sendWsFrame(socket, text) {
  const payload = Buffer.from(text, 'utf8');
  let frame;
  if (payload.length <= 125) {
    frame = Buffer.alloc(2 + payload.length);
    frame[0] = 0x81;
    frame[1] = payload.length;
    payload.copy(frame, 2);
  } else if (payload.length <= 65535) {
    frame = Buffer.alloc(4 + payload.length);
    frame[0] = 0x81;
    frame[1] = 126;
    frame.writeUInt16BE(payload.length, 2);
    payload.copy(frame, 4);
  } else {
    frame = Buffer.alloc(10 + payload.length);
    frame[0] = 0x81;
    frame[1] = 127;
    frame.writeBigUInt64BE(BigInt(payload.length), 2);
    payload.copy(frame, 10);
  }
  socket.write(frame);
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[NetMonitor Server] REST & WebSocket listening on http://localhost:${PORT}`);
});

