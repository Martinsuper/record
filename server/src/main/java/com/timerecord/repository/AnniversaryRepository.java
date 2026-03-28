package com.timerecord.repository;

import com.timerecord.entity.Anniversary;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnniversaryRepository extends JpaRepository<Anniversary, Long> {
    List<Anniversary> findByUserIdOrderByIsPinnedDescEventDateAsc(Long userId);
    List<Anniversary> findByUserIdAndCategory(Long userId, String category);
}