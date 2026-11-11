package com.netmonitor.server.web;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/**
 * Live push to open dashboards (FR7). Every browser holds one WebSocket on /ws and
 * receives messages of the form {"type": "...", "data": ...}:
 *   device        - a device was added, changed or checked
 *   deviceRemoved - data is the device id
 *   agent         - an agent registered, went online or went offline
 */
@Component
public class DashboardHub extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(DashboardHub.class);

    private final ObjectMapper mapper;
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public DashboardHub(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        // The decorator makes it safe to send to one session from several threads.
        sessions.put(session.getId(), new ConcurrentWebSocketSessionDecorator(session, 5000, 512 * 1024));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session.getId());
    }

    public void broadcast(String type, Object data) {
        if (sessions.isEmpty()) {
            return;
        }
        Map<String, Object> message = new LinkedHashMap<>();
        message.put("type", type);
        message.put("data", data);
        TextMessage text;
        try {
            text = new TextMessage(mapper.writeValueAsString(message));
        } catch (JsonProcessingException e) {
            log.warn("Cannot serialise {} message: {}", type, e.getMessage());
            return;
        }
        for (Map.Entry<String, WebSocketSession> entry : sessions.entrySet()) {
            try {
                entry.getValue().sendMessage(text);
            } catch (IOException | RuntimeException e) {
                sessions.remove(entry.getKey());
            }
        }
    }
}
