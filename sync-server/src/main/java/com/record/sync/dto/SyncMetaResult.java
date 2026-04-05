package com.record.sync.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
@Data
@AllArgsConstructor
public class SyncMetaResult {
    private Long totalEvents;
    private Long totalAnniversaries;
    private Long totalEventTypes;
    private Long totalCategories;
    private String dataHash;
    private Long maxVersion;
}
