package com.example.surveybackend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.surveybackend.entity.AnnotationUser;

@Repository
public interface AnnotationUserRepository extends JpaRepository<AnnotationUser, Long> {

    Optional<AnnotationUser> findByUsername(String username);

    boolean existsByUsername(String username);
}
