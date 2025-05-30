package com.example.surveybackend.dto;

import java.util.List;

// DTO for annotation submission request from frontend
public class AnnotationSubmissionRequest {
    private String sessionId;
    private List<TrajectoryAnnotationData> trajectories;
    
    // Constructors
    public AnnotationSubmissionRequest() {}
    
    public AnnotationSubmissionRequest(String sessionId, List<TrajectoryAnnotationData> trajectories) {
        this.sessionId = sessionId;
        this.trajectories = trajectories;
    }
    
    // Getters and Setters
    public String getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
    
    public List<TrajectoryAnnotationData> getTrajectories() {
        return trajectories;
    }
    
    public void setTrajectories(List<TrajectoryAnnotationData> trajectories) {
        this.trajectories = trajectories;
    }
}
