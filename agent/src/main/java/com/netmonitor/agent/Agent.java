package com.netmonitor.agent;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

/**
 * The monitoring agent (FR1-FR6). It registers with the server, receives its device list,
 * polls every device concurrently using a thread pool (ICMP, TCP, SNMP),
 * and buffers results up to 1 hour if the server link is disrupted.
 */
public final class Agent {

    private static final int BUFFER_SECONDS = 3600;
    private static final int TCP_TIMEOUT_MS = 2000;

    private final ExecutorService pool;
    private final ServerLink link;
    private final Deque<String> buffer = new ArrayDeque<>();
    private final Object wake = new Object();

    private volatile List<Device> devices = List.of();
    private volatile int intervalSeconds = 30;

    public Agent(String serverHost, int serverPort, String agentId, String token, int threads) {
        this.pool = Executors.newFixedThreadPool(threads);
        this.link = new ServerLink(this, serverHost, serverPort, agentId, token);
    }

    /** Runs forever: one poll cycle per interval. */
    public void run() throws InterruptedException {
        link.start();
        while (true) {
            long start = System.currentTimeMillis();
            pollOnce();
            long sleepMs = intervalSeconds * 1000L - (System.currentTimeMillis() - start);
            if (sleepMs > 0) {
                synchronized (wake) {
                    wake.wait(sleepMs); // a new CONFIG wakes this early
                }
            }
        }
    }

    public void stop() {
        pool.shutdownNow();
        link.stop();
    }

    /** Called by ServerLink when a CONFIG message arrives from the server. */
    public void applyConfig(int intervalSeconds, List<Device> newDevices) {
        this.intervalSeconds = Math.max(5, intervalSeconds);
        this.devices = List.copyOf(newDevices);
        Log.info("Config applied: interval=" + this.intervalSeconds + "s, devices=" + this.devices.size());
        synchronized (wake) {
            wake.notifyAll(); // poll the new list right away
        }
    }

    /** Polls every assigned device concurrently. */
    private void pollOnce() {
        List<Device> current = this.devices;
        if (current.isEmpty()) {
            return;
        }

        long now = System.currentTimeMillis();
        List<Future<Map<String, Object>>> futures = new ArrayList<>(current.size());
        for (Device d : current) {
            futures.add(pool.submit(() -> checkDevice(d, now)));
        }

        List<Map<String, Object>> results = new ArrayList<>(current.size());
        for (Future<Map<String, Object>> f : futures) {
            try {
                results.add(f.get());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            } catch (ExecutionException e) {
                Log.warn("Check failed unexpectedly: " + e.getCause());
            }
        }

        String message = Json.stringify(Map.of(
                "type", "RESULTS",
                "results", results
        ));
        sendOrBuffer(message);
    }

    /** Checks one device: ICMP ping, TCP port probes, and SNMP check. */
    private Map<String, Object> checkDevice(Device device, long timestamp) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("deviceId", device.id());
        out.put("timestamp", timestamp);

        PingCheck.Result ping = PingCheck.run(device.host(), 1000);
        out.put("up", ping.up());
        if (ping.latencyMs() != null) {
            out.put("latencyMs", ping.latencyMs());
        }
        if (ping.packetLoss() != null) {
            out.put("packetLoss", ping.packetLoss());
        }

        // TCP port checks (FR4)
        if (device.tcpPorts() != null && !device.tcpPorts().isEmpty()) {
            List<Map<String, Object>> ports = new ArrayList<>();
            for (int port : device.tcpPorts()) {
                boolean open = TcpCheck.isOpen(device.host(), port, TCP_TIMEOUT_MS);
                ports.add(Map.of("port", port, "open", open));
            }
            out.put("ports", ports);
        }

        // SNMP probe (FR5)
        SnmpPoller.SnmpResult snmp = SnmpPoller.query(device.host(), "public");
        if (snmp.responsive()) {
            Map<String, Object> snmpMap = new LinkedHashMap<>();
            if (snmp.uptimeSeconds() != null) snmpMap.put("uptimeSeconds", snmp.uptimeSeconds());
            if (snmp.cpuPercent() != null) snmpMap.put("cpuPercent", snmp.cpuPercent());
            if (snmp.memoryPercent() != null) snmpMap.put("memoryPercent", snmp.memoryPercent());
            out.put("snmp", snmpMap);
        }

        return out;
    }

    /** Sends a message to the server, or buffers it if the link is down. */
    private synchronized void sendOrBuffer(String message) {
        int maxBuffered = BUFFER_SECONDS / intervalSeconds;
        if (link.send(message)) {
            drainBuffer();
        } else {
            if (buffer.size() >= maxBuffered) {
                buffer.removeFirst(); // discard oldest to make room
            }
            buffer.addLast(message);
            Log.warn("Server unreachable; buffered " + buffer.size() + "/" + maxBuffered + " results");
        }
    }

    /** Resends buffered messages in FIFO order once the link comes back. */
    public synchronized void drainBuffer() {
        while (!buffer.isEmpty()) {
            String older = buffer.peekFirst();
            if (link.send(older)) {
                buffer.removeFirst();
            } else {
                break; // link dropped again
            }
        }
    }
}
