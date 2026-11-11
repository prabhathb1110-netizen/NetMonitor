package com.netmonitor.agent;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;

/** Service check (FR4): does a TCP port accept a connection? */
public final class TcpCheck {

    private TcpCheck() {}

    public static boolean isOpen(String host, int port, int timeoutMs) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), timeoutMs);
            return true;
        } catch (IOException | IllegalArgumentException e) {
            return false;
        }
    }
}
