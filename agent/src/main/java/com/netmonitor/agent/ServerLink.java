package com.netmonitor.agent;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The agent's outbound connection to the central server. One JSON message per line.
 * Keeps reconnecting every few seconds while the server is unreachable.
 *
 * Phase 5: replace "new Socket()" with an SSLSocket to protect this link with TLS.
 */
final class ServerLink extends Thread {

    private static final int RETRY_SECONDS = 5;

    private final Agent agent;
    private final String host;
    private final int port;
    private final String agentId;
    private final String token;

    private Socket socket;
    private BufferedWriter out;

    ServerLink(Agent agent, String host, int port, String agentId, String token) {
        super("server-link");
        setDaemon(true);
        this.agent = agent;
        this.host = host;
        this.port = port;
        this.agentId = agentId;
        this.token = token;
    }

    @Override
    public void run() {
        while (true) {
            try (Socket s = new Socket()) {
                s.connect(new InetSocketAddress(host, port), 5000);
                s.setKeepAlive(true);
                BufferedReader in = new BufferedReader(
                        new InputStreamReader(s.getInputStream(), StandardCharsets.UTF_8));
                open(s);

                Map<String, Object> register = new LinkedHashMap<>();
                register.put("type", "REGISTER");
                register.put("agentId", agentId);
                register.put("token", token);
                send(Json.write(register));
                Log.info("Connected to server " + host + ":" + port);
                agent.onConnected();

                String line;
                while ((line = in.readLine()) != null) {
                    agent.onMessage(line);
                }
                Log.info("Server closed the connection");
            } catch (IOException e) {
                Log.info("Server unreachable (" + e.getMessage() + "), retrying in " + RETRY_SECONDS + " s");
            } finally {
                close();
            }
            try {
                Thread.sleep(RETRY_SECONDS * 1000L);
            } catch (InterruptedException e) {
                return;
            }
        }
    }

    /** Sends one line. Returns false if there is no connection, so the caller keeps it buffered. */
    synchronized boolean send(String line) {
        if (out == null) {
            return false;
        }
        try {
            out.write(line);
            out.write('\n');
            out.flush();
            return true;
        } catch (IOException e) {
            close();
            return false;
        }
    }

    private synchronized void open(Socket s) throws IOException {
        socket = s;
        out = new BufferedWriter(new OutputStreamWriter(s.getOutputStream(), StandardCharsets.UTF_8));
    }

    private synchronized void close() {
        out = null;
        if (socket != null) {
            try {
                socket.close();
            } catch (IOException ignored) {
                // already closed
            }
            socket = null;
        }
    }
}
