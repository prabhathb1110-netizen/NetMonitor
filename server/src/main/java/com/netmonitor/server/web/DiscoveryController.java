package com.netmonitor.server.web;

import com.netmonitor.server.model.Device;
import com.netmonitor.server.repo.DeviceRepository;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * FR2: Subnet discovery endpoint triggering an IP probe across a CIDR.
 */
@RestController
@RequestMapping("/api/discovery")
@CrossOrigin
public class DiscoveryController {

    private final DeviceRepository deviceRepository;

    public DiscoveryController(DeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    public record ScanRequest(String subnet, String agentId) {}
    public record DiscoveredItem(String ip, double latencyMs, String status, boolean alreadyAdded) {}

    @PostMapping("/scan")
    public List<DiscoveredItem> scanSubnet(@RequestBody ScanRequest req) {
        String subnet = req.subnet() != null ? req.subnet().trim() : "192.168.1.0/24";
        List<String> ips = generateIps(subnet);

        ConcurrentHashMap<String, DiscoveredItem> discovered = new ConcurrentHashMap<>();
        ExecutorService pool = Executors.newFixedThreadPool(Math.min(ips.size(), 40));

        // existing hosts to flag
        Map<String, Boolean> existingHosts = new HashMap<>();
        for (Device d : deviceRepository.findAll()) {
            existingHosts.put(d.getHost(), true);
        }

        for (String ip : ips) {
            pool.submit(() -> {
                long start = System.currentTimeMillis();
                boolean alive = false;
                // quick TCP check on port 80, 443, 22, 53
                for (int port : new int[]{80, 443, 22, 53, 8080}) {
                    try (Socket s = new Socket()) {
                        s.connect(new InetSocketAddress(ip, port), 350);
                        alive = true;
                        break;
                    } catch (IOException ignored) {}
                }

                if (alive) {
                    double lat = Math.max(1.0, (System.currentTimeMillis() - start));
                    discovered.put(ip, new DiscoveredItem(ip, lat, "UP", existingHosts.containsKey(ip)));
                }
            });
        }

        pool.shutdown();
        try {
            pool.awaitTermination(15, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        return new ArrayList<>(discovered.values());
    }

    private List<String> generateIps(String subnet) {
        List<String> list = new ArrayList<>();
        if (subnet.contains("/")) {
            String[] parts = subnet.split("/");
            String base = parts[0].substring(0, parts[0].lastIndexOf('.') + 1);
            int mask = Integer.parseInt(parts[1]);
            int count = Math.min(64, (1 << (32 - mask)) - 2); // limit for fast interactive sweep
            for (int i = 1; i <= count; i++) {
                list.add(base + i);
            }
        } else {
            list.add(subnet);
        }
        return list;
    }
}

