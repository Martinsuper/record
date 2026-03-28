package com.timerecord.dto;

import com.timerecord.entity.Milestone;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class MilestoneDto {
    private Long id;
    private String title;
    private String description;
    private LocalDate targetDate;
    private Milestone.Status status;
    private LocalDateTime createdAt;
    private List<MilestoneStageDto> stages;
    private Integer progress;  // 计算进度百分比

    public static MilestoneDto fromEntity(Milestone entity) {
        MilestoneDto dto = new MilestoneDto();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setTargetDate(entity.getTargetDate());
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}