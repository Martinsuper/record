package com.record.sync.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * WebSocket 同步消息格式
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyncMessage {

    /**
     * 消息类型：connected, full_sync, event_add, event_update, event_delete, 等
     */
    private String type;

    /**
     * 消息数据内容
     */
    private Object data;

    /**
     * 发送消息的设备 ID
     */
    private String deviceId;

    /**
     * 消息时间戳（毫秒）
     */
    private Long timestamp;

    /**
     * 创建带数据的消息
     */
    public static SyncMessage of(String type, Object data, String deviceId) {
        return new SyncMessage(type, data, deviceId, System.currentTimeMillis());
    }

    /**
     * 创建简单消息（无数据）
     */
    public static SyncMessage of(String type, String deviceId) {
        return new SyncMessage(type, null, deviceId, System.currentTimeMillis());
    }
}
