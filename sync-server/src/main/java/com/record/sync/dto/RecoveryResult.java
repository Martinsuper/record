package com.record.sync.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;
import java.util.Map;
@Data
@AllArgsConstructor
public class RecoveryResult {
    private boolean success;
    private Long restoredVersion;
    private Map<String, List<Map<String, Object>>> data;
}
