# NetMonitor

A distributed network device monitoring system. Java agents on each network segment
check the local devices and report to a central Java server; a React dashboard shows
live status and history.

```
netmonitor/
  agent/       Java 21 monitoring agent (plain sockets, no external libraries)
  server/      Central server (Spring Boot 3, JPA, WebSocket)
  dashboard/   Web dashboard (React, Vite, Chart.js)
  docker-compose.yml   PostgreSQL for the server
```

## What you need

- JDK 21 or later, Maven 3.9+
- Node.js 20 or later
- Docker (only if you want PostgreSQL instead of the built-in H2 database)

## Run it (three terminals)

**1. Server** (REST + WebSocket on port 8080, agent listener on port 9090)

```
cd server
mvn spring-boot:run
```

By default the server stores data in an H2 file database under `server/data/`, so it
starts with no setup. To use PostgreSQL as in the proposal:

```
docker compose up -d
cd server
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

**2. Agent**

```
cd agent
mvn package
java -jar target/netmonitor-agent.jar agent.properties
```

The agent registers as `agent-a` (set in `agent.properties`) and receives the two
sample devices the server creates on first start.

**3. Dashboard**

```
cd dashboard
npm install
npm run dev
```

Open http://localhost:5173. Add a device, assign it to `agent-a`, and it is polled
straight away. Click a device row to see its latency history.

### Running several agents

Copy `agent.properties`, give each copy a different `agent.id` (`agent-b`, `agent-c`),
set `server.host` to the server's address, and start one agent per network segment.
In the dashboard, type the agent's id in the Agent field when you add a device.

## How it works

1. An agent opens an outbound TCP connection to the server and sends `REGISTER`.
2. The server answers with `CONFIG`: the polling interval and that agent's device list.
   A new `CONFIG` is pushed whenever devices are added, changed or removed.
3. On every interval the agent checks all devices in parallel (thread pool):
   ICMP ping through the operating system's `ping` command, then each TCP port.
4. The agent sends one `RESULTS` message and one `HEARTBEAT` per interval. While the
   server is unreachable, results are buffered (up to one hour) and resent in order.
5. The server stores each result as a measurement, updates the device status
   (`UP`, `DEGRADED` when a monitored port is closed, `DOWN`) and pushes the change
   to every open dashboard over WebSocket.
6. An agent with 3 missed heartbeats is marked offline and its devices become
   `UNKNOWN` (not `DOWN`, because the devices themselves may be fine).

### Agent-to-server protocol

One JSON object per line over TCP.

| Direction | Message |
|---|---|
| agent → server | `{"type":"REGISTER","agentId":"agent-a","token":"change-me"}` |
| server → agent | `{"type":"CONFIG","intervalSeconds":30,"devices":[{"id":1,"host":"10.0.0.1","tcpPorts":[22,80]}]}` |
| agent → server | `{"type":"RESULTS","results":[{"deviceId":1,"timestamp":1794378769728,"up":true,"latencyMs":1.2,"packetLoss":0,"ports":[{"port":22,"open":true}]}]}` |
| agent → server | `{"type":"HEARTBEAT","timestamp":1794378769728}` |

### REST API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/devices` | All devices with their latest status |
| POST | `/api/devices` | Add a device: `{"name","host","tcpPorts":"22,80","agentId"}` |
| PUT | `/api/devices/{id}` | Change a device (same body) |
| DELETE | `/api/devices/{id}` | Remove a device and its history |
| GET | `/api/devices/{id}/measurements?hours=1` | History for the charts |
| GET | `/api/agents` | All agents and their online state |

WebSocket `/ws` pushes `{"type":"device"|"agent"|"deviceRemoved","data":...}`.

## Settings

- `server/src/main/resources/application.properties`: ports, agent token, polling
  interval (default 30 s), retention (default 30 days), database.
- `agent/agent.properties`: agent id, server address, token, thread count.

Change `netmonitor.agent.token` and `agent.token` (they must match) before using
this outside your own machine.

## Status against the proposal

| Requirement | State |
|---|---|
| FR1 Device management | Add, edit (API only), remove, assign to agent. Groups not yet. |
| FR2 Device discovery | Not yet (phase 5) |
| FR3 Availability monitoring | Done: up/down, latency, packet loss |
| FR4 Service monitoring | Done: TCP port checks |
| FR5 SNMP monitoring | Not yet: add SNMP4J to the agent (phase 2) |
| FR6 Distributed agents | Done: register, heartbeat, config push, buffering |
| FR7 Live dashboard | Done: WebSocket updates |
| FR8 History and reports | Latency chart and uptime %. CSV export not yet. |
| FR9 Alerts | Not yet (phase 5). Hook is marked in `MonitoringService.saveResults`. |
| FR10 User accounts | Not yet (phase 5): add Spring Security |
| TLS | Not yet (phase 5). Places are marked in `ServerLink` and `AgentListener`. |

## Tests

```
cd agent
mvn test
```

Covers the JSON reader/writer and ping output parsing for Linux and Windows.
