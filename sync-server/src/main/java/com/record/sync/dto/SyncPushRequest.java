package com.record.sync.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyncPushRequest {
    private String spaceId;
    private String deviceId;
    private List<Change> changes;
}
