package com.record.sync.dto;
import lombok.Data;
import java.util.List;
import java.util.Map;
@Data
public class PagePullResult {
    private Map<String, List<Map<String, Object>>> data;
    private boolean hasMore;
    private int totalPulled;
    private int totalRemaining;
    private Long maxVersion;
}
