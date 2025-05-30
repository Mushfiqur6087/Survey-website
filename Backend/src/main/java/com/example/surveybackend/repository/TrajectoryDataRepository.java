package com.example.surveybackend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.surveybackend.entity.TrajectoryData;

@Repository
public interface TrajectoryDataRepository extends JpaRepository<TrajectoryData, Long> {
    
    List<TrajectoryData> findBySceneId(Integer sceneId);
    
    List<TrajectoryData> findByUniqueTrackId(Integer uniqueTrackId);
    
    List<TrajectoryData> findBySceneIdAndUniqueTrackId(Integer sceneId, Integer uniqueTrackId);
    
    @Query("SELECT DISTINCT t.uniqueTrackId FROM TrajectoryData t")
    List<Integer> findDistinctUniqueTrackIds();
    
    List<TrajectoryData> findByUniqueTrackIdIn(List<Integer> uniqueTrackIds);
}
