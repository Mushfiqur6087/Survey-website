package com.example.surveybackend.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.surveybackend.service.SubmissionService;
import com.example.surveybackend.util.PasswordHashingUtil;

/**
 * Utility controller for password management and hashing
 * These endpoints should be secured in production environments
 */
@RestController
@RequestMapping("/api/util")
@CrossOrigin(origins = "*")
public class PasswordUtilController {
    
    @Autowired
    private PasswordHashingUtil passwordHashingUtil;
    
    @Autowired
    private SubmissionService submissionService;
    
    /**
     * Hash a plain text password
     * This can be used to generate hashed passwords for configuration
     * 
     * @param request containing the plain text password
     * @return the hashed password
     */
    @PostMapping("/hash-password")
    public ResponseEntity<Map<String, String>> hashPassword(@RequestBody Map<String, String> request) {
        try {
            String plainPassword = request.get("password");
            if (plainPassword == null || plainPassword.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Password is required"));
            }
            
            String hashedPassword = passwordHashingUtil.hashPassword(plainPassword);
            return ResponseEntity.ok(Map.of(
                "hashedPassword", hashedPassword,
                "message", "Password hashed successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to hash password: " + e.getMessage()));
        }
    }
    
    /**
     * Get the current hashed submission password
     * Useful for updating configuration files
     * 
     * @return the hashed submission password
     */
    @GetMapping("/submission-password-hash")
    public ResponseEntity<Map<String, String>> getSubmissionPasswordHash() {
        try {
            String hashedPassword = submissionService.getHashedSubmissionPassword();
            if (hashedPassword == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Submission password not configured"));
            }
            
            return ResponseEntity.ok(Map.of(
                "hashedPassword", hashedPassword,
                "message", "Current submission password hash retrieved"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to get submission password hash: " + e.getMessage()));
        }
    }
    
    /**
     * Verify if a password matches the expected hash
     * 
     * @param request containing plainPassword and hashedPassword
     * @return verification result
     */
    @PostMapping("/verify-password")
    public ResponseEntity<Map<String, Object>> verifyPassword(@RequestBody Map<String, String> request) {
        try {
            String plainPassword = request.get("plainPassword");
            String hashedPassword = request.get("hashedPassword");
            
            if (plainPassword == null || hashedPassword == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Both plainPassword and hashedPassword are required"));
            }
            
            boolean matches = passwordHashingUtil.verifyPassword(plainPassword, hashedPassword);
            return ResponseEntity.ok(Map.of(
                "matches", matches,
                "message", matches ? "Password matches" : "Password does not match"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to verify password: " + e.getMessage()));
        }
    }
}
