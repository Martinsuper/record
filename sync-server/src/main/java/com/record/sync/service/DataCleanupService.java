package com.record.sync.service;

import com.record.sync.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataCleanupService {

    private final EventRepository eventRepository;
    private final AnniversaryRepository anniversaryRepository;
    private final EventTypeRepository eventTypeRepository;
    private final AnniversaryCategoryRepository categoryRepository;

    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupSoftDeletedData() {
        log.info("Starting soft deleted data cleanup...");
        long threshold = System.currentTimeMillis() - 30L * 24 * 60 * 60 * 1000;
        try {
            eventRepository.deleteByDeletedTrueAndUpdatedAtBefore(threshold);
            anniversaryRepository.deleteByDeletedTrueAndUpdatedAtBefore(threshold);
            eventTypeRepository.deleteByDeletedTrueAndCreatedAtBefore(threshold);
            categoryRepository.deleteByDeletedTrue();
            log.info("Soft deleted data cleanup completed");
        } catch (Exception e) {
            log.error("Cleanup error: {}", e.getMessage(), e);
        }
    }
}
