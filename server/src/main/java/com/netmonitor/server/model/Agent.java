package com.netmonitor.server.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "agents")
public class Agent {

    /** The agent.id from the agent's properties file. */
    @Id
    private String id;

    private boolean online;
    private Instant lastHeartbeat;
    private Instant registeredAt;

    protected Agent() {
        // for JPA
    }

    public Agent(String id) {
        this.id = id;
        this.registeredAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public boolean isOnline() {
        return online;
    }

    public void setOnline(boolean online) {
        this.online = online;
    }

    public Instant getLastHeartbeat() {
        return lastHeartbeat;
    }

    public void setLastHeartbeat(Instant lastHeartbeat) {
        this.lastHeartbeat = lastHeartbeat;
    }

    public Instant getRegisteredAt() {
        return registeredAt;
    }
}
