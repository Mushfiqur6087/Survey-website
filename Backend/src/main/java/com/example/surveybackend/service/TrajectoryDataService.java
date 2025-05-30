package com.example.surveybackend.service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.surveybackend.entity.TrajectoryData;
import com.example.surveybackend.repository.TrajectoryDataRepository;

@Service
public class TrajectoryDataService {
    
    @Autowired
    private TrajectoryDataRepository repository;
    
    public List<TrajectoryData> getAllTrajectoryData() {
        return repository.findAll();
    }
    
    public Optional<TrajectoryData> getTrajectoryDataById(Long id) {
        return repository.findById(id);
    }
    
    public List<TrajectoryData> getTrajectoryDataBySceneId(Integer sceneId) {
        return repository.findBySceneId(sceneId);
    }
    
    public List<TrajectoryData> getTrajectoryDataByTrackId(Integer uniqueTrackId) {
        return repository.findByUniqueTrackId(uniqueTrackId);
    }
    
    public TrajectoryData saveTrajectoryData(TrajectoryData trajectoryData) {
        return repository.save(trajectoryData);
    }
    
    public List<TrajectoryData> saveAllTrajectoryData(List<TrajectoryData> trajectoryDataList) {
        return repository.saveAll(trajectoryDataList);
    }
    
    public void deleteTrajectoryData(Long id) {
        repository.deleteById(id);
    }
    
    public void deleteAllTrajectoryData() {
        repository.deleteAll();
    }
    
    public List<Integer> getAllUniqueTrackIds() {
        return repository.findDistinctUniqueTrackIds();
    }
    
    public List<TrajectoryData> getTrajectoryDataByTrackIds(List<Integer> uniqueTrackIds) {
        return repository.findByUniqueTrackIdIn(uniqueTrackIds);
    }
    
    public List<Integer> getRandomTrackIds(Integer count) {
        List<Integer> allTrackIds = getAllUniqueTrackIds();
        Collections.shuffle(allTrackIds);
        return allTrackIds.subList(0, Math.min(count, allTrackIds.size()));
    }
}
