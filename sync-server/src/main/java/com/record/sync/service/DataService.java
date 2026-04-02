package com.record.sync.service;

import com.record.sync.entity.*;
import com.record.sync.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataService {

    private final EventRepository eventRepository;
    private final AnniversaryRepository anniversaryRepository;
    private final EventTypeRepository eventTypeRepository;
    private final AnniversaryCategoryRepository anniversaryCategoryRepository;

    // ========== Event ==========

    @Transactional
    public Event saveEvent(String spaceId, Event event) {
        event.setSpaceId(spaceId);
        return eventRepository.save(event);
    }

    @Transactional
    public void deleteEvent(String spaceId, String eventId) {
        eventRepository.deleteByIdAndSpaceId(eventId, spaceId);
        log.info("Deleted event: {} in space: {}", eventId, spaceId);
    }

    // ========== Anniversary ==========

    @Transactional
    public Anniversary saveAnniversary(String spaceId, Anniversary anniversary) {
        anniversary.setSpaceId(spaceId);
        return anniversaryRepository.save(anniversary);
    }

    @Transactional
    public void deleteAnniversary(String spaceId, String anniversaryId) {
        anniversaryRepository.deleteByIdAndSpaceId(anniversaryId, spaceId);
        log.info("Deleted anniversary: {} in space: {}", anniversaryId, spaceId);
    }

    // ========== EventType ==========

    @Transactional
    public EventType saveEventType(String spaceId, EventType eventType) {
        eventType.setSpaceId(spaceId);
        return eventTypeRepository.save(eventType);
    }

    @Transactional
    public void deleteEventType(String spaceId, String typeId) {
        eventTypeRepository.deleteByIdAndSpaceId(typeId, spaceId);
        log.info("Deleted event type: {} in space: {}", typeId, spaceId);
    }

    // ========== AnniversaryCategory ==========

    @Transactional
    public AnniversaryCategory saveAnniversaryCategory(String spaceId, AnniversaryCategory category) {
        category.setSpaceId(spaceId);
        return anniversaryCategoryRepository.save(category);
    }

    @Transactional
    public void deleteAnniversaryCategory(String spaceId, String categoryId) {
        anniversaryCategoryRepository.deleteByIdAndSpaceId(categoryId, spaceId);
        log.info("Deleted anniversary category: {} in space: {}", categoryId, spaceId);
    }
}
