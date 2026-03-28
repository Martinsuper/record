package com.timerecord.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.timerecord.entity.TimelineEvent;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Data
public class TimelineEventDto {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private Long id;
    private String title;
    private String content;
    private LocalDateTime eventTime;
    private String category;
    private List<String> images;
    private LocalDateTime createdAt;

    public static TimelineEventDto fromEntity(TimelineEvent entity) {
        TimelineEventDto dto = new TimelineEventDto();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setContent(entity.getContent());
        dto.setEventTime(entity.getEventTime());
        dto.setCategory(entity.getCategory());
        dto.setImages(parseImages(entity.getImages()));
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    private static List<String> parseImages(String images) {
        if (images == null || images.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return MAPPER.readValue(images, new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}