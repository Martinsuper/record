package com.record.sync.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;

@Data
@ToString(exclude = {"space"})
@Entity
@Table(name = "event_type")
public class EventType {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "space_id", length = 64, nullable = false)
    private String spaceId;

    @Column(length = 50, nullable = false)
    private String name;

    @Column(length = 10)
    private String color;

    @Column(length = 50)
    private String icon;

    @Column(nullable = false)
    private Long version = 1L;

    @Column(nullable = false)
    private Boolean deleted = false;

    @Column(name = "created_at")
    private Long createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", insertable = false, updatable = false)
    private Space space;
}