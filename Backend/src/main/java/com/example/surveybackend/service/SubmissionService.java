package com.example.surveybackend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.surveybackend.util.PasswordHashingUtil;

@Service
public class SubmissionService {
    
    @Value("${submission.password}")
    private String submissionPassword;
    
    @Autowired
    private PasswordHashingUtil passwordHashingUtil;
    
    /**
     * Validate submission password
     * Supports both plain text and hashed passwords in configuration
     * 
     * @param password The password to validate
     * @return true if password is correct, false otherwise
     */
    public boolean validateSubmissionPassword(String password) {
        if (submissionPassword == null || password == null) {
            return false;
        }
        
        // Check if the configured password is already hashed
        if (passwordHashingUtil.isPasswordHashed(submissionPassword)) {
            // Compare against hashed password
            return passwordHashingUtil.verifyPassword(password, submissionPassword);
        } else {
            // Compare against plain text password (for backward compatibility)
            return submissionPassword.equals(password);
        }
    }
    
    /**
     * Get the hashed version of the submission password
     * This can be used to update the configuration with a hashed password
     * 
     * @return The hashed submission password
     */
    public String getHashedSubmissionPassword() {
        if (submissionPassword == null) {
            return null;
        }
        
        // If already hashed, return as is
        if (passwordHashingUtil.isPasswordHashed(submissionPassword)) {
            return submissionPassword;
        }
        
        // Hash the plain text password
        return passwordHashingUtil.hashPassword(submissionPassword);
    }
}
