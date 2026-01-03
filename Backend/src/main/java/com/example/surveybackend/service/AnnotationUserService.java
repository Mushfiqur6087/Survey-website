package com.example.surveybackend.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.surveybackend.entity.AnnotationUser;
import com.example.surveybackend.repository.AnnotationUserRepository;

@Service
public class AnnotationUserService {

    @Autowired
    private AnnotationUserRepository repository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * Register a new user
     */
    public AnnotationUser register(String username, String password, String displayName) {
        if (repository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }

        String hashedPassword = passwordEncoder.encode(password);
        AnnotationUser user = new AnnotationUser(username, hashedPassword, displayName);
        return repository.save(user);
    }

    /**
     * Login user - returns user if credentials are valid
     */
    public Optional<AnnotationUser> login(String username, String password) {
        Optional<AnnotationUser> userOpt = repository.findByUsername(username);

        if (userOpt.isPresent()) {
            AnnotationUser user = userOpt.get();
            if (passwordEncoder.matches(password, user.getPasswordHash())) {
                return Optional.of(user);
            }
        }

        return Optional.empty();
    }

    /**
     * Get user by username
     */
    public Optional<AnnotationUser> getUserByUsername(String username) {
        return repository.findByUsername(username);
    }

    /**
     * Check if username exists
     */
    public boolean usernameExists(String username) {
        return repository.existsByUsername(username);
    }

    /**
     * Save user progress
     */
    public AnnotationUser saveProgress(String username, String sessionData, int completedCount, int currentIndex) {
        Optional<AnnotationUser> userOpt = repository.findByUsername(username);

        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        AnnotationUser user = userOpt.get();
        user.setSessionData(sessionData);
        user.setCompletedCount(completedCount);
        user.setCurrentIndex(currentIndex);
        user.setLastSavedAt(LocalDateTime.now());

        return repository.save(user);
    }

    /**
     * Get user progress
     */
    public Optional<AnnotationUser> getProgress(String username) {
        return repository.findByUsername(username);
    }

    /**
     * Reset user progress
     */
    public AnnotationUser resetProgress(String username) {
        Optional<AnnotationUser> userOpt = repository.findByUsername(username);

        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        AnnotationUser user = userOpt.get();
        user.setSessionData(null);
        user.setCompletedCount(0);
        user.setCurrentIndex(0);
        user.setLastSavedAt(null);

        return repository.save(user);
    }
}
