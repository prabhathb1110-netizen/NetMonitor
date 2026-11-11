package com.netmonitor.server.web;

import com.netmonitor.server.model.Alert;
import com.netmonitor.server.service.AlertService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public List<Alert> listAlerts() {
        return alertService.getRecentAlerts();
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<Alert> acknowledgeAlert(@PathVariable Long id) {
        Alert acked = alertService.acknowledge(id);
        if (acked == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(acked);
    }
}

