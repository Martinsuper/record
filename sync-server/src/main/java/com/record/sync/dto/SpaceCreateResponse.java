package com.record.sync.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 创建空间响应数据
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SpaceCreateResponse {

    private String spaceId;
    private String shareCode;
}
