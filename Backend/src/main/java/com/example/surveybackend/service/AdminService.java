package com.example.surveybackend.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.surveybackend.entity.Admin;
import com.example.surveybackend.repository.AdminRepository;
import com.example.surveybackend.util.PasswordHashingUtil;

@Service
public class AdminService {
    
    @Autowired
    private AdminRepository adminRepository;
    
    @Autowired
    private PasswordHashingUtil passwordHashingUtil;
    
    /**
     * Authenticate admin with username and password
     * 
     * @param username The username
     * @param password The plain text password
     * @return true if authentication successful, false otherwise
     */
    public boolean authenticate(String username, String password) {
        Optional<Admin> adminOpt = adminRepository.findByUsername(username);
        
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            // Verify password using BCrypt
            if (passwordHashingUtil.verifyPassword(password, admin.getPassword())) {
                // Update last login time
                admin.setLastLogin(LocalDateTime.now());
                adminRepository.save(admin);
                return true;
            }
        }
        return false;
    }
    
    /**
     * Create a new admin with hashed password
     * 
     * @param username The username
     * @param password The plain text password
     * @return The created admin
     */
    public Admin createAdmin(String username, String password) {
        // Hash the password before storing
        String hashedPassword = passwordHashingUtil.hashPassword(password);
        Admin admin = new Admin(username, hashedPassword);
        return adminRepository.save(admin);
    }
    
    /**
     * Create a new admin with pre-hashed password (for migration purposes)
     * 
     * @param username The username
     * @param password The password (plain text or already hashed)
     * @param isAlreadyHashed Whether the password is already hashed
     * @return The created admin
     */
    public Admin createAdmin(String username, String password, boolean isAlreadyHashed) {
        String finalPassword = isAlreadyHashed ? password : passwordHashingUtil.hashPassword(password);
        Admin admin = new Admin(username, finalPassword);
        return adminRepository.save(admin);
    }
    
    /**
     * Update admin password
     * 
     * @param username The username
     * @param newPassword The new plain text password
     * @return true if password was updated successfully, false otherwise
     */
    public boolean updatePassword(String username, String newPassword) {
        Optional<Admin> adminOpt = adminRepository.findByUsername(username);
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            String hashedPassword = passwordHashingUtil.hashPassword(newPassword);
            admin.setPassword(hashedPassword);
            adminRepository.save(admin);
            return true;
        }
        return false;
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
    
    /**
     * Delete admin by username (requires @Transactional in caller)
     * 
     * @param username The username of the admin to delete
     */
    public void deleteAdmin(String username) {
        adminRepository.deleteByUsername(username);
    }
}
