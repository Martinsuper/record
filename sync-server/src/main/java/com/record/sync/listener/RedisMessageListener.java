package com.record.sync.listener;

import com.record.sync.websocket.WebSocketSessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

/**
 * Redis Pub/Sub 消息监听器
 * 收到消息后转发给 WebSocket SessionManager
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RedisMessageListener implements MessageListener {

    private final WebSocketSessionManager sessionManager;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String channel = new String(message.getChannel());
        String body = new String(message.getBody());

        // 从 channel 中提取 spaceId: "space:{spaceId}"
        String spaceId = channel.replace("space:", "");

        log.debug("Received Redis message on channel {}: {}", channel, body);

        // 转发给同空间的所有 WebSocket 连接（排除发送源设备）
        sessionManager.broadcastToSpace(spaceId, body, null);
    }
}