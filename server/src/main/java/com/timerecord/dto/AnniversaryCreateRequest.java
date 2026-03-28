package com.timerecord.dto;

import com.timerecord.entity.Anniversary;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class AnniversaryCreateRequest {
    @NotBlank
    private String title;
    @NotNull
    private LocalDate eventDate;
    private Anniversary.RepeatType repeatType = Anniversary.RepeatType.NONE;
    private String category;
    private String icon;
    private String backgroundImage;
    private Integer remindDays = 0;
    private Boolean isPinned = false;
}