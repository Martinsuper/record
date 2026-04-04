package com.record.sync.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Change {
    private String entity;
    private String operation;
    private Object data;
    private Long clientVersion;
}
