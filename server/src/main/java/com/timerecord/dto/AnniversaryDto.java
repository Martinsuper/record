package com.timerecord.dto;

import com.timerecord.entity.Anniversary;
import lombok.Data;
import java.time.LocalDate;

@Data
public class AnniversaryDto {
    private Long id;
    private String title;
    private LocalDate eventDate;
    private Anniversary.RepeatType repeatType;
    private String category;
    private String icon;
    private String backgroundImage;
    private Integer remindDays;
    private Boolean isPinned;
    private Long daysRemaining;  // 计算字段

    public static AnniversaryDto fromEntity(Anniversary entity) {
        AnniversaryDto dto = new AnniversaryDto();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setEventDate(entity.getEventDate());
        dto.setRepeatType(entity.getRepeatType());
        dto.setCategory(entity.getCategory());
        dto.setIcon(entity.getIcon());
        dto.setBackgroundImage(entity.getBackgroundImage());
        dto.setRemindDays(entity.getRemindDays());
        dto.setIsPinned(entity.getIsPinned());
        dto.setDaysRemaining(calculateDaysRemaining(entity));
        return dto;
    }

    private static Long calculateDaysRemaining(Anniversary anniversary) {
        LocalDate target = anniversary.getEventDate();
        LocalDate today = LocalDate.now();

        // 处理重复类型
        if (anniversary.getRepeatType() != Anniversary.RepeatType.NONE) {
            target = getNextOccurrence(anniversary.getEventDate(),
                                       anniversary.getRepeatType(), today);
        }

        return java.time.temporal.ChronoUnit.DAYS.between(today, target);
    }

    private static LocalDate getNextOccurrence(LocalDate baseDate,
                                               Anniversary.RepeatType type,
                                               LocalDate fromDate) {
        return switch (type) {
            case YEARLY -> {
                LocalDate next = baseDate.withYear(fromDate.getYear());
                if (next.isBefore(fromDate)) {
                    next = next.plusYears(1);
                }
                yield next;
            }
            case MONTHLY -> {
                LocalDate next = baseDate.withYear(fromDate.getYear())
                    .withMonth(fromDate.getMonthValue());
                if (next.isBefore(fromDate)) {
                    next = next.plusMonths(1);
                }
                yield next;
            }
            case WEEKLY -> {
                int daysUntilNext = (baseDate.getDayOfWeek().getValue() -
                                    fromDate.getDayOfWeek().getValue() + 7) % 7;
                yield daysUntilNext == 0 ? fromDate : fromDate.plusDays(daysUntilNext);
            }
            default -> baseDate;
        };
    }
}