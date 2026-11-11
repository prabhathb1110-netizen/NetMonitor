package com.netmonitor.server.model;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "devices")
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String host;
    /** Comma-separated TCP ports to check, for example "22,80". Empty means ping only. */
    private String tcpPorts = "";
    /** The agent that polls this device. */
    private String agentId;

    /** Group/Subnet tag (FR1). */
    private String deviceGroup = "Default";

    /** SNMP settings (FR5). */
    private boolean snmpEnabled = false;
    private String snmpCommunity = "public";
    private Long uptimeSeconds;
    private Double cpuUsage;
    private Double memoryUsage;

    @Enumerated(EnumType.STRING)
    private DeviceStatus status = DeviceStatus.UNKNOWN;
    private Double latencyMs;
    private Double packetLoss;
    /** Comma-separated ports that did not answer in the latest check. */
    private String closedPorts = "";
    private Instant lastChecked;

    protected Device() {
        // for JPA
    }

    public Device(String name, String host, String tcpPorts, String agentId) {
        this.name = name;
        this.host = host;
        this.tcpPorts = tcpPorts;
        this.agentId = agentId;
    }

    public Device(String name, String host, String tcpPorts, String agentId, String deviceGroup, boolean snmpEnabled, String snmpCommunity) {
        this.name = name;
        this.host = host;
        this.tcpPorts = tcpPorts;
        this.agentId = agentId;
        this.deviceGroup = (deviceGroup == null || deviceGroup.isBlank()) ? "Default" : deviceGroup;
        this.snmpEnabled = snmpEnabled;
        this.snmpCommunity = snmpCommunity;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getHost() {
        return host;
    }

    public void setHost(String host) {
        this.host = host;
    }

    public String getTcpPorts() {
        return tcpPorts;
    }

    public void setTcpPorts(String tcpPorts) {
        this.tcpPorts = tcpPorts;
    }

    public String getAgentId() {
        return agentId;
    }

    public void setAgentId(String agentId) {
        this.agentId = agentId;
    }

    public String getDeviceGroup() {
        return deviceGroup;
    }

    public void setDeviceGroup(String deviceGroup) {
        this.deviceGroup = deviceGroup;
    }

    public boolean isSnmpEnabled() {
        return snmpEnabled;
    }

    public void setSnmpEnabled(boolean snmpEnabled) {
        this.snmpEnabled = snmpEnabled;
    }

    public String getSnmpCommunity() {
        return snmpCommunity;
    }

    public void setSnmpCommunity(String snmpCommunity) {
        this.snmpCommunity = snmpCommunity;
    }

    public Long getUptimeSeconds() {
        return uptimeSeconds;
    }

    public void setUptimeSeconds(Long uptimeSeconds) {
        this.uptimeSeconds = uptimeSeconds;
    }

    public Double getCpuUsage() {
        return cpuUsage;
    }

    public void setCpuUsage(Double cpuUsage) {
        this.cpuUsage = cpuUsage;
    }

    public Double getMemoryUsage() {
        return memoryUsage;
    }

    public void setMemoryUsage(Double memoryUsage) {
        this.memoryUsage = memoryUsage;
    }

    public DeviceStatus getStatus() {
        return status;
    }

    public void setStatus(DeviceStatus status) {
        this.status = status;
    }

    public Double getLatencyMs() {
        return latencyMs;
    }

    public void setLatencyMs(Double latencyMs) {
        this.latencyMs = latencyMs;
    }

    public Double getPacketLoss() {
        return packetLoss;
    }

    public void setPacketLoss(Double packetLoss) {
        this.packetLoss = packetLoss;
    }

    public String getClosedPorts() {
        return closedPorts;
    }

    public void setClosedPorts(String closedPorts) {
        this.closedPorts = closedPorts;
    }

    public Instant getLastChecked() {
        return lastChecked;
    }

    public void setLastChecked(Instant lastChecked) {
        this.lastChecked = lastChecked;
    }
}
