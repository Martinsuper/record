package com.record.sync.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
@Data
@AllArgsConstructor
public class SyncHashResult {
    private String hash;
    private Long version;
}
