package com.netmonitor.agent;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class AgentUnitTest {

    @Test
    void jsonRoundTrip() {
        String text = "{\"type\":\"CONFIG\",\"intervalSeconds\":30,"
                + "\"devices\":[{\"id\":1,\"host\":\"10.0.0.1\",\"tcpPorts\":[22,80]}],\"note\":\"a \\\"b\\\"\\n\"}";
        Map<?, ?> parsed = (Map<?, ?>) Json.parse(text);
        assertEquals("CONFIG", parsed.get("type"));
        assertEquals(30.0, parsed.get("intervalSeconds"));
        Map<?, ?> device = (Map<?, ?>) ((List<?>) parsed.get("devices")).get(0);
        assertEquals(List.of(22.0, 80.0), device.get("tcpPorts"));
        assertEquals("a \"b\"\n", parsed.get("note"));
        assertEquals(text, Json.write(parsed));
    }

    @Test
    void jsonRejectsBrokenInput() {
        assertThrows(IllegalArgumentException.class, () -> Json.parse("{\"a\":"));
        assertThrows(IllegalArgumentException.class, () -> Json.parse("[1,2] x"));
    }

    @Test
    void parsesLinuxPingOutput() {
        String output = """
                PING 10.0.0.1 (10.0.0.1) 56(84) bytes of data.
                64 bytes from 10.0.0.1: icmp_seq=1 ttl=64 time=2.00 ms
                64 bytes from 10.0.0.1: icmp_seq=3 ttl=64 time=4.00 ms
                3 packets transmitted, 2 received, 33% packet loss, time 401ms
                """;
        PingCheck.Result result = PingCheck.parse(output, 3);
        assertTrue(result.up());
        assertEquals(3.0, result.latencyMs());
        assertEquals(1 / 3.0, result.packetLoss(), 1e-9);
    }

    @Test
    void parsesWindowsPingOutput() {
        String output = """
                Reply from 192.168.1.1: bytes=32 time<1ms TTL=64
                Reply from 192.168.1.1: bytes=32 time=3ms TTL=64
                Reply from 192.168.1.1: bytes=32 time=2ms TTL=64
                """;
        PingCheck.Result result = PingCheck.parse(output, 3);
        assertTrue(result.up());
        assertEquals(2.0, result.latencyMs());
        assertEquals(0.0, result.packetLoss());
    }

    @Test
    void noRepliesMeansDown() {
        PingCheck.Result result = PingCheck.parse("Request timed out.\nRequest timed out.\n", 3);
        assertFalse(result.up());
        assertNull(result.latencyMs());
        assertEquals(1.0, result.packetLoss());
    }
}
