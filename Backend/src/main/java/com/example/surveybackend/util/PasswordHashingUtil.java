package com.example.surveybackend.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Utility class for password hashing and verification
 * Uses BCrypt algorithm for secure password storage
 */
@Component
public class PasswordHashingUtil {
    
    private static final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    /**
     * Hash a plain text password using BCrypt
     * 
     * @param plainPassword The plain text password to hash
     * @return The hashed password
     */
    public String hashPassword(String plainPassword) {
        if (plainPassword == null || plainPassword.isEmpty()) {
            throw new IllegalArgumentException("Password cannot be null or empty");
        }
        return passwordEncoder.encode(plainPassword);
    }
    
    /**
     * Verify a plain text password against a hashed password
     * 
     * @param plainPassword The plain text password
     * @param hashedPassword The hashed password to compare against
     * @return true if the passwords match, false otherwise
     */
    public boolean verifyPassword(String plainPassword, String hashedPassword) {
        if (plainPassword == null || hashedPassword == null) {
            return false;
        }
        return passwordEncoder.matches(plainPassword, hashedPassword);
    }
    
    /**
     * Check if a password is already hashed (BCrypt format)
     * BCrypt hashes start with $2a$, $2b$, $2x$, or $2y$
     * 
     * @param password The password to check
     * @return true if the password appears to be hashed, false otherwise
     */
    public boolean isPasswordHashed(String password) {
        if (password == null || password.length() < 60) {
            return false;
        }
        return password.startsWith("$2a$") || 
               password.startsWith("$2b$") || 
               password.startsWith("$2x$") || 
               password.startsWith("$2y$");
    }
}
