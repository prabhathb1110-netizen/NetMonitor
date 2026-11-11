package com.netmonitor.server.web;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final DashboardHub hub;

    public WebSocketConfig(DashboardHub hub) {
        this.hub = hub;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Phase 5: restrict the allowed origins once login is added.
        registry.addHandler(hub, "/ws").setAllowedOriginPatterns("*");
    }
}
