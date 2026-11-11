package com.netmonitor.server.service;

import com.netmonitor.server.model.Alert;
import com.netmonitor.server.repo.AlertRepository;
import com.netmonitor.server.web.DashboardHub;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * FR9: Alerting service for threshold evaluation, storage, and dashboard notification.
 */
@Service
public class AlertService {

    private static final Logger log = LoggerFactory.getLogger(AlertService.class);

    private final AlertRepository alertRepository;
    private final DashboardHub hub;

    @Value("${netmonitor.alert.latency-threshold-ms:300.0}")
    private double latencyThresholdMs;

    @Value("${netmonitor.alert.packet-loss-threshold:20.0}")
    private double packetLossThreshold;

    public AlertService(AlertRepository alertRepository, DashboardHub hub) {
        this.alertRepository = alertRepository;
        this.hub = hub;
    }

    public void evaluateDeviceMetrics(Long deviceId, String deviceName, boolean up, Double latencyMs, Double packetLoss) {
        if (!up) {
            triggerAlert(deviceId, deviceName, "CRITICAL", "Device is DOWN or completely unreachable");
            return;
        }

        if (latencyMs != null && latencyMs > latencyThresholdMs) {
            triggerAlert(deviceId, deviceName, "WARNING",
                    String.format("High latency detected: %.1f ms (Threshold: %.1f ms)", latencyMs, latencyThresholdMs));
        }

        if (packetLoss != null && packetLoss > packetLossThreshold) {
            triggerAlert(deviceId, deviceName, "WARNING",
                    String.format("High packet loss detected: %.1f%% (Threshold: %.1f%%)", packetLoss, packetLossThreshold));
        }
    }

    public Alert triggerAlert(Long deviceId, String deviceName, String severity, String message) {
        Alert alert = new Alert(deviceId, deviceName, severity, message);
        alert = alertRepository.save(alert);
        log.warn("ALERT [{}] for {}: {}", severity, deviceName, message);
        hub.broadcast("alert", alert);
        return alert;
    }

    public List<Alert> getRecentAlerts() {
        return alertRepository.findTop100ByOrderByTimestampDesc();
    }

    public Alert acknowledge(Long id) {
        return alertRepository.findById(id).map(a -> {
            a.setAcknowledged(true);
            Alert saved = alertRepository.save(a);
            hub.broadcast("alertAck", saved);
            return saved;
        }).orElse(null);
    }
}

