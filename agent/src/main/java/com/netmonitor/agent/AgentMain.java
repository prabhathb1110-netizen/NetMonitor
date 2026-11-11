package com.netmonitor.agent;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;

/**
 * Entry point. Usage: java -jar netmonitor-agent.jar [path/to/agent.properties]
 */
public final class AgentMain {

    public static void main(String[] args) throws Exception {
        Path file = Path.of(args.length > 0 ? args[0] : "agent.properties");
        Properties config = new Properties();
        try (InputStream in = Files.newInputStream(file)) {
            config.load(in);
        } catch (IOException e) {
            System.err.println("Cannot read " + file.toAbsolutePath() + ": " + e.getMessage());
            System.exit(1);
        }

        String agentId = config.getProperty("agent.id", "agent-a");
        String host = config.getProperty("server.host", "localhost");
        int port = Integer.parseInt(config.getProperty("server.port", "9090"));
        String token = config.getProperty("agent.token", "change-me");
        int threads = Integer.parseInt(config.getProperty("agent.threads", "20"));

        Log.info("NetMonitor agent '" + agentId + "' starting, server " + host + ":" + port);
        new Agent(host, port, agentId, token, threads).run();
    }
}
