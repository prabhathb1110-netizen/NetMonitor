# NetMonitor Persistent Database

This directory houses the persistent relational database engine and schema definitions for NetMonitor.

## Files

| File | Purpose |
|---|---|
| `netmonitor.db` | High-performance SQLite database file containing all devices, telemetry measurements, alerts, operators, and agents. |
| `db.js` | Database access layer utilizing Node.js built-in `node:sqlite` in WAL (Write-Ahead-Logging) mode for zero-latency concurrent reads/writes. |
| `schema.sql` | Standard ANSI SQL schema script compatible with SQLite, PostgreSQL, and MySQL. |

## Tables

- **`users`**: Operator authentication records, passwords, roles (`ADMIN` / `VIEWER`), and audit timestamps.
- **`devices`**: Monitored network endpoints, hostnames/IPs, probed TCP ports, assigned agent, status (`UP`, `DEGRADED`, `DOWN`), SNMP specs, and live latency.
- **`agents`**: Polling agent registry (`agent-a`, `agent-b`, etc.), TLS heartbeat timestamps, and online status.
- **`measurements`**: Time-series probe history (timestamp, latency in milliseconds, packet loss percentage, reachability status) for historical latency graphs and SLA calculations.
- **`alerts`**: Incident alarm logs, severity levels (`CRITICAL`, `WARNING`), violation messages, and acknowledgement history.

## Backup & Restore

To back up your entire monitoring history, simply copy `netmonitor.db`:
```bash
# Backup
cp database/netmonitor.db database/netmonitor-backup.db
```
To reset to factory defaults, simply delete `netmonitor.db` and the server will re-create and re-seed the tables automatically on start.

