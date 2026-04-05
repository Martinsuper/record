package com.record.sync.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket 会话管理器
 * 管理所有连接，按空间分组
 */
@Slf4j
@Component
public class WebSocketSessionManager {

    // sessionId -> WebSocketSession
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    // sessionId -> spaceId
    private final Map<String, String> sessionToSpace = new ConcurrentHashMap<>();

    // sessionId -> deviceId
    private final Map<String, String> sessionToDevice = new ConcurrentHashMap<>();

    // spaceId -> Set<sessionId>
    private final Map<String, Set<String>> spaceSessions = new ConcurrentHashMap<>();

    /**
     * 添加会话
     */
    public void addSession(WebSocketSession session, String spaceId, String deviceId) {
        String sessionId = session.getId();

        sessions.put(sessionId, session);
        sessionToSpace.put(sessionId, spaceId);
        sessionToDevice.put(sessionId, deviceId);

        spaceSessions.computeIfAbsent(spaceId, k -> ConcurrentHashMap.newKeySet())
                .add(sessionId);

        log.info("WebSocket session added: {} for space: {}, device: {}", sessionId, spaceId, deviceId);
    }

    /**
     * 移除会话
     */
    public void removeSession(String sessionId) {
        WebSocketSession session = sessions.remove(sessionId);
        String spaceId = sessionToSpace.remove(sessionId);
        String deviceId = sessionToDevice.remove(sessionId);

        if (spaceId != null) {
            Set<String> sessionsInSpace = spaceSessions.get(spaceId);
            if (sessionsInSpace != null) {
                sessionsInSpace.remove(sessionId);
                if (sessionsInSpace.isEmpty()) {
                    spaceSessions.remove(spaceId);
                }
            }
        }

        log.info("WebSocket session removed: {} (space: {}, device: {})", sessionId, spaceId, deviceId);
    }

    /**
     * 广播消息到指定空间的所有连接
     * @param spaceId 空间 ID
     * @param message 消息内容（JSON 字符串）
     * @param excludeDeviceId 排除的设备 ID（发送源，不回发）
     */
    public void broadcastToSpace(String spaceId, String message, String excludeDeviceId) {
        Set<String> sessionIds = spaceSessions.get(spaceId);
        if (sessionIds == null || sessionIds.isEmpty()) {
            log.debug("No active sessions for space: {}", spaceId);
            return;
        }

        for (String sessionId : sessionIds) {
            String deviceId = sessionToDevice.get(sessionId);
            if (excludeDeviceId != null && excludeDeviceId.equals(deviceId)) {
                continue; // 排除发送源
            }

            WebSocketSession session = sessions.get(sessionId);
            if (session != null && session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(message));
                } catch (IOException e) {
                    log.error("Failed to send message to session {}: {}", sessionId, e.getMessage());
                }
            }
        }
    }

    /**
     * 发送消息给特定会话
     */
    public void sendToSession(String sessionId, String message) {
        WebSocketSession session = sessions.get(sessionId);
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new TextMessage(message));
            } catch (IOException e) {
                log.error("Failed to send message to session {}: {}", sessionId, e.getMessage());
            }
        }
    }

    /**
     * 发送消息给特定设备
     */
    public void sendToDevice(String deviceId, String message) {
        // 根据 deviceId 找到对应的 session
        for (Map.Entry<String, String> entry : sessionToDevice.entrySet()) {
            if (entry.getValue().equals(deviceId)) {
                String sessionId = entry.getKey();
                WebSocketSession session = sessions.get(sessionId);
                if (session != null && session.isOpen()) {
                    try {
                        session.sendMessage(new TextMessage(message));
                        log.debug("Message sent to device: {}", deviceId);
                        return;
                    } catch (IOException e) {
                        log.error("Failed to send message to device {}: {}", deviceId, e.getMessage());
                    }
                }
            }
        }
        log.warn("No active session found for device: {}", deviceId);
    }

    /**
     * 获取空间当前连接数
     */
    public int getConnectionCount(String spaceId) {
        Set<String> sessionIds = spaceSessions.get(spaceId);
        return sessionIds != null ? sessionIds.size() : 0;
    }

    /**
     * 获取会话关联的空间 ID
     */
    public String getSpaceId(String sessionId) {
        return sessionToSpace.get(sessionId);
    }

    /**
     * 获取会话关联的设备 ID
     */
    public String getDeviceId(String sessionId) {
        return sessionToDevice.get(sessionId);
    }
}