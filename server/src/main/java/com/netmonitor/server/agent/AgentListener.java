package com.netmonitor.server.agent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.netmonitor.server.model.Device;
import com.netmonitor.server.repo.DeviceRepository;
import com.netmonitor.server.service.MonitoringService;
import jakarta.annotation.PreDestroy;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * TCP listener for the agents (FR6). Protocol: one JSON object per line.
 *
 *   agent  -> server  {"type":"REGISTER","agentId":"agent-a","token":"..."}
 *   server -> agent   {"type":"CONFIG","intervalSeconds":30,"devices":[{"id":1,"host":"10.0.0.1","tcpPorts":[22,80]}]}
 *   agent  -> server  {"type":"RESULTS","results":[{"deviceId":1,"timestamp":...,"up":true,"latencyMs":1.2,
 *                      "packetLoss":0,"ports":[{"port":22,"open":true}]}]}
 *   agent  -> server  {"type":"HEARTBEAT","timestamp":...}
 *
 * Phase 5: create the ServerSocket from an SSLServerSocketFactory to protect this link with TLS.
 */
@Component
public class AgentListener {

    private static final Logger log = LoggerFactory.getLogger(AgentListener.class);

    private final int port;
    private final String token;
    private final int pollIntervalSeconds;
    private final MonitoringService monitoring;
    private final DeviceRepository devices;
    private final ObjectMapper mapper;

    private final Map<String, AgentConnection> connections = new ConcurrentHashMap<>();
    private volatile ServerSocket serverSocket;

    public AgentListener(@Value("${netmonitor.agent.port}") int port,
                         @Value("${netmonitor.agent.token}") String token,
                         @Value("${netmonitor.poll-interval-seconds}") int pollIntervalSeconds,
                         MonitoringService monitoring, DeviceRepository devices, ObjectMapper mapper) {
        this.port = port;
        this.token = token;
        this.pollIntervalSeconds = pollIntervalSeconds;
        this.monitoring = monitoring;
        this.devices = devices;
        this.mapper = mapper;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void start() throws IOException {
        serverSocket = new ServerSocket(port);
        Thread.ofPlatform().name("agent-listener").daemon(true).start(this::acceptLoop);
        log.info("Waiting for agents on TCP port {}", port);
    }

    @PreDestroy
    public void stop() throws IOException {
        if (serverSocket != null) {
            serverSocket.close();
        }
    }

    private void acceptLoop() {
        while (!serverSocket.isClosed()) {
            try {
                Socket socket = serverSocket.accept();
                // One virtual thread per agent connection (Java 21).
                Thread.ofVirtual().start(() -> handle(socket));
            } catch (IOException e) {
                if (!serverSocket.isClosed()) {
                    log.warn("Accept failed: {}", e.getMessage());
                }
            }
        }
    }

    private void handle(Socket socket) {
        String agentId = null;
        AgentConnection connection = null;
        try (socket) {
            // An agent that stays silent for 4 intervals is dropped.
            socket.setSoTimeout(pollIntervalSeconds * 4 * 1000);
            BufferedReader in = new BufferedReader(
                    new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
            BufferedWriter out = new BufferedWriter(
                    new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8));

            String line;
            while ((line = in.readLine()) != null) {
                JsonNode message = mapper.readTree(line);
                String type = message.path("type").asText();

                if (agentId == null) {
                    // The first message must be a valid REGISTER.
                    String id = message.path("agentId").asText().trim();
                    if (!"REGISTER".equals(type) || id.isEmpty() || !tokenMatches(message.path("token").asText())) {
                        log.warn("Rejected connection from {}: bad registration", socket.getRemoteSocketAddress());
                        return;
                    }
                    agentId = id;
                    connection = new AgentConnection(out);
                    connections.put(agentId, connection);
                    monitoring.agentAlive(agentId);
                    connection.send(configFor(agentId));
                    log.info("Agent {} registered from {}", agentId, socket.getRemoteSocketAddress());
                    continue;
                }

                try {
                    switch (type) {
                        case "RESULTS" -> monitoring.saveResults(agentId, message.path("results"));
                        case "HEARTBEAT" -> monitoring.agentAlive(agentId);
                        default -> log.debug("Unknown message type '{}' from {}", type, agentId);
                    }
                } catch (RuntimeException e) {
                    log.error("Failed to process {} from {}", type, agentId, e);
                }
            }
        } catch (IOException e) {
            log.info("Connection to agent {} ended: {}", agentId == null ? "(unregistered)" : agentId, e.getMessage());
        } finally {
            if (agentId != null) {
                connections.remove(agentId, connection);
            }
        }
    }

    /** Sends the current device list to an agent, if it is connected. Call after any device change. */
    public void pushConfig(String agentId) {
        AgentConnection connection = agentId == null ? null : connections.get(agentId);
        if (connection == null) {
            return;
        }
        try {
            connection.send(configFor(agentId));
        } catch (IOException e) {
            log.info("Could not push config to agent {}: {}", agentId, e.getMessage());
        }
    }

    private String configFor(String agentId) throws IOException {
        ObjectNode config = mapper.createObjectNode();
        config.put("type", "CONFIG");
        config.put("intervalSeconds", pollIntervalSeconds);
        ArrayNode list = config.putArray("devices");
        for (Device device : devices.findByAgentId(agentId)) {
            ObjectNode node = list.addObject();
            node.put("id", device.getId());
            node.put("host", device.getHost());
            ArrayNode ports = node.putArray("tcpPorts");
            String tcpPorts = device.getTcpPorts() == null ? "" : device.getTcpPorts();
            for (String port : tcpPorts.split(",")) {
                if (!port.isBlank()) {
                    ports.add(Integer.parseInt(port.trim()));
                }
            }
        }
        return mapper.writeValueAsString(config);
    }

    private boolean tokenMatches(String candidate) {
        return MessageDigest.isEqual(token.getBytes(StandardCharsets.UTF_8),
                candidate.getBytes(StandardCharsets.UTF_8));
    }

    /** Wraps the socket writer so config pushes and replies never interleave. */
    private static final class AgentConnection {

        private final BufferedWriter out;

        AgentConnection(BufferedWriter out) {
            this.out = out;
        }

        synchronized void send(String line) throws IOException {
            out.write(line);
            out.write('\n');
            out.flush();
        }
    }
}
