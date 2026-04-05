package com.record.sync.entity;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "data_snapshot", indexes = {
    @Index(name = "idx_snap_space_version", columnList = "space_id, version")
})
public class DataSnapshot {
    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "space_id", length = 64, nullable = false)
    private String spaceId;

    @Column(nullable = false)
    private Long version;

    @Column(name = "data_hash", length = 64)
    private String dataHash;

    @Column(name = "snapshot_data", columnDefinition = "MEDIUMTEXT")
    private String snapshotData;  // gzip base64

    @Column(name = "created_at")
    private Long createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = System.currentTimeMillis();
    }
}
