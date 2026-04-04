package com.record.sync.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "space_version")
public class SpaceVersion {

    @Id
    @Column(name = "space_id", length = 64)
    private String spaceId;

    @Column(name = "max_version", nullable = false)
    private Long maxVersion = 0L;

    @Column(name = "updated_at")
    private Long updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", insertable = false, updatable = false)
    private Space space;
}
