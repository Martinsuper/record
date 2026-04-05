package com.record.sync.dto;
import lombok.Data;
import java.util.List;
import java.util.Map;
@Data
public class BatchPushResult {
    private boolean success;
    private List<String> accepted;
    private List<ConflictInfo> conflicts;
    private Long newVersion;
    private Map<String, Integer> perEntityCounts;
}
