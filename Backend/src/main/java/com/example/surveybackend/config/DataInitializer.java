package com.example.surveybackend.config;

import com.example.surveybackend.entity.Admin;
import com.example.surveybackend.entity.TrajectoryData;
import com.example.surveybackend.service.TrajectoryDataService;
import com.example.surveybackend.service.AdminService;
import com.example.surveybackend.util.PasswordHashingUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.ArrayList;

@Component
public class DataInitializer implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);
    
    @Autowired
    private TrajectoryDataService trajectoryDataService;
    
    @Autowired
    private AdminService adminService;
    
    @Autowired
    private PasswordHashingUtil passwordHashingUtil;
    
    @Value("${admin.default.username}")
    private String defaultAdminUsername;
    
    @Value("${admin.default.password}")
    private String defaultAdminPassword;
    
    @Override
    public void run(String... args) throws Exception {
        logger.info("Starting data initialization...");
        
        // Initialize default admin with password migration
        initializeDefaultAdmin();
        
        // Check if data already exists
        List<TrajectoryData> existingData = trajectoryDataService.getAllTrajectoryData();
        if (!existingData.isEmpty()) {
            logger.info("Trajectory data already exists in database. Skipping initialization.");
            return;
        }
        
        try {
            // Check if JSON file exists
            String jsonFile = System.getProperty("user.dir") + "/../Dataset/trajectory_data.json";
            File jsonFileObj = new File(jsonFile);
            
            if (!jsonFileObj.exists()) {
                logger.error("JSON file not found at: {}. Please ensure the trajectory_data.json file exists in the Dataset directory.", jsonFile);
                return;
            }
            
            logger.info("JSON file found. Loading data from: {}", jsonFile);
            
            // Load the JSON data
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
    
    private List<TrajectoryData> loadTrajectoryDataFromJson() throws IOException {
        String jsonFile = System.getProperty("user.dir") + "/../Dataset/trajectory_data.json";
        ObjectMapper objectMapper = new ObjectMapper();
        List<TrajectoryData> trajectoryDataList = new ArrayList<>();
        
        try {
            List<Map<String, Object>> jsonData = objectMapper.readValue(
                new File(jsonFile), 
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
     * Also handles migration of existing admin with plain text password to hashed password
     */
    @Transactional
    private void initializeDefaultAdmin() {
        try {
            Optional<Admin> existingAdmin = adminService.findByUsername(defaultAdminUsername);
            
            if (existingAdmin.isPresent()) {
                Admin admin = existingAdmin.get();
                // Check if the existing admin password needs to be migrated to hashed format
                if (!passwordHashingUtil.isPasswordHashed(admin.getPassword())) {
                    logger.info("Migrating existing admin password to hashed format");
                    // Delete and recreate to ensure proper hashing
                    adminService.deleteAdmin(defaultAdminUsername);
                    adminService.createAdmin(defaultAdminUsername, defaultAdminPassword);
                    logger.info("Admin password successfully migrated to hashed format");
                } else {
                    logger.info("Default admin user already exists with hashed password");
                }
            } else {
                // Create new admin with hashed password
                adminService.createAdmin(defaultAdminUsername, defaultAdminPassword);
                logger.info("Default admin user created successfully with username: {} (password hashed)", 
                    defaultAdminUsername);
            }
        } catch (Exception e) {
            logger.error("Error creating or migrating default admin user: {}", e.getMessage(), e);
        }
    }
}
