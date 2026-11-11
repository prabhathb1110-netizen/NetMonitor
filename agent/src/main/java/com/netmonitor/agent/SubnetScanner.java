package com.netmonitor.agent;

import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * FR2: Subnet scanner using ICMP ping sweep and optional TCP discovery.
 */
public final class SubnetScanner {

    private SubnetScanner() {}

    /**
     * Scans a subnet CIDR (e.g. 192.168.1.0/24 or a range like 192.168.1.1-192.168.1.254)
     * and returns the list of active host IPs.
     */
    public static List<DiscoveredHost> scanSubnet(String cidrOrRange, int timeoutMs) {
        List<String> ips = parseTargetIps(cidrOrRange);
        List<DiscoveredHost> alive = new ArrayList<>();
        ExecutorService pool = Executors.newFixedThreadPool(Math.min(ips.size(), 32));

        ConcurrentHashMap<String, DiscoveredHost> found = new ConcurrentHashMap<>();

        for (String ip : ips) {
            pool.submit(() -> {
                try {
                    // Try fast OS ping or reachability
                    PingCheck.Result pr = PingCheck.run(ip, timeoutMs);
                    if (pr.up()) {
                        found.put(ip, new DiscoveredHost(ip, pr.latencyMs(), "ICMP"));
                    } else {
                        // fallback: try quick TCP check on port 80, 443, 22
                        for (int port : new int[]{80, 443, 22, 161}) {
                            try (Socket s = new Socket()) {
                                s.connect(new InetSocketAddress(ip, port), 400);
                                found.put(ip, new DiscoveredHost(ip, 2.0, "TCP " + port));
                                break;
                            } catch (Exception ignored) {}
                        }
                    }
                } catch (Exception ignored) {}
            });
        }

        pool.shutdown();
        try {
            pool.awaitTermination(30, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        alive.addAll(found.values());
        return alive;
    }

    private static List<String> parseTargetIps(String input) {
        List<String> list = new ArrayList<>();
        if (input == null || input.isBlank()) return list;

        input = input.trim();
        if (input.contains("/")) {
            String[] parts = input.split("/");
            String baseIp = parts[0];
            int prefix = Integer.parseInt(parts[1]);
            if (prefix >= 24 && prefix <= 30) {
                String prefixBase = baseIp.substring(0, baseIp.lastIndexOf('.') + 1);
                int count = (1 << (32 - prefix));
                for (int i = 1; i < count - 1; i++) {
                    list.add(prefixBase + i);
                }
            } else {
                list.add(baseIp);
            }
        } else if (input.contains("-")) {
            String[] parts = input.split("-");
            String startIp = parts[0].trim();
            String endPart = parts[1].trim();
            String prefixBase = startIp.substring(0, startIp.lastIndexOf('.') + 1);
            int start = Integer.parseInt(startIp.substring(startIp.lastIndexOf('.') + 1));
            int end = endPart.contains(".") ? Integer.parseInt(endPart.substring(endPart.lastIndexOf('.') + 1)) : Integer.parseInt(endPart);
            for (int i = start; i <= end; i++) {
                list.add(prefixBase + i);
            }
        } else {
            list.add(input);
        }
        return list;
    }

    public record DiscoveredHost(String host, double latencyMs, String probeMethod) {}
}

