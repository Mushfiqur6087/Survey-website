package com.example.surveybackend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.surveybackend.entity.Admin;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {
    
    /**
     * Find admin by username
     * 
     * @param username The username to search for
     * @return Optional containing the admin if found
     */
    Optional<Admin> findByUsername(String username);
    
    /**
     * Check if admin exists by username
     * 
     * @param username The username to check
     * @return true if admin exists, false otherwise
     */
    boolean existsByUsername(String username);
}
