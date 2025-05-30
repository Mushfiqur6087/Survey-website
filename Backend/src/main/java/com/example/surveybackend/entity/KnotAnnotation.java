package com.example.surveybackend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "knot_annotations")
public class KnotAnnotation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "session_id")
    private String sessionId;
    
    @Column(name = "track_id")
    private Integer trackId;
    
    @Column(name = "total_knots")
    private Integer totalKnots;
    
    @Column(name = "x_coordinate")
    private Double x;
    
    @Column(name = "y_coordinate")
    private Double y;
    
    @Column(name = "relative_order")
    private Integer relativeOrder;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // Default constructor
    public KnotAnnotation() {
        this.createdAt = LocalDateTime.now();
    }
    
    // Constructor with parameters
    public KnotAnnotation(String sessionId, Integer trackId, Integer totalKnots, 
                         Double x, Double y, Integer relativeOrder) {
        this.sessionId = sessionId;
        this.trackId = trackId;
        this.totalKnots = totalKnots;
        this.x = x;
        this.y = y;
        this.relativeOrder = relativeOrder;
        this.createdAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
    
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
    
    public Double getX() {
        return x;
    }
    
    public void setX(Double x) {
        this.x = x;
    }
    
    public Double getY() {
        return y;
    }
    
    public void setY(Double y) {
        this.y = y;
    }
    
    public Integer getRelativeOrder() {
        return relativeOrder;
    }
    
    public void setRelativeOrder(Integer relativeOrder) {
        this.relativeOrder = relativeOrder;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
