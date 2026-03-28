package com.timerecord.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class MilestoneStageCreateRequest {
    private String title;
    private LocalDate targetDate;
    private Integer sortOrder = 0;
}