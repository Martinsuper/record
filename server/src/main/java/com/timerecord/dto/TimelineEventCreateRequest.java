package com.timerecord.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TimelineEventCreateRequest {
    @NotBlank
    private String title;
    private String content;
    @NotNull
    private LocalDateTime eventTime;
    private String category;
    private List<String> images;
}