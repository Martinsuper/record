package com.record.sync.dto;
import lombok.Data;
@Data
public class RecoveryRequest {
    private String spaceId;
    private String deviceId;
    private Long targetVersion;
}
