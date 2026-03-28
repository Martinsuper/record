package com.timerecord.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "milestones")
public class Milestone {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 128)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDate targetDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private Status status = Status.IN_PROGRESS;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = Status.IN_PROGRESS;
    }

    public enum Status {
        IN_PROGRESS, COMPLETED, CANCELLED
    }
}