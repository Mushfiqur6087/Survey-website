package com.example.surveybackend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.surveybackend.dto.AnnotationSubmissionRequest;
import com.example.surveybackend.dto.KnotData;
import com.example.surveybackend.dto.TrajectoryAnnotationData;
import com.example.surveybackend.entity.KnotAnnotation;
import com.example.surveybackend.repository.KnotAnnotationRepository;

@Service
public class KnotAnnotationService {
    
    @Autowired
    private KnotAnnotationRepository knotAnnotationRepository;
    
    /**
     * Save annotation submission data
     * 
     * @param submission The annotation submission containing all trajectory annotations
     * @return List of saved knot annotations
     */
    public List<KnotAnnotation> saveAnnotationSubmission(AnnotationSubmissionRequest submission) {
        List<KnotAnnotation> knotAnnotations = new java.util.ArrayList<>();
        
        // Process each trajectory annotation
        for (TrajectoryAnnotationData trajectory : submission.getTrajectories()) {
            // Process each knot in the trajectory
            for (KnotData knot : trajectory.getKnots()) {
                KnotAnnotation knotAnnotation = new KnotAnnotation(
                    submission.getSessionId(),
                    trajectory.getTrackId(),
                    trajectory.getTotalKnots(),
                    knot.getX(),
                    knot.getY(),
                    knot.getRelativeOrder()
                );
                knotAnnotations.add(knotAnnotation);
            }
        }
        
        // Save all knot annotations
        return knotAnnotationRepository.saveAll(knotAnnotations);
    }
    
    /**
     * Get all knot annotations by session ID
     * 
     * @param sessionId The session ID to search for
     * @return List of knot annotations for the specified session
     */
    public List<KnotAnnotation> getAnnotationsBySessionId(String sessionId) {
        return knotAnnotationRepository.findBySessionId(sessionId);
    }
    
    /**
     * Get all knot annotations by track ID
     * 
     * @param trackId The track ID to search for
     * @return List of knot annotations for the specified track
     */
    public List<KnotAnnotation> getAnnotationsByTrackId(Integer trackId) {
        return knotAnnotationRepository.findByTrackId(trackId);
    }
    
    /**
     * Get all knot annotations
     * 
     * @return List of all knot annotations
     */
    public List<KnotAnnotation> getAllAnnotations() {
        return knotAnnotationRepository.findAll();
    }
}
