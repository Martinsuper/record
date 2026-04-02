package com.record.sync.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "event")
public class Event {

    @Id
    @Column(length = 32)
    private String id;

    @Column(name = "space_id", length = 32, nullable = false)
    private String spaceId;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(name = "type_id", length = 32)
    private String typeId;

    @Column(nullable = false)
    private Long time;

    @Column(name = "created_at")
    private Long createdAt;

    @Column(name = "updated_at")
    private Long updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", insertable = false, updatable = false)
    private Space space;
}