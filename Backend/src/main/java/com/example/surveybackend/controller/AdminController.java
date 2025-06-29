package com.example.surveybackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.surveybackend.dto.AdminLoginRequest;
import com.example.surveybackend.dto.AdminLoginResponse;
import com.example.surveybackend.service.AdminService;

import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*") // Allow CORS for frontend access
public class AdminController {
    
    @Autowired
    private AdminService adminService;
    
    // Simple in-memory session store for demo
    private static final ConcurrentHashMap<String, String> adminSessions = new ConcurrentHashMap<>();
    
    /**
     * Admin login endpoint
     * 
     * @param loginRequest The login request containing username and password
     * @return ResponseEntity with login result
     */
    @PostMapping("/login")
    public ResponseEntity<AdminLoginResponse> login(@RequestBody AdminLoginRequest loginRequest) {
        try {
            // Validate input
            if (loginRequest.getUsername() == null || loginRequest.getUsername().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(AdminLoginResponse.failure("Username is required"));
            }
            
            if (loginRequest.getPassword() == null || loginRequest.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(AdminLoginResponse.failure("Password is required"));
            }
            
            // Authenticate admin
            boolean isAuthenticated = adminService.authenticate(
                loginRequest.getUsername().trim(), 
                loginRequest.getPassword().trim()
            );
            if (isAuthenticated) {
                // Generate a session token
                String token = UUID.randomUUID().toString();
                adminSessions.put(token, loginRequest.getUsername().trim());
                return ResponseEntity.ok(AdminLoginResponse.success(loginRequest.getUsername().trim(), token));
            } else {
                return ResponseEntity.badRequest()
                    .body(AdminLoginResponse.failure("Invalid username or password"));
            }
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(AdminLoginResponse.failure("An error occurred during login: " + e.getMessage()));
        }
    }
    
    // Example of protecting an admin endpoint
    @GetMapping("/protected")
    public ResponseEntity<String> protectedEndpoint(@RequestHeader("X-Admin-Token") String token) {
        if (token == null || !adminSessions.containsKey(token)) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return ResponseEntity.ok("You are authenticated as admin: " + adminSessions.get(token));
    }
}
