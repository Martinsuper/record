package com.record.sync.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "device")
public class Device {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "space_id", length = 64, nullable = false)
    private String spaceId;

    @Column(name = "device_name", length = 50)
    private String deviceName;

    @Column(name = "last_connected_at")
    private LocalDateTime lastConnectedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastConnectedAt = LocalDateTime.now();
    }
}