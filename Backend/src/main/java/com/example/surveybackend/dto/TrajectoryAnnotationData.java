package com.example.surveybackend.dto;

import java.util.List;

// DTO for trajectory annotation data
public class TrajectoryAnnotationData {
    private Integer trackId;
    private Integer totalKnots;
    private List<KnotData> knots;
    
    // Constructors
    public TrajectoryAnnotationData() {}
    
    public TrajectoryAnnotationData(Integer trackId, Integer totalKnots, List<KnotData> knots) {
        this.trackId = trackId;
        this.totalKnots = totalKnots;
        this.knots = knots;
    }
    
    // Getters and Setters
    public Integer getTrackId() {
        return trackId;
    }
    
    public void setTrackId(Integer trackId) {
        this.trackId = trackId;
    }
    
    public Integer getTotalKnots() {
        return totalKnots;
    }
    
    public void setTotalKnots(Integer totalKnots) {
        this.totalKnots = totalKnots;
    }
    
    public List<KnotData> getKnots() {
        return knots;
    }
    
    public void setKnots(List<KnotData> knots) {
        this.knots = knots;
    }
}
