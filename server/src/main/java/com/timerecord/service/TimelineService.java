package com.timerecord.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.timerecord.dto.TimelineEventCreateRequest;
import com.timerecord.dto.TimelineEventDto;
import com.timerecord.entity.TimelineEvent;
import com.timerecord.exception.ResourceNotFoundException;
import com.timerecord.repository.TimelineEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimelineService {

    private final TimelineEventRepository repository;
    private final ObjectMapper objectMapper;

    public Page<TimelineEventDto> getAllByUser(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return repository.findByUserIdOrderByEventTimeDesc(userId, pageable)
            .map(TimelineEventDto::fromEntity);
    }

    public List<TimelineEventDto> getByCategory(Long userId, String category) {
        return repository.findByUserIdAndCategoryOrderByEventTimeDesc(userId, category)
            .stream()
            .map(TimelineEventDto::fromEntity)
            .collect(Collectors.toList());
    }

    public TimelineEventDto getById(Long id, Long userId) {
        TimelineEvent event = repository.findById(id)
            .filter(e -> e.getUserId().equals(userId))
            .orElseThrow(() -> new ResourceNotFoundException("Timeline event not found"));
        return TimelineEventDto.fromEntity(event);
    }

    @Transactional
    public TimelineEventDto create(Long userId, TimelineEventCreateRequest request) {
        TimelineEvent event = new TimelineEvent();
        event.setUserId(userId);
        event.setTitle(request.getTitle());
        event.setContent(request.getContent());
        event.setEventTime(request.getEventTime());
        event.setCategory(request.getCategory());
        event.setImages(toJson(request.getImages()));

        return TimelineEventDto.fromEntity(repository.save(event));
    }

    @Transactional
    public TimelineEventDto update(Long id, Long userId, TimelineEventCreateRequest request) {
        TimelineEvent event = repository.findById(id)
            .filter(e -> e.getUserId().equals(userId))
            .orElseThrow(() -> new ResourceNotFoundException("Timeline event not found"));

        event.setTitle(request.getTitle());
        event.setContent(request.getContent());
        event.setEventTime(request.getEventTime());
        event.setCategory(request.getCategory());
        event.setImages(toJson(request.getImages()));

        return TimelineEventDto.fromEntity(repository.save(event));
    }

    @Transactional
    public void delete(Long id, Long userId) {
        TimelineEvent event = repository.findById(id)
            .filter(e -> e.getUserId().equals(userId))
            .orElseThrow(() -> new ResourceNotFoundException("Timeline event not found"));
        repository.delete(event);
    }

    private String toJson(List<String> list) {
        if (list == null || list.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}