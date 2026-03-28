package com.timerecord.repository;

import com.timerecord.entity.TimelineEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TimelineEventRepository extends JpaRepository<TimelineEvent, Long> {
    Page<TimelineEvent> findByUserIdOrderByEventTimeDesc(Long userId, Pageable pageable);
    List<TimelineEvent> findByUserIdAndCategoryOrderByEventTimeDesc(Long userId, String category);
}