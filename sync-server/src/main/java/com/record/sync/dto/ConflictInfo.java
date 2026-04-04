package com.record.sync.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConflictInfo {
    private String id;
    private String reason;
    private Object serverData;
}
