package com.record.sync.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "anniversary_category")
public class AnniversaryCategory {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "space_id", length = 64, nullable = false)
    private String spaceId;

    @Column(length = 50, nullable = false)
    private String name;

    @Column(length = 50)
    private String icon;

    @Column(name = "is_preset")
    private Boolean isPreset = false;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(nullable = false)
    private Long version = 1L;

    @Column(nullable = false)
    private Boolean deleted = false;
}