package com.example.surveybackend.dto;

public class AdminLoginResponse {
    private boolean success;
    private String message;
    private String username;
    private String token;
    
    // Default constructor
    public AdminLoginResponse() {}
    
    // Constructor with parameters
    public AdminLoginResponse(boolean success, String message, String username, String token) {
        this.success = success;
        this.message = message;
        this.username = username;
        this.token = token;
    }
    
    // Static helper methods
    public static AdminLoginResponse success(String username, String token) {
        return new AdminLoginResponse(true, "Login successful", username, token);
    }
    
    public static AdminLoginResponse failure(String message) {
        return new AdminLoginResponse(false, message, null, null);
    }
    
    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
}
