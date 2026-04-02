package com.record.sync.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.record.sync.dto.FullSyncData;
import com.record.sync.dto.SyncMessage;
import com.record.sync.entity.Device;
import com.record.sync.entity.Space;
import com.record.sync.service.SpaceService;
import com.record.sync.service.SyncMessageHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;

/**
 * WebSocket 处理器
 * 处理连接建立、消息接收、连接关闭等生命周期事件
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SyncWebSocketHandler extends TextWebSocketHandler {

    private final SpaceService spaceService;
    private final SyncMessageHandler messageHandler;
    private final WebSocketSessionManager sessionManager;
    private final ObjectMapper objectMapper;

    /**
     * 连接建立后处理
     * 1. 从 URL 参数获取 shareCode 和 deviceId
     * 2. 验证 shareCode 是否有效
     * 3. 注册设备
     * 4. 发送全量同步数据
     */
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // 从 URL 参数获取 shareCode 和 deviceId
        String query = session.getUri().getQuery();
        if (query == null) {
            log.warn("No query parameters in WebSocket connection, closing session");
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        Map<String, String> params = parseQueryParams(query);
        String shareCode = params.get("shareCode");
        String deviceId = params.get("deviceId");

        if (shareCode == null || shareCode.isEmpty()) {
            log.warn("Missing shareCode parameter, closing session");
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        if (deviceId == null || deviceId.isEmpty()) {
            log.warn("Missing deviceId parameter, closing session");
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        // 验证 shareCode 并获取 space 信息
        Space space;
        try {
            space = spaceService.verifyShareCode(shareCode);
        } catch (Exception e) {
            log.warn("Invalid shareCode: {}, closing session", shareCode);
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        String spaceId = space.getId();

        // 注册设备
        String deviceName = params.get("deviceName");
        Device device = spaceService.registerDevice(spaceId, deviceId, deviceName);

        // 将 session 与 space 和 device 关联
        sessionManager.addSession(session, spaceId, deviceId);

        // 更新空间最后活跃时间
        spaceService.updateLastActive(spaceId);

        log.info("WebSocket connection established: sessionId={}, spaceId={}, deviceId={}",
                session.getId(), spaceId, deviceId);

        // 发送连接成功消息
        sendMessage(session, SyncMessage.of("connected", Map.of(
                "spaceId", spaceId,
                "deviceId", deviceId,
                "shareCode", shareCode
        ), deviceId));

        // 发送全量同步数据
        sendFullSync(session, spaceId, deviceId);
    }

    /**
     * 接收文本消息
     * 将消息路由到 SyncMessageHandler 进行处理
     */
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String sessionId = session.getId();
        String spaceId = sessionManager.getSpaceId(sessionId);
        String deviceId = sessionManager.getDeviceId(sessionId);

        if (spaceId == null || deviceId == null) {
            log.warn("Session not associated with any space or device: {}", sessionId);
            return;
        }

        String payload = message.getPayload();
        log.debug("Received message from device {} in space {}: {}", deviceId, spaceId, payload);

        // 将消息传递给消息处理器
        messageHandler.handleMessage(spaceId, deviceId, payload);
    }

    /**
     * 连接关闭后处理
     * 清理 session 关联的资源
     */
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String sessionId = session.getId();
        String spaceId = sessionManager.getSpaceId(sessionId);
        String deviceId = sessionManager.getDeviceId(sessionId);

        // 移除 session
        sessionManager.removeSession(sessionId);

        log.info("WebSocket connection closed: sessionId={}, spaceId={}, deviceId={}, status={}",
                sessionId, spaceId, deviceId, status);
    }

    /**
     * 处理传输错误
     */
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        String sessionId = session.getId();
        log.error("WebSocket transport error for session {}: {}", sessionId, exception.getMessage());

        // 关闭 session
        if (session.isOpen()) {
            session.close(CloseStatus.SERVER_ERROR);
        }
    }

    /**
     * 发送全量同步数据给客户端
     */
    private void sendFullSync(WebSocketSession session, String spaceId, String deviceId) {
        try {
            FullSyncData fullSyncData = spaceService.getFullSyncData(spaceId);
            sendMessage(session, SyncMessage.of("full_sync", fullSyncData, deviceId));
            log.info("Sent full sync data to device {} in space {}", deviceId, spaceId);
        } catch (Exception e) {
            log.error("Error sending full sync data: {}", e.getMessage(), e);
        }
    }

    /**
     * 发送消息到指定 session
     */
    private void sendMessage(WebSocketSession session, SyncMessage message) {
        try {
            String json = objectMapper.writeValueAsString(message);
            session.sendMessage(new TextMessage(json));
        } catch (Exception e) {
            log.error("Error sending message to session {}: {}", session.getId(), e.getMessage());
        }
    }

    /**
     * 解析 URL 查询参数
     */
    private Map<String, String> parseQueryParams(String query) {
        return java.util.Arrays.stream(query.split("&"))
                .map(param -> param.split("="))
                .filter(parts -> parts.length == 2)
                .collect(java.util.stream.Collectors.toMap(
                        parts -> parts[0],
                        parts -> java.net.URLDecoder.decode(parts[1], java.nio.charset.StandardCharsets.UTF_8)
                ));
    }
}