package com.netmonitor.server.web;

import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * FR10: User authentication and role issuance (admin / viewer).
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    public record LoginRequest(String username, String password) {}
    public record LoginResponse(String token, String username, String role) {}

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        if ("admin".equalsIgnoreCase(req.username()) && "admin123".equals(req.password())) {
            return ResponseEntity.ok(new LoginResponse(UUID.randomUUID().toString(), "admin", "ADMIN"));
        } else if ("viewer".equalsIgnoreCase(req.username()) && "viewer123".equals(req.password())) {
            return ResponseEntity.ok(new LoginResponse(UUID.randomUUID().toString(), "viewer", "VIEWER"));
        } else {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid username or password"));
        }
    }
}

