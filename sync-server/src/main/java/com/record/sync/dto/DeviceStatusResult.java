package com.record.sync.dto;
import lombok.Data;
@Data
public class DeviceStatusResult {
    private String deviceId;
    private String spaceId;
    private Long lastSyncVersion;
    private Long lastSyncTime;
    private Integer pendingOperations;
    private String status;
}
