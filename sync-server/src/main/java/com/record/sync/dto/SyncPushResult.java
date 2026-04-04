package com.record.sync.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyncPushResult {
    private List<String> accepted;
    private List<ConflictInfo> conflicts;
    private Long newVersion;
}
