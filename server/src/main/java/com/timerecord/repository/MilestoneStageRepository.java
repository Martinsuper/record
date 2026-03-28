package com.timerecord.repository;

import com.timerecord.entity.MilestoneStage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MilestoneStageRepository extends JpaRepository<MilestoneStage, Long> {
    List<MilestoneStage> findByMilestoneIdOrderBySortOrderAsc(Long milestoneId);
    void deleteByMilestoneId(Long milestoneId);
}