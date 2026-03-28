package com.timerecord.dto;

import com.timerecord.entity.MilestoneStage;
import lombok.Data;
import java.time.LocalDate;

@Data
public class MilestoneStageDto {
    private Long id;
    private String title;
    private LocalDate targetDate;
    private Boolean isCompleted;
    private Integer sortOrder;

    public static MilestoneStageDto fromEntity(MilestoneStage entity) {
        MilestoneStageDto dto = new MilestoneStageDto();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setTargetDate(entity.getTargetDate());
        dto.setIsCompleted(entity.getIsCompleted());
        dto.setSortOrder(entity.getSortOrder());
        return dto;
    }
}