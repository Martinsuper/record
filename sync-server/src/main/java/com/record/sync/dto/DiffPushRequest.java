package com.record.sync.dto;
import lombok.Data;
import java.util.List;
import java.util.Map;
@Data
public class DiffPushRequest {
    private String spaceId;
    private String deviceId;
    private String entityId;
    private String entity;
    private String operation;
    private List<String> changedFields;
    private Map<String, Object> fieldValues;
    private Long clientVersion;
}
