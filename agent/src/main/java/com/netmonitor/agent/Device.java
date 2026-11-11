package com.netmonitor.agent;

import java.util.List;

/** One device to monitor, as sent by the server in a CONFIG message. */
public record Device(long id, String host, List<Integer> tcpPorts) {}
