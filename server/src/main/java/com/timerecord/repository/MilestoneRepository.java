package com.timerecord.repository;

import com.timerecord.entity.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MilestoneRepository extends JpaRepository<Milestone, Long> {
    List<Milestone> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Milestone> findByUserIdAndStatus(Long userId, Milestone.Status status);
}