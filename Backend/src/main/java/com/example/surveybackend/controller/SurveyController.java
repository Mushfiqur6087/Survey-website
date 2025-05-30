package com.example.surveybackend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.surveybackend.entity.TrajectoryData;
import com.example.surveybackend.service.TrajectoryDataService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Allow CORS for frontend access
public class SurveyController {
    
    @Autowired
    private TrajectoryDataService trajectoryDataService;
    
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
    
}
