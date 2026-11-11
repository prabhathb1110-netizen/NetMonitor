package com.netmonitor.server.web;

import com.netmonitor.server.model.Agent;
import com.netmonitor.server.repo.AgentRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/agents")
public class AgentController {

    private final AgentRepository agents;

    public AgentController(AgentRepository agents) {
        this.agents = agents;
    }

    @GetMapping
    public List<Agent> list() {
        return agents.findAll();
    }
}
