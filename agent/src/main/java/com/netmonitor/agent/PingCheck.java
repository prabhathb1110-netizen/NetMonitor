package com.netmonitor.agent;

import java.io.IOException;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Availability check (FR3): up/down, average response time and packet loss.
 *
 * Java cannot send real ICMP without administrator rights, so the agent calls the
 * operating system's ping command and reads its output. If that command is not
 * available it falls back to InetAddress.isReachable().
 */
public final class PingCheck {

    /** latencyMs is null when the device did not answer. packetLoss is 0.0 to 1.0. */
    public record Result(boolean up, Double latencyMs, double packetLoss) {}

    static final int PROBES = 3;

    private static final Pattern REPLY_TIME =
            Pattern.compile("time\\s*[=<]\\s*([0-9]+(?:\\.[0-9]+)?)\\s*ms", Pattern.CASE_INSENSITIVE);
    private static final Pattern SAFE_HOST = Pattern.compile("[A-Za-z0-9][A-Za-z0-9.:_-]*");
    private static final String OS = System.getProperty("os.name", "").toLowerCase();

    private PingCheck() {}

    public static Result ping(String host) {
        if (!SAFE_HOST.matcher(host).matches()) {
            return new Result(false, null, 1.0);
        }
        try {
            return parse(runPingCommand(host), PROBES);
        } catch (IOException e) {
            return javaFallback(host);
        }
    }

    /** Counts the reply lines ("time=3.2 ms", "time<1ms") in ping output. */
    static Result parse(String pingOutput, int sent) {
        Matcher m = REPLY_TIME.matcher(pingOutput);
        int received = 0;
        double total = 0;
        while (m.find() && received < sent) {
            received++;
            total += Double.parseDouble(m.group(1));
        }
        if (received == 0) {
            return new Result(false, null, 1.0);
        }
        return new Result(true, round(total / received), (sent - received) / (double) sent);
    }

    private static String runPingCommand(String host) throws IOException {
        List<String> command;
        if (OS.contains("win")) {
            command = List.of("ping", "-n", String.valueOf(PROBES), "-w", "1000", host);
        } else if (OS.contains("mac")) {
            command = List.of("ping", "-n", "-c", String.valueOf(PROBES), "-i", "0.2", "-W", "1000", host);
        } else {
            command = List.of("ping", "-n", "-c", String.valueOf(PROBES), "-i", "0.2", "-W", "1", host);
        }
        Process process = new ProcessBuilder(command).redirectErrorStream(true).start();
        try {
            process.getOutputStream().close();
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            process.waitFor(10, TimeUnit.SECONDS);
            return output;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("interrupted while pinging " + host);
        } finally {
            process.destroyForcibly();
        }
    }

    /** Used only when the ping command is missing. May use a TCP probe instead of ICMP. */
    private static Result javaFallback(String host) {
        int received = 0;
        double total = 0;
        try {
            InetAddress address = InetAddress.getByName(host);
            for (int k = 0; k < PROBES; k++) {
                long start = System.nanoTime();
                if (address.isReachable(1000)) {
                    received++;
                    total += (System.nanoTime() - start) / 1_000_000.0;
                }
            }
        } catch (IOException e) {
            // unknown host or network error: treated as down
        }
        if (received == 0) {
            return new Result(false, null, 1.0);
        }
        return new Result(true, round(total / received), (PROBES - received) / (double) PROBES);
    }

    private static double round(double ms) {
        return Math.round(ms * 100) / 100.0;
    }
}
