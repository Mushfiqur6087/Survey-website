package com.example.surveybackend.config;

import com.example.surveybackend.entity.TrajectoryData;
import com.example.surveybackend.service.TrajectoryDataService;
import com.example.surveybackend.service.AdminService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@Component
public class DataInitializer implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);
    
    @Autowired
    private TrajectoryDataService trajectoryDataService;
    
    @Autowired
    private AdminService adminService;
    
    // CHANGE 1: Add configurable paths
    @Value("${app.dataset.json.path:/opt/survey-data/trajectory_data.json}")
    private String datasetJsonPath;
    
    @Value("${app.dataset.script.path:/opt/survey-data/export_data.py}")
    private String pythonScriptPath;
    
    @Value("${app.dataset.script.dir:/opt/survey-data}")
    private String pythonScriptDir;
    
    @Override
    public void run(String... args) throws Exception {
        logger.info("Starting data initialization...");
        
        // Initialize default admin
        initializeDefaultAdmin();
        
        // Check if data already exists
        List<TrajectoryData> existingData = trajectoryDataService.getAllTrajectoryData();
        if (!existingData.isEmpty()) {
            logger.info("Trajectory data already exists in database. Skipping initialization.");
            return;
        }
        
        try {
            // CHANGE 2: Check if JSON file exists first, skip Python script if it does
            File jsonFile = new File(datasetJsonPath);
            if (!jsonFile.exists()) {
                logger.info("JSON file not found at {}, attempting to run Python script", datasetJsonPath);
                
                // Run Python script to process and export data
                if (!runPythonDataExport()) {
                    logger.error("Failed to run Python data export script and no existing JSON file found");
                    return;
                }
            } else {
                logger.info("Found existing JSON file at {}, skipping Python script execution", datasetJsonPath);
            }
            
            // Load the exported JSON data
            List<TrajectoryData> trajectoryDataList = loadTrajectoryDataFromJson();
            
            if (trajectoryDataList.isEmpty()) {
                logger.warn("No trajectory data found to import");
                return;
            }
            
            // Save to database
            logger.info("Saving {} trajectory records to database...", trajectoryDataList.size());
            trajectoryDataService.saveAllTrajectoryData(trajectoryDataList);
            logger.info("Successfully initialized database with trajectory data");
            
        } catch (IOException e) {
            logger.error("IO error during data initialization: {}", e.getMessage(), e);
        } catch (RuntimeException e) {
            logger.error("Runtime error during data initialization: {}", e.getMessage(), e);
        }
    }
    
    private boolean runPythonDataExport() {
        try {
            // CHANGE 3: Use configurable paths instead of hardcoded relative paths
            File scriptFile = new File(pythonScriptPath);
            File workingDir = new File(pythonScriptDir);
            
            if (!scriptFile.exists()) {
                logger.error("Python script not found at: {}", pythonScriptPath);
                return false;
            }
            
            if (!workingDir.exists()) {
                logger.error("Python script directory not found at: {}", pythonScriptDir);
                return false;
            }
            
            ProcessBuilder processBuilder = new ProcessBuilder("python3", pythonScriptPath);
            processBuilder.directory(workingDir);
            
            logger.info("Running Python script: {} from directory: {}", pythonScriptPath, pythonScriptDir);
            Process process = processBuilder.start();
            
            int exitCode = process.waitFor();
            if (exitCode == 0) {
                logger.info("Python script executed successfully");
                return true;
            } else {
                logger.error("Python script failed with exit code: {}", exitCode);
                return false;
            }
            
        } catch (IOException e) {
            logger.error("IO error running Python script: {}", e.getMessage(), e);
            return false;
        } catch (InterruptedException e) {
            logger.error("Python script execution was interrupted: {}", e.getMessage(), e);
            Thread.currentThread().interrupt(); // Restore interrupted status
            return false;
        } catch (RuntimeException e) {
            logger.error("Runtime error running Python script: {}", e.getMessage(), e);
            return false;
        }
    }
    
    private List<TrajectoryData> loadTrajectoryDataFromJson() throws IOException {
        // CHANGE 4: Use configurable path instead of hardcoded relative path
        File jsonFile = new File(datasetJsonPath);
        
        if (!jsonFile.exists()) {
            throw new IOException("JSON file not found at: " + datasetJsonPath);
        }
        
        ObjectMapper objectMapper = new ObjectMapper();
        List<TrajectoryData> trajectoryDataList = new ArrayList<>();
        
        try {
            logger.info("Loading trajectory data from: {}", jsonFile.getAbsolutePath());
            
            List<Map<String, Object>> jsonData = objectMapper.readValue(
                jsonFile, 
                new TypeReference<List<Map<String, Object>>>() {}
            );
            
            for (Map<String, Object> record : jsonData) {
                TrajectoryData trajectoryData = new TrajectoryData();
                trajectoryData.setSceneId((Integer) record.get("sceneId"));
                trajectoryData.setUniqueTrackId((Integer) record.get("uniqueTrackId"));
                trajectoryData.setLocalX((Double) record.get("localX"));
                trajectoryData.setLocalY((Double) record.get("localY"));
                
                trajectoryDataList.add(trajectoryData);
            }
            
            logger.info("Loaded {} trajectory records from JSON", trajectoryDataList.size());
            
        } catch (IOException e) {
            logger.error("Error reading JSON file: {}", e.getMessage(), e);
            throw e;
        }
        
        return trajectoryDataList;
    }
    
    /**
     * Initialize default admin user if it doesn't exist
     */
    private void initializeDefaultAdmin() {
        try {
            String defaultUsername = "admin";
            String defaultPassword = "admin";
            
            if (!adminService.existsByUsername(defaultUsername)) {
                adminService.createAdmin(defaultUsername, defaultPassword);
                logger.info("Default admin user created successfully with username: {} and password: {}", 
                    defaultUsername, defaultPassword);
            } else {
                logger.info("Default admin user already exists");
            }
        } catch (Exception e) {
            logger.error("Error creating default admin user: {}", e.getMessage(), e);
        }
    }
}
