package com.timerecord.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "anniversaries")
public class Anniversary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 128)
    private String title;

    @Column(nullable = false)
    private LocalDate eventDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private RepeatType repeatType = RepeatType.NONE;

    @Column(length = 32)
    private String category;

    @Column(length = 64)
    private String icon;

    @Column(length = 256)
    private String backgroundImage;

    private Integer remindDays = 0;

    private Boolean isPinned = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (repeatType == null) repeatType = RepeatType.NONE;
        if (remindDays == null) remindDays = 0;
        if (isPinned == null) isPinned = false;
    }

    public enum RepeatType {
        NONE, YEARLY, MONTHLY, WEEKLY
    }
}