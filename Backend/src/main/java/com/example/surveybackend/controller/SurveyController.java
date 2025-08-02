package com.example.surveybackend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.surveybackend.dto.AnnotationSubmissionRequest;
import com.example.surveybackend.dto.SubmissionPasswordRequest;
import com.example.surveybackend.entity.KnotAnnotation;
import com.example.surveybackend.entity.TrajectoryData;
import com.example.surveybackend.service.KnotAnnotationService;
import com.example.surveybackend.service.SubmissionService;
import com.example.surveybackend.service.TrajectoryDataService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Allow CORS for frontend access
public class SurveyController {
    
    @Autowired
    private TrajectoryDataService trajectoryDataService;
    
    @Autowired
    private KnotAnnotationService knotAnnotationService;
    
    @Autowired
    private SubmissionService submissionService;
    
    /**
     * Health check endpoint to verify if the backend is running.
     * 
     * @return A simple message indicating the backend status.
     */
    @GetMapping("/health")
    public String health() {
        return "Survey Backend is running!";
    }
    
    /**
     * Welcome endpoint to provide a greeting message.
     * 
     * @return A welcome message for the API.
     */
    @GetMapping("/")
    public String welcome() {
        return "Welcome to Survey Backend API";
    }
    
    /**
     * Get all trajectory data
     * 
     * @return List of all trajectory data
     */
    @GetMapping("/trajectories")
    public List<TrajectoryData> getAllTrajectories() {
        return trajectoryDataService.getAllTrajectoryData();
    }
    
    /**
     * Get all unique track IDs
     * 
     * @return List of all unique track IDs
     */
    @GetMapping("/trajectories/unique-track-ids")
    public List<Integer> getAllUniqueTrackIds() {
        return trajectoryDataService.getAllUniqueTrackIds();
    }
    
    /**
     * Get trajectory data for a specific unique track ID
     * 
     * @param uniqueTrackId The unique track ID to search for
     * @return List of trajectory data for the specified track ID
     */
    @GetMapping("/trajectories/track/{uniqueTrackId}")
    public List<TrajectoryData> getTrajectoryDataByTrackId(@PathVariable Integer uniqueTrackId) {
        return trajectoryDataService.getTrajectoryDataByTrackId(uniqueTrackId);
    }
    
    /**
     * Get trajectory data for multiple unique track IDs
     * 
     * @param uniqueTrackIds List of unique track IDs to search for
     * @return List of trajectory data for the specified track IDs
     */
    @PostMapping("/trajectories/tracks")
    public List<TrajectoryData> getTrajectoryDataByTrackIds(@RequestBody List<Integer> uniqueTrackIds) {
        return trajectoryDataService.getTrajectoryDataByTrackIds(uniqueTrackIds);
    }
    
    /**
     * Get random unique track IDs for annotation
     * 
     * @param count Number of random track IDs to return (default: 5)
     * @return List of random unique track IDs
     */
    @GetMapping("/trajectories/random/{count}")
    public List<Integer> getRandomTrackIds(@PathVariable Integer count) {
        return trajectoryDataService.getRandomTrackIds(count);
    }
    
    /**
     * Validate submission password
     * 
     * @param passwordRequest The password request containing the password to validate
     * @return Response indicating if password is valid
     */
    @PostMapping("/validate-submission-password")
    public ResponseEntity<Map<String, Object>> validateSubmissionPassword(@RequestBody SubmissionPasswordRequest passwordRequest) {
        Map<String, Object> response = new HashMap<>();
        
        boolean isValid = submissionService.validateSubmissionPassword(passwordRequest.getPassword());
        response.put("valid", isValid);
        
        if (isValid) {
            response.put("message", "Password is valid");
            return ResponseEntity.ok(response);
        } else {
            response.put("message", "Invalid password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }
    
    /**
     * Submit knot annotation data with password validation
     * 
     * @param submission The annotation submission containing all trajectory annotations and password
     * @return List of saved knot annotations or error response
     */
    @PostMapping("/annotations/submit")
    public ResponseEntity<?> submitAnnotations(@RequestBody AnnotationSubmissionRequest submission) {
        // Validate submission password first
        if (submission.getPassword() == null || !submissionService.validateSubmissionPassword(submission.getPassword())) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid or missing submission password");
            errorResponse.put("message", "A valid password is required to submit annotations");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
        
        try {
            List<KnotAnnotation> savedAnnotations = knotAnnotationService.saveAnnotationSubmission(submission);
            return ResponseEntity.ok(savedAnnotations);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to save annotations");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Get all knot annotations by session ID
     * 
     * @param sessionId The session ID to search for
     * @return List of knot annotations for the specified session
     */
    @GetMapping("/annotations/session/{sessionId}")
    public List<KnotAnnotation> getAnnotationsBySessionId(@PathVariable String sessionId) {
        return knotAnnotationService.getAnnotationsBySessionId(sessionId);
    }
    
    /**
     * Get all knot annotations
     * 
     * @return List of all knot annotations
     */
    @GetMapping("/annotations")
    public List<KnotAnnotation> getAllAnnotations() {
        return knotAnnotationService.getAllAnnotations();
    }
    
}
