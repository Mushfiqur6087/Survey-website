package com.example.surveybackend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SubmissionService {
    
    @Value("${submission.password}")
    private String submissionPassword;
    
    /**
     * Validate submission password
     * 
     * @param password The password to validate
     * @return true if password is correct, false otherwise
     */
    public boolean validateSubmissionPassword(String password) {
        return submissionPassword != null && submissionPassword.equals(password);
    }
}
