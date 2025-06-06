package com.example.surveybackend.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.surveybackend.entity.Admin;
import com.example.surveybackend.repository.AdminRepository;

@Service
public class AdminService {
    
    @Autowired
    private AdminRepository adminRepository;
    
    /**
     * Authenticate admin with username and password
     * 
     * @param username The username
     * @param password The password
     * @return true if authentication successful, false otherwise
     */
    public boolean authenticate(String username, String password) {
        Optional<Admin> adminOpt = adminRepository.findByUsername(username);
        
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            // Simple password comparison (no encryption for this basic implementation)
            if (admin.getPassword().equals(password)) {
                // Update last login time
                admin.setLastLogin(LocalDateTime.now());
                adminRepository.save(admin);
                return true;
            }
        }
        return false;
    }
    
    /**
     * Create a new admin
     * 
     * @param username The username
     * @param password The password
     * @return The created admin
     */
    public Admin createAdmin(String username, String password) {
        Admin admin = new Admin(username, password);
        return adminRepository.save(admin);
    }
    
    /**
     * Check if admin exists by username
     * 
     * @param username The username to check
     * @return true if admin exists, false otherwise
     */
    public boolean existsByUsername(String username) {
        return adminRepository.existsByUsername(username);
    }
    
    /**
     * Find admin by username
     * 
     * @param username The username
     * @return Optional containing the admin if found
     */
    public Optional<Admin> findByUsername(String username) {
        return adminRepository.findByUsername(username);
    }
}
