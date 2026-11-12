import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 8080;
const AGENTS_PORT = 9090;

// In-memory data store for local simulation
let devices = [
  { id: 1, name: 'Core-Router', host: '192.168.1.1', tcpPorts: '22,80', agentId: 'agent-a', deviceGroup: 'Gateway', status: 'UP', latencyMs: 3.2, packetLoss: 0, lastChecked: new Date().toISOString() },
  { id: 2, name: 'Primary-DNS', host: '8.8.8.8', tcpPorts: '53', agentId: 'agent-a', deviceGroup: 'Infra', status: 'UP', latencyMs: 14.5, packetLoss: 0, lastChecked: new Date().toISOString() },
  { id: 3, name: 'Web-App-Server', host: '192.168.1.50', tcpPorts: '80,443', agentId: 'agent-b', deviceGroup: 'Servers', status: 'DEGRADED', latencyMs: 25.1, packetLoss: 5, lastChecked: new Date().toISOString() },
  { id: 4, name: 'Backup-NAS', host: '192.168.1.100', tcpPorts: '445', agentId: 'agent-b', deviceGroup: 'Storage', status: 'DOWN', latencyMs: null, packetLoss: 100, lastChecked: new Date().toISOString() }
];

let agents = [
  { id: 'agent-a', online: true, lastHeartbeat: new Date().toISOString() },
  { id: 'agent-b', online: true, lastHeartbeat: new Date().toISOString() },
  { id: 'agent-c', online: false, lastHeartbeat: null }
];

let alerts = [
  { id: 1, deviceId: 4, deviceName: 'Backup-NAS', severity: 'CRITICAL', message: 'Device is DOWN or completely unreachable', timestamp: new Date().toISOString(), acknowledged: false },
  { id: 2, deviceId: 3, deviceName: 'Web-App-Server', severity: 'WARNING', message: 'High latency detected: 25.1 ms', timestamp: new Date().toISOString(), acknowledged: false }
];

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/devices' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(devices));
  }

  if (url.pathname === '/api/devices' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const item = JSON.parse(body);
        item.id = Date.now();
        item.status = 'UP';
        item.latencyMs = Math.round((Math.random() * 20 + 2) * 10) / 10;
        item.packetLoss = 0;
        item.lastChecked = new Date().toISOString();
        devices.push(item);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(item));
      } catch (e) {
        res.writeHead(400);
        res.end();
      }
    });
    return;
  }

  if (url.pathname.startsWith('/api/devices/') && req.method === 'DELETE') {
    const id = Number(url.pathname.split('/')[3]);
    devices = devices.filter(d => d.id !== id);
    res.writeHead(204);
    return res.end();
  }

  if (url.pathname === '/api/agents' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(agents));
  }

  if (url.pathname === '/api/alerts' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(alerts));
  }

  if (url.pathname.endsWith('/acknowledge') && req.method === 'POST') {
    const parts = url.pathname.split('/');
    const id = Number(parts[3]);
    const target = alerts.find(a => a.id === id);
    if (target) {
      target.acknowledged = true;
      target.acknowledgedAt = new Date().toISOString();
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(target || {}));
  }

  if (url.pathname === '/api/discovery/scan' && req.method === 'POST') {
    const mockFound = [
      { ip: '192.168.1.1', latencyMs: 2.1, status: 'UP', alreadyAdded: true },
      { ip: '192.168.1.15', latencyMs: 4.8, status: 'UP', alreadyAdded: false },
      { ip: '192.168.1.22', latencyMs: 6.2, status: 'UP', alreadyAdded: false },
      { ip: '192.168.1.50', latencyMs: 12.0, status: 'UP', alreadyAdded: true }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(mockFound));
  }

  if (url.pathname === '/api/reports/uptime' && req.method === 'GET') {
    const reports = devices.map(d => ({
      deviceId: d.id,
      name: d.name,
      host: d.host,
      status: d.status,
      sampleCount: 1440,
      uptimePercentage: d.status === 'DOWN' ? 62.5 : d.status === 'DEGRADED' ? 94.2 : 99.9,
      averageLatencyMs: d.latencyMs || 0
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(reports));
  }

  if (url.pathname === '/api/reports/export/csv' && req.method === 'GET') {
    let csv = 'DeviceId,Name,Host,Group,Status,LatencyMs,PacketLoss,LastChecked,AgentId\n';
    devices.forEach(d => {
      csv += `${d.id},"${d.name}","${d.host}","${d.deviceGroup || 'Default'}",${d.status},${d.latencyMs || ''},${d.packetLoss || ''},"${d.lastChecked}","${d.agentId}"\n`;
    });
    res.writeHead(200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="netmonitor-report.csv"'
    });
    return res.end(csv);
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`NetMonitor Local Backend listening on http://localhost:${PORT}`);
});
