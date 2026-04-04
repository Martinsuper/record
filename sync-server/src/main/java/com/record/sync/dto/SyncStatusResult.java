package com.record.sync.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyncStatusResult {
    private Long maxVersion;
    private Integer eventCount;
    private Integer anniversaryCount;
    private Integer eventTypeCount;
    private Integer categoryCount;
    private Long lastUpdatedAt;
}
