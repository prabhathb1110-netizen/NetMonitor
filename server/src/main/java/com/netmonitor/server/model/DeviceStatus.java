package com.netmonitor.server.model;

public enum DeviceStatus {
    /** Not checked yet, or its agent is offline. */
    UNKNOWN,
    UP,
    /** The device answers, but at least one monitored TCP port is closed. */
    DEGRADED,
    DOWN
}
