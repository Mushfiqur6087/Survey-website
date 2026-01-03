package com.example.surveybackend.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.surveybackend.dto.UserAuthRequest;
import com.example.surveybackend.dto.UserProgressRequest;
import com.example.surveybackend.entity.AnnotationUser;
import com.example.surveybackend.service.AnnotationUserService;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class AnnotationUserController {

    @Autowired
    private AnnotationUserService userService;

    /**
     * Register a new user
     * POST /api/user/register
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody UserAuthRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Username is required");
                return ResponseEntity.badRequest().body(response);
            }

            if (request.getPassword() == null || request.getPassword().length() < 4) {
                response.put("success", false);
                response.put("message", "Password must be at least 4 characters");
                return ResponseEntity.badRequest().body(response);
            }

            if (userService.usernameExists(request.getUsername())) {
                response.put("success", false);
                response.put("message", "Username already exists");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }

            String displayName = request.getDisplayName() != null ? request.getDisplayName() : request.getUsername();
            AnnotationUser user = userService.register(request.getUsername(), request.getPassword(), displayName);

            response.put("success", true);
            response.put("message", "Registration successful");
            response.put("username", user.getUsername());
            response.put("displayName", user.getDisplayName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Registration failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Login user
     * POST /api/user/login
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody UserAuthRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            Optional<AnnotationUser> userOpt = userService.login(request.getUsername(), request.getPassword());

            if (userOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Invalid username or password");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            AnnotationUser user = userOpt.get();

            response.put("success", true);
            response.put("message", "Login successful");
            response.put("username", user.getUsername());
            response.put("displayName", user.getDisplayName());
            response.put("completedCount", user.getCompletedCount());
            response.put("totalTrajectories", user.getTotalTrajectories());
            response.put("currentIndex", user.getCurrentIndex());
            response.put("hasProgress", user.getSessionData() != null);
            response.put("lastSavedAt", user.getLastSavedAt());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Login failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get user progress
     * GET /api/user/progress?username=xxx
     */
    @GetMapping("/progress")
    public ResponseEntity<Map<String, Object>> getProgress(@RequestParam String username) {
        Map<String, Object> response = new HashMap<>();

        try {
            Optional<AnnotationUser> userOpt = userService.getProgress(username);

            if (userOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "User not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            AnnotationUser user = userOpt.get();

            response.put("success", true);
            response.put("username", user.getUsername());
            response.put("displayName", user.getDisplayName());
            response.put("sessionData", user.getSessionData());
            response.put("completedCount", user.getCompletedCount());
            response.put("totalTrajectories", user.getTotalTrajectories());
            response.put("currentIndex", user.getCurrentIndex());
            response.put("lastSavedAt", user.getLastSavedAt());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to get progress: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Save user progress
     * POST /api/user/progress
     */
    @PostMapping("/progress")
    public ResponseEntity<Map<String, Object>> saveProgress(@RequestBody UserProgressRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            AnnotationUser user = userService.saveProgress(
                request.getUsername(),
                request.getSessionData(),
                request.getCompletedCount(),
                request.getCurrentIndex()
            );

            response.put("success", true);
            response.put("message", "Progress saved successfully");
            response.put("completedCount", user.getCompletedCount());
            response.put("currentIndex", user.getCurrentIndex());
            response.put("lastSavedAt", user.getLastSavedAt());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to save progress: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Reset user progress
     * DELETE /api/user/progress?username=xxx
     */
    @DeleteMapping("/progress")
    public ResponseEntity<Map<String, Object>> resetProgress(@RequestParam String username) {
        Map<String, Object> response = new HashMap<>();

        try {
            userService.resetProgress(username);

            response.put("success", true);
            response.put("message", "Progress reset successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to reset progress: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Logout user - does NOT clear saved progress (progress persists for next login)
     * POST /api/user/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();

        try {
            String username = request.get("username");
            if (username == null || username.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Username is required");
                return ResponseEntity.badRequest().body(response);
            }

            // Just acknowledge logout - do NOT clear progress data
            // Progress is preserved so user can continue where they left off
            response.put("success", true);
            response.put("message", "Logout successful");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Logout failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Check if username exists
     * GET /api/user/exists?username=xxx
     */
    @GetMapping("/exists")
    public ResponseEntity<Map<String, Object>> checkUsername(@RequestParam String username) {
        Map<String, Object> response = new HashMap<>();
        response.put("exists", userService.usernameExists(username));
        return ResponseEntity.ok(response);
    }
}
