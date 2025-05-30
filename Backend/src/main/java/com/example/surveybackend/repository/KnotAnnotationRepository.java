package com.example.surveybackend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.surveybackend.entity.KnotAnnotation;

@Repository
public interface KnotAnnotationRepository extends JpaRepository<KnotAnnotation, Long> {
    
    /**
     * Find all knot annotations by session ID
     * 
     * @param sessionId The session ID to search for
     * @return List of knot annotations for the specified session
     */
    List<KnotAnnotation> findBySessionId(String sessionId);
    
    /**
     * Find all knot annotations by track ID
     * 
     * @param trackId The track ID to search for
     * @return List of knot annotations for the specified track
     */
    List<KnotAnnotation> findByTrackId(Integer trackId);
    
    /**
     * Find all knot annotations by session ID and track ID
     * 
     * @param sessionId The session ID to search for
     * @param trackId The track ID to search for
     * @return List of knot annotations for the specified session and track
     */
    List<KnotAnnotation> findBySessionIdAndTrackId(String sessionId, Integer trackId);
}
