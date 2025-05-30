package com.example.surveybackend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "trajectory_data")
public class TrajectoryData {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "scene_id")
    private Integer sceneId;
    
    @Column(name = "unique_track_id")
    private Integer uniqueTrackId;
    
    @Column(name = "local_x")
    private Double localX;
    
    @Column(name = "local_y")
    private Double localY;
    
    // Default constructor
    public TrajectoryData() {}
    
    // Constructor
    public TrajectoryData(Integer sceneId, Integer uniqueTrackId, Double localX, Double localY) {
        this.sceneId = sceneId;
        this.uniqueTrackId = uniqueTrackId;
        this.localX = localX;
        this.localY = localY;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Integer getSceneId() {
        return sceneId;
    }
    
    public void setSceneId(Integer sceneId) {
        this.sceneId = sceneId;
    }
    
    public Integer getUniqueTrackId() {
        return uniqueTrackId;
    }
    
    public void setUniqueTrackId(Integer uniqueTrackId) {
        this.uniqueTrackId = uniqueTrackId;
    }
    
    public Double getLocalX() {
        return localX;
    }
    
    public void setLocalX(Double localX) {
        this.localX = localX;
    }
    
    public Double getLocalY() {
        return localY;
    }
    
    public void setLocalY(Double localY) {
        this.localY = localY;
    }
}
