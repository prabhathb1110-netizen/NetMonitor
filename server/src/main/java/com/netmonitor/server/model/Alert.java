package com.netmonitor.server.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "alerts")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long deviceId;
    private String deviceName;
    private String severity; // INFO, WARNING, CRITICAL
    private String message;
    private Instant timestamp = Instant.now();
    private boolean acknowledged = false;
    private Instant acknowledgedAt;

    public Alert() {}

    public Alert(Long deviceId, String deviceName, String severity, String message) {
        this.deviceId = deviceId;
        this.deviceName = deviceName;
        this.severity = severity;
        this.message = message;
        this.timestamp = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(Long deviceId) {
        this.deviceId = deviceId;
    }

    public String getDeviceName() {
        return deviceName;
    }

    public void setDeviceName(String deviceName) {
        this.deviceName = deviceName;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public boolean isAcknowledged() {
        return acknowledged;
    }

    public void setAcknowledged(boolean acknowledged) {
        this.acknowledged = acknowledged;
        if (acknowledged) {
            this.acknowledgedAt = Instant.now();
        }
    }

    public Instant getAcknowledgedAt() {
        return acknowledgedAt;
    }
}

