// NetMonitor Persistent SQLite Database Layer
// Built-in node:sqlite engine for Node.js 22+ (Zero external dependencies)
// Database file: E:/NetMonitor/database/netmonitor.db

const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, 'netmonitor.db');

const db = new DatabaseSync(DB_PATH);

// Configure SQLite for high performance and durability
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize Tables
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'OPERATOR',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT,
  online INTEGER DEFAULT 1,
  last_heartbeat TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  tcp_ports TEXT DEFAULT '',
  agent_id TEXT DEFAULT 'agent-a',
  device_group TEXT DEFAULT 'Default',
  status TEXT DEFAULT 'UP',
  latency_ms REAL DEFAULT 5.0,
  packet_loss REAL DEFAULT 0,
  snmp_enabled INTEGER DEFAULT 0,
  snmp_community TEXT DEFAULT 'public',
  cpu_usage REAL,
  memory_usage REAL,
  uptime_seconds INTEGER DEFAULT 0,
  last_checked TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER NOT NULL,
  timestamp TEXT NOT NULL,
  up INTEGER DEFAULT 1,
  latency_ms REAL,
  packet_loss REAL DEFAULT 0,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER,
  device_name TEXT,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  acknowledged INTEGER DEFAULT 0,
  acknowledged_at TEXT,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_meas_dev_time ON measurements(device_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_dev_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_alt_ack ON alerts(acknowledged);
`);

// Seed Default Data if First Run
function seedInitialData() {
  const userCount = db.prepare('SELECT count(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, email, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    insertUser.run('admin', 'admin123', 'System Administrator', 'admin@netmonitor.corp', 'ADMIN', now);
    insertUser.run('Prabhath', 'prabhath123', 'Prabhath Operator', 'prabhath@netmonitor.corp', 'ADMIN', now);
    insertUser.run('viewer', 'viewer123', 'Viewer User', 'viewer@netmonitor.corp', 'VIEWER', now);
  }

  const agentCount = db.prepare('SELECT count(*) as count FROM agents').get().count;
  if (agentCount === 0) {
    const insertAgent = db.prepare(`
      INSERT INTO agents (id, name, online, last_heartbeat)
      VALUES (?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    insertAgent.run('agent-a', 'Segment-A Poller (Gateway)', 1, now);
    insertAgent.run('agent-b', 'Segment-B Poller (DMZ/Servers)', 1, now);
    insertAgent.run('agent-c', 'Segment-C Poller (Branch Office)', 0, new Date(Date.now() - 3600000).toISOString());
  }

  const deviceCount = db.prepare('SELECT count(*) as count FROM devices').get().count;
  if (deviceCount === 0) {
    const insertDev = db.prepare(`
      INSERT INTO devices (name, host, tcp_ports, agent_id, device_group, status, latency_ms, packet_loss, snmp_enabled, snmp_community, cpu_usage, memory_usage, uptime_seconds, last_checked)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    insertDev.run('Core-Router', '192.168.1.1', '22,80', 'agent-a', 'Gateway', 'UP', 3.2, 0, 1, 'public', 14.2, 36.8, 845200, now);
    insertDev.run('Primary-DNS', '8.8.8.8', '53', 'agent-a', 'Infra', 'UP', 14.5, 0, 0, 'public', null, null, null, now);
    insertDev.run('Web-App-Server', '192.168.1.50', '80,443', 'agent-b', 'Servers', 'DEGRADED', 25.1, 5, 1, 'public', 78.4, 82.1, 312000, now);
    insertDev.run('Backup-NAS', '192.168.1.100', '445', 'agent-b', 'Storage', 'DOWN', null, 100, 0, 'public', null, null, null, now);

    // Seed 24 hours of measurements history
    const allDevices = db.prepare('SELECT * FROM devices').all();
    const insertMeas = db.prepare(`
      INSERT INTO measurements (device_id, timestamp, up, latency_ms, packet_loss)
      VALUES (?, ?, ?, ?, ?)
    `);

    allDevices.forEach(d => {
      const nowTs = Date.now();
      for (let i = 24; i >= 0; i--) {
        const ts = new Date(nowTs - i * 3600 * 1000).toISOString();
        const isUp = d.status !== 'DOWN' ? 1 : 0;
        const lat = isUp ? +(Math.max(1.5, (d.latency_ms || 10) + (Math.random() * 4 - 2))).toFixed(1) : null;
        insertMeas.run(d.id, ts, isUp, lat, isUp ? 0 : 100);
      }
    });
  }

  const alertCount = db.prepare('SELECT count(*) as count FROM alerts').get().count;
  if (alertCount === 0) {
    const insertAlert = db.prepare(`
      INSERT INTO alerts (device_id, device_name, severity, message, timestamp, acknowledged, acknowledged_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertAlert.run(4, 'Backup-NAS', 'CRITICAL', 'Device is DOWN or completely unreachable', new Date(Date.now() - 600000).toISOString(), 0, null);
    insertAlert.run(3, 'Web-App-Server', 'WARNING', 'High latency detected: 25.1 ms & elevated CPU (78%)', new Date(Date.now() - 1200000).toISOString(), 1, new Date().toISOString());
  }
}

seedInitialData();

// Exported Database API
module.exports = {
  // Devices
  getDevices() {
    return db.prepare('SELECT * FROM devices ORDER BY id ASC').all().map(d => ({
      id: d.id,
      name: d.name,
      host: d.host,
      tcpPorts: d.tcp_ports,
      agentId: d.agent_id,
      deviceGroup: d.device_group,
      status: d.status,
      latencyMs: d.latency_ms,
      packetLoss: d.packet_loss,
      snmpEnabled: Boolean(d.snmp_enabled),
      snmpCommunity: d.snmp_community,
      cpuUsage: d.cpu_usage,
      memoryUsage: d.memory_usage,
      uptimeSeconds: d.uptime_seconds,
      lastChecked: d.last_checked
    }));
  },

  getDevice(id) {
    const d = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
    if (!d) return null;
    return {
      id: d.id,
      name: d.name,
      host: d.host,
      tcpPorts: d.tcp_ports,
      agentId: d.agent_id,
      deviceGroup: d.device_group,
      status: d.status,
      latencyMs: d.latency_ms,
      packetLoss: d.packet_loss,
      snmpEnabled: Boolean(d.snmp_enabled),
      snmpCommunity: d.snmp_community,
      cpuUsage: d.cpu_usage,
      memoryUsage: d.memory_usage,
      uptimeSeconds: d.uptime_seconds,
      lastChecked: d.last_checked
    };
  },

  addDevice(dev) {
    const stmt = db.prepare(`
      INSERT INTO devices (name, host, tcp_ports, agent_id, device_group, status, latency_ms, packet_loss, snmp_enabled, snmp_community, uptime_seconds, last_checked)
      VALUES (?, ?, ?, ?, ?, 'UP', 5.0, 0, ?, ?, 120, ?)
    `);
    const now = new Date().toISOString();
    const res = stmt.run(
      dev.name || 'New Device',
      dev.host || '127.0.0.1',
      dev.tcpPorts || '',
      dev.agentId || 'agent-a',
      dev.deviceGroup || 'Default',
      dev.snmpEnabled ? 1 : 0,
      dev.snmpCommunity || 'public',
      now
    );
    const newId = Number(res.lastInsertRowid);

    // Initial measurement
    db.prepare('INSERT INTO measurements (device_id, timestamp, up, latency_ms, packet_loss) VALUES (?, ?, 1, 5.0, 0)').run(newId, now);

    return this.getDevice(newId);
  },

  updateDeviceTelemetry(id, latencyMs, lastChecked) {
    db.prepare('UPDATE devices SET latency_ms = ?, last_checked = ? WHERE id = ?').run(latencyMs, lastChecked, id);
    db.prepare('INSERT INTO measurements (device_id, timestamp, up, latency_ms, packet_loss) VALUES (?, ?, 1, ?, 0)').run(id, lastChecked, latencyMs);
  },

  deleteDevice(id) {
    db.prepare('DELETE FROM devices WHERE id = ?').run(id);
  },

  // Measurements
  getMeasurements(deviceId, hours = 24) {
    const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    const rows = db.prepare(`
      SELECT * FROM measurements
      WHERE device_id = ? AND timestamp >= ?
      ORDER BY timestamp ASC
    `).all(deviceId, since);

    return rows.map(r => ({
      id: r.id,
      deviceId: r.device_id,
      timestamp: r.timestamp,
      up: Boolean(r.up),
      latencyMs: r.latency_ms,
      packetLoss: r.packet_loss
    }));
  },

  // Agents
  getAgents() {
    return db.prepare('SELECT * FROM agents ORDER BY id ASC').all().map(a => ({
      id: a.id,
      name: a.name,
      online: Boolean(a.online),
      lastHeartbeat: a.last_heartbeat
    }));
  },

  updateAgentHeartbeat(agentId, online = 1) {
    const now = new Date().toISOString();
    db.prepare('INSERT INTO agents (id, online, last_heartbeat) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET online = ?, last_heartbeat = ?')
      .run(agentId, online, now, online, now);
  },

  // Alerts
  getAlerts() {
    return db.prepare('SELECT * FROM alerts ORDER BY id DESC').all().map(a => ({
      id: a.id,
      deviceId: a.device_id,
      deviceName: a.device_name,
      severity: a.severity,
      message: a.message,
      timestamp: a.timestamp,
      acknowledged: Boolean(a.acknowledged),
      acknowledgedAt: a.acknowledged_at
    }));
  },

  acknowledgeAlert(id) {
    const now = new Date().toISOString();
    db.prepare('UPDATE alerts SET acknowledged = 1, acknowledged_at = ? WHERE id = ?').run(now, id);
    const row = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
    if (!row) return null;
    return {
      id: row.id,
      deviceId: row.device_id,
      deviceName: row.device_name,
      severity: row.severity,
      message: row.message,
      timestamp: row.timestamp,
      acknowledged: true,
      acknowledgedAt: row.acknowledged_at
    };
  },

  // Uptime & Reports
  getUptimeReport() {
    const devices = this.getDevices();
    return devices.map(d => {
      const stats = db.prepare(`
        SELECT count(*) as total, sum(up) as upCount, avg(latency_ms) as avgLat
        FROM measurements WHERE device_id = ?
      `).get(d.id);

      const total = stats.total || 1;
      const upCount = stats.upCount || (d.status !== 'DOWN' ? 1 : 0);
      const uptimePercentage = +( (upCount / total) * 100 ).toFixed(1);
      const avgLat = stats.avgLat != null ? +stats.avgLat.toFixed(1) : (d.latencyMs || 0.0);

      return {
        deviceId: d.id,
        name: d.name,
        host: d.host,
        status: d.status,
        sampleCount: total,
        uptimePercentage,
        averageLatencyMs: avgLat
      };
    });
  },

  // Users & Auth
  findUser(username) {
    return db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username);
  },

  registerUser(user) {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, email, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
      user.username,
      user.password || 'password123',
      user.fullName || user.username,
      user.email || `${user.username.toLowerCase()}@netmonitor.corp`,
      user.role || 'OPERATOR',
      now
    );
    return this.findUser(user.username);
  }
};

