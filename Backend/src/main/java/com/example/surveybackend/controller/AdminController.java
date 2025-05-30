package com.example.surveybackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.surveybackend.dto.AdminLoginRequest;
import com.example.surveybackend.dto.AdminLoginResponse;
import com.example.surveybackend.service.AdminService;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*") // Allow CORS for frontend access
public class AdminController {
    
    @Autowired
    private AdminService adminService;
    
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
                return ResponseEntity.ok(AdminLoginResponse.success(loginRequest.getUsername().trim()));
            } else {
                return ResponseEntity.badRequest()
                    .body(AdminLoginResponse.failure("Invalid username or password"));
            }
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(AdminLoginResponse.failure("An error occurred during login: " + e.getMessage()));
        }
    }
}
