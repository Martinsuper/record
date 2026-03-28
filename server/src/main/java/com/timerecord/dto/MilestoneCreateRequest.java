package com.timerecord.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class MilestoneCreateRequest {
    @NotBlank
    private String title;
    private String description;
    private LocalDate targetDate;
    private List<MilestoneStageCreateRequest> stages;
}