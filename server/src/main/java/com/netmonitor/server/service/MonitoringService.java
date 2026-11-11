package com.netmonitor.server.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.netmonitor.server.model.Agent;
import com.netmonitor.server.model.Device;
import com.netmonitor.server.model.DeviceStatus;
import com.netmonitor.server.model.Measurement;
import com.netmonitor.server.repo.AgentRepository;
import com.netmonitor.server.repo.DeviceRepository;
import com.netmonitor.server.repo.MeasurementRepository;
import com.netmonitor.server.web.DashboardHub;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Stores what the agents report, updates status, and evaluates alerts. */
@Service
public class MonitoringService {

    private static final Logger log = LoggerFactory.getLogger(MonitoringService.class);
    private static final int MISSED_HEARTBEATS = 3;

    private final AgentRepository agents;
    private final DeviceRepository devices;
    private final MeasurementRepository measurements;
    private final DashboardHub hub;
    private final AlertService alertService;
    private final int pollIntervalSeconds;
    private final int retentionDays;

    public MonitoringService(AgentRepository agents, DeviceRepository devices,
                             MeasurementRepository measurements, DashboardHub hub,
                             AlertService alertService,
                             @Value("${netmonitor.poll-interval-seconds:30}") int pollIntervalSeconds,
                             @Value("${netmonitor.retention-days:30}") int retentionDays) {
        this.agents = agents;
        this.devices = devices;
        this.measurements = measurements;
        this.hub = hub;
        this.alertService = alertService;
        this.pollIntervalSeconds = pollIntervalSeconds;
        this.retentionDays = retentionDays;
    }

    // ---------- agents ----------

    /** Called on REGISTER and on every HEARTBEAT. */
    @Transactional
    public void agentAlive(String agentId) {
        Agent agent = agents.findById(agentId).orElseGet(() -> new Agent(agentId));
        boolean wasOnline = agent.isOnline();
        agent.setOnline(true);
        agent.setLastHeartbeat(Instant.now());
        agents.save(agent);
        if (!wasOnline) {
            log.info("Agent {} is online", agentId);
        }
        hub.broadcast("agent", agent);
    }

    /** An agent is offline after 3 missed heartbeats; its devices become UNKNOWN, not DOWN. */
    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void checkHeartbeats() {
        Instant limit = Instant.now().minusSeconds((long) MISSED_HEARTBEATS * pollIntervalSeconds);
        for (Agent agent : agents.findByOnlineTrue()) {
            if (agent.getLastHeartbeat() != null && !agent.getLastHeartbeat().isBefore(limit)) {
                continue;
            }
            agent.setOnline(false);
            agents.save(agent);
            log.warn("Agent {} is offline ({} heartbeats missed)", agent.getId(), MISSED_HEARTBEATS);
            hub.broadcast("agent", agent);
            for (Device device : devices.findByAgentId(agent.getId())) {
                device.setStatus(DeviceStatus.UNKNOWN);
                devices.save(device);
                hub.broadcast("device", device);
            }
        }
    }

    // ---------- results ----------

    /** Handles the "results" array of a RESULTS message. */
    @Transactional
    public void saveResults(String agentId, JsonNode results) {
        for (JsonNode result : results) {
            Device device = devices.findById(result.path("deviceId").asLong(-1)).orElse(null);
            if (device == null || !agentId.equals(device.getAgentId())) {
                continue; // removed or reassigned
            }
            Instant checkedAt = Instant.ofEpochMilli(result.path("timestamp").asLong(System.currentTimeMillis()));
            boolean up = result.path("up").asBoolean(false);
            Double latency = result.hasNonNull("latencyMs") ? result.get("latencyMs").asDouble() : null;
            Double loss = result.hasNonNull("packetLoss") ? result.get("packetLoss").asDouble() : null;
            List<String> closed = new ArrayList<>();

            if (result.has("ports") && result.get("ports").isArray()) {
                for (JsonNode port : result.get("ports")) {
                    if (!port.path("open").asBoolean(false)) {
                        closed.add(String.valueOf(port.path("port").asInt()));
                    }
                }
            }

            // Read SNMP metrics if present
            if (result.has("snmp")) {
                JsonNode snmp = result.get("snmp");
                if (snmp.hasNonNull("uptimeSeconds")) {
                    device.setUptimeSeconds(snmp.get("uptimeSeconds").asLong());
                }
                if (snmp.hasNonNull("cpuPercent")) {
                    device.setCpuUsage(snmp.get("cpuPercent").asDouble());
                }
                if (snmp.hasNonNull("memoryPercent")) {
                    device.setMemoryUsage(snmp.get("memoryPercent").asDouble());
                }
            }

            measurements.save(new Measurement(device.getId(), checkedAt, up, latency, loss));

            DeviceStatus newStatus = !up
                    ? DeviceStatus.DOWN
                    : closed.isEmpty() ? DeviceStatus.UP : DeviceStatus.DEGRADED;

            device.setStatus(newStatus);
            device.setLatencyMs(latency);
            device.setPacketLoss(loss);
            device.setClosedPorts(String.join(",", closed));
            device.setLastChecked(checkedAt);
            devices.save(device);

            // Trigger threshold & availability alerts
            alertService.evaluateDeviceMetrics(device.getId(), device.getName(), up, latency, loss);

            hub.broadcast("device", device);
        }
    }

    // ---------- purge old data (FR8: store 30 days) ----------

    @Scheduled(cron = "0 0 3 * * *") // every day at 03:00
    @Transactional
    public void purgeOldMeasurements() {
        Instant cutoff = Instant.now().minus(Duration.ofDays(retentionDays));
        measurements.deleteByTimestampBefore(cutoff);
        log.info("Purged measurements older than {} days", retentionDays);
    }
}
