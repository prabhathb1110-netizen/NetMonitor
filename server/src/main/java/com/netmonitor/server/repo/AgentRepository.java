package com.netmonitor.server.repo;

import com.netmonitor.server.model.Agent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgentRepository extends JpaRepository<Agent, String> {

    List<Agent> findByOnlineTrue();
}
