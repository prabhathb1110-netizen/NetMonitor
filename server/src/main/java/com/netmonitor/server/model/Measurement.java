package com.netmonitor.server.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;

/** One poll result for one device. Indexed by device and time for the history charts. */
@Entity
@Table(name = "measurements",
        indexes = @Index(name = "idx_measurements_device_time", columnList = "device_id, checked_at"))
public class Measurement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long deviceId;
    private Instant checkedAt;
    private boolean up;
    private Double latencyMs;
    private Double packetLoss;
    private String closedPorts;

    protected Measurement() {
        // for JPA
    }

    public Measurement(Long deviceId, Instant checkedAt, boolean up,
                       Double latencyMs, Double packetLoss, String closedPorts) {
        this.deviceId = deviceId;
        this.checkedAt = checkedAt;
        this.up = up;
        this.latencyMs = latencyMs;
        this.packetLoss = packetLoss;
        this.closedPorts = closedPorts;
    }

    public Long getId() {
        return id;
    }

    public Long getDeviceId() {
        return deviceId;
    }

    public Instant getCheckedAt() {
        return checkedAt;
    }

    public boolean isUp() {
        return up;
    }

    public Double getLatencyMs() {
        return latencyMs;
    }

    public Double getPacketLoss() {
        return packetLoss;
    }

    public String getClosedPorts() {
        return closedPorts;
    }
}
