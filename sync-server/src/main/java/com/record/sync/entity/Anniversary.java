package com.record.sync.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;

@Data
@ToString(exclude = {"space"})
@Entity
@Table(name = "anniversary")
public class Anniversary {

    @Id
    @Column(length = 32)
    private String id;

    @Column(name = "space_id", length = 32, nullable = false)
    private String spaceId;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(nullable = false)
    private Long date;

    @Column(name = "repeat_type", length = 10)
    private String repeatType;

    @Column(length = 10)
    private String mode;

    @Column(name = "category_id", length = 32)
    private String categoryId;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "created_at")
    private Long createdAt;

    @Column(name = "updated_at")
    private Long updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", insertable = false, updatable = false)
    private Space space;
}