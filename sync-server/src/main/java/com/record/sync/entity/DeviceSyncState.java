package com.record.sync.entity;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "device_sync_state")
public class DeviceSyncState {
    @Id
    @Column(name = "device_id", length = 64)
    private String deviceId;

    @Column(name = "space_id", length = 64, nullable = false)
    private String spaceId;

    @Column(name = "last_sync_version")
    private Long lastSyncVersion;

    @Column(name = "last_sync_time")
    private Long lastSyncTime;

    @Column(name = "pending_operations")
    private Integer pendingOperations;

    @Column(length = 20)
    private String status;  // active, inactive, blocked
}
