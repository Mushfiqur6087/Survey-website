package com.example.surveybackend.dto;

// DTO for individual knot data
public class KnotData {
    private Double x;
    private Double y;
    private Integer relativeOrder;
    
    // Constructors
    public KnotData() {}
    
    public KnotData(Double x, Double y, Integer relativeOrder) {
        this.x = x;
        this.y = y;
        this.relativeOrder = relativeOrder;
    }
    
    // Getters and Setters
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
}
