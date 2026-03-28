package com.timerecord.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "milestone_stages")
public class MilestoneStage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long milestoneId;

    @Column(nullable = false, length = 128)
    private String title;

    private LocalDate targetDate;

    private Boolean isCompleted = false;

    private Integer sortOrder = 0;

    @PrePersist
    protected void onCreate() {
        if (isCompleted == null) isCompleted = false;
        if (sortOrder == null) sortOrder = 0;
    }
}