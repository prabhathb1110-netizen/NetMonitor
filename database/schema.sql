-- NetMonitor Database Schema
-- Compatible with SQLite, PostgreSQL, and standard ANSI SQL
-- Database File Location: database/netmonitor.db

-- 1. Users & RBAC Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    email VARCHAR(200),
    role VARCHAR(50) DEFAULT 'OPERATOR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Polling Agents Table
CREATE TABLE IF NOT EXISTS agents (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150),
    online INTEGER DEFAULT 1,
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Network Devices Table
CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(150) NOT NULL,
    host VARCHAR(255) NOT NULL,
    tcp_ports VARCHAR(255) DEFAULT '',
    agent_id VARCHAR(100) DEFAULT 'agent-a',
    device_group VARCHAR(100) DEFAULT 'Default',
    status VARCHAR(50) DEFAULT 'UP',
    latency_ms REAL DEFAULT 5.0,
    packet_loss REAL DEFAULT 0,
    snmp_enabled INTEGER DEFAULT 0,
    snmp_community VARCHAR(100) DEFAULT 'public',
    cpu_usage REAL DEFAULT NULL,
    memory_usage REAL DEFAULT NULL,
    uptime_seconds INTEGER DEFAULT 0,
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- 4. Device Latency & Probe Measurements Table
CREATE TABLE IF NOT EXISTS measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    up INTEGER DEFAULT 1,
    latency_ms REAL,
    packet_loss REAL DEFAULT 0,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- 5. Incident Alarms Table
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER,
    device_name VARCHAR(150),
    severity VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    acknowledged INTEGER DEFAULT 0,
    acknowledged_at TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
);

-- Indexes for high-velocity query performance
CREATE INDEX IF NOT EXISTS idx_measurements_dev_ts ON measurements(device_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_alerts_ack ON alerts(acknowledged);

