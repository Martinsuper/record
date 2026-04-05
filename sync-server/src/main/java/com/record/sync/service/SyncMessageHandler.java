package com.record.sync.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.record.sync.dto.SyncMessage;
import com.record.sync.entity.*;
import com.record.sync.service.SpaceService;
import com.record.sync.websocket.WebSocketSessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * WebSocket 消息处理器
 * 处理所有业务消息类型，执行 CRUD 操作并广播变更
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SyncMessageHandler {

    private final DataService dataService;
    private final SpaceService spaceService;
    private final MessagePublisher messagePublisher;
    private final WebSocketSessionManager sessionManager;
    private final ObjectMapper objectMapper;

    /**
     * 处理接收到的消息
     */
    public void handleMessage(String spaceId, String deviceId, String messageJson) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> messageMap = objectMapper.readValue(messageJson, Map.class);

            String type = (String) messageMap.get("type");
            Object data = messageMap.get("data");

            log.info("Received message type: {} from device: {} in space: {}", type, deviceId, spaceId);

            switch (type) {
                case "event_add":
                    handleEventAdd(spaceId, deviceId, data);
                    break;
                case "event_update":
                    handleEventUpdate(spaceId, deviceId, data);
                    break;
                case "event_delete":
                    handleEventDelete(spaceId, deviceId, data);
                    break;
                case "anniversary_add":
                    handleAnniversaryAdd(spaceId, deviceId, data);
                    break;
                case "anniversary_update":
                    handleAnniversaryUpdate(spaceId, deviceId, data);
                    break;
                case "anniversary_delete":
                    handleAnniversaryDelete(spaceId, deviceId, data);
                    break;
                case "event_type_add":
                    handleEventTypeAdd(spaceId, deviceId, data);
                    break;
                case "event_type_update":
                    handleEventTypeUpdate(spaceId, deviceId, data);
                    break;
                case "event_type_delete":
                    handleEventTypeDelete(spaceId, deviceId, data);
                    break;
                case "category_add":
                    handleCategoryAdd(spaceId, deviceId, data);
                    break;
                case "category_update":
                    handleCategoryUpdate(spaceId, deviceId, data);
                    break;
                case "category_delete":
                    handleCategoryDelete(spaceId, deviceId, data);
                    break;
                case "ping":
                    handlePing(spaceId, deviceId);
                    break;
                case "heartbeat":
                    handleHeartbeat(spaceId);
                    break;
                default:
                    log.warn("Unknown message type: {}", type);
            }
        } catch (Exception e) {
            log.error("Error handling message: {}", e.getMessage(), e);
        }
    }

    // ========== Event Handlers ==========

    private void handleEventAdd(String spaceId, String deviceId, Object data) {
        try {
            Event event = objectMapper.convertValue(data, Event.class);
            event.setCreatedAt(System.currentTimeMillis());
            event.setUpdatedAt(System.currentTimeMillis());

            Event saved = dataService.saveEvent(spaceId, event);
            broadcastMessage(spaceId, deviceId, "event_add", saved);
            log.info("Added event: {} in space: {}", saved.getId(), spaceId);
        } catch (Exception e) {
            log.error("Error handling event_add: {}", e.getMessage(), e);
        }
    }

    private void handleEventUpdate(String spaceId, String deviceId, Object data) {
        try {
            Event event = objectMapper.convertValue(data, Event.class);
            event.setUpdatedAt(System.currentTimeMillis());

            Event saved = dataService.saveEvent(spaceId, event);
            broadcastMessage(spaceId, deviceId, "event_update", saved);
            log.info("Updated event: {} in space: {}", saved.getId(), spaceId);
        } catch (Exception e) {
            log.error("Error handling event_update: {}", e.getMessage(), e);
        }
    }

    private void handleEventDelete(String spaceId, String deviceId, Object data) {
        try {
            Map<String, Object> dataMap = (Map<String, Object>) data;
            String eventId = (String) dataMap.get("id");

            dataService.deleteEvent(spaceId, eventId);
            broadcastMessage(spaceId, deviceId, "event_delete", data);
            log.info("Deleted event: {} in space: {}", eventId, spaceId);
        } catch (Exception e) {
            log.error("Error handling event_delete: {}", e.getMessage(), e);
        }
    }

    // ========== Anniversary Handlers ==========

    private void handleAnniversaryAdd(String spaceId, String deviceId, Object data) {
        try {
            Anniversary anniversary = objectMapper.convertValue(data, Anniversary.class);
            anniversary.setCreatedAt(System.currentTimeMillis());
            anniversary.setUpdatedAt(System.currentTimeMillis());

            Anniversary saved = dataService.saveAnniversary(spaceId, anniversary);
            broadcastMessage(spaceId, deviceId, "anniversary_add", saved);
            log.info("Added anniversary: {} in space: {}", saved.getId(), spaceId);
        } catch (Exception e) {
            log.error("Error handling anniversary_add: {}", e.getMessage(), e);
        }
    }

    private void handleAnniversaryUpdate(String spaceId, String deviceId, Object data) {
        try {
            Anniversary anniversary = objectMapper.convertValue(data, Anniversary.class);
            anniversary.setUpdatedAt(System.currentTimeMillis());

            Anniversary saved = dataService.saveAnniversary(spaceId, anniversary);
            broadcastMessage(spaceId, deviceId, "anniversary_update", saved);
            log.info("Updated anniversary: {} in space: {}", saved.getId(), spaceId);
        } catch (Exception e) {
            log.error("Error handling anniversary_update: {}", e.getMessage(), e);
        }
    }

    private void handleAnniversaryDelete(String spaceId, String deviceId, Object data) {
        try {
            Map<String, Object> dataMap = (Map<String, Object>) data;
            String anniversaryId = (String) dataMap.get("id");

            dataService.deleteAnniversary(spaceId, anniversaryId);
            broadcastMessage(spaceId, deviceId, "anniversary_delete", data);
            log.info("Deleted anniversary: {} in space: {}", anniversaryId, spaceId);
        } catch (Exception e) {
            log.error("Error handling anniversary_delete: {}", e.getMessage(), e);
        }
    }

    // ========== EventType Handlers ==========

    private void handleEventTypeAdd(String spaceId, String deviceId, Object data) {
        try {
            EventType eventType = objectMapper.convertValue(data, EventType.class);
            eventType.setCreatedAt(System.currentTimeMillis());

            EventType saved = dataService.saveEventType(spaceId, eventType);
            broadcastMessage(spaceId, deviceId, "event_type_add", saved);
            log.info("Added event type: {} in space: {}", saved.getId(), spaceId);
        } catch (Exception e) {
            log.error("Error handling event_type_add: {}", e.getMessage(), e);
        }
    }

    private void handleEventTypeUpdate(String spaceId, String deviceId, Object data) {
        try {
            EventType eventType = objectMapper.convertValue(data, EventType.class);

            EventType saved = dataService.saveEventType(spaceId, eventType);
            broadcastMessage(spaceId, deviceId, "event_type_update", saved);
            log.info("Updated event type: {} in space: {}", saved.getId(), spaceId);
        } catch (Exception e) {
            log.error("Error handling event_type_update: {}", e.getMessage(), e);
        }
    }

    private void handleEventTypeDelete(String spaceId, String deviceId, Object data) {
        try {
            Map<String, Object> dataMap = (Map<String, Object>) data;
            String typeId = (String) dataMap.get("id");

            dataService.deleteEventType(spaceId, typeId);
            broadcastMessage(spaceId, deviceId, "event_type_delete", data);
            log.info("Deleted event type: {} in space: {}", typeId, spaceId);
        } catch (Exception e) {
            log.error("Error handling event_type_delete: {}", e.getMessage(), e);
        }
    }

    // ========== Category Handlers ==========

    private void handleCategoryAdd(String spaceId, String deviceId, Object data) {
        try {
            AnniversaryCategory category = objectMapper.convertValue(data, AnniversaryCategory.class);

            AnniversaryCategory saved = dataService.saveAnniversaryCategory(spaceId, category);
            broadcastMessage(spaceId, deviceId, "category_add", saved);
            log.info("Added category: {} in space: {}", saved.getId(), spaceId);
        } catch (Exception e) {
            log.error("Error handling category_add: {}", e.getMessage(), e);
        }
    }

    private void handleCategoryUpdate(String spaceId, String deviceId, Object data) {
        try {
            AnniversaryCategory category = objectMapper.convertValue(data, AnniversaryCategory.class);

            AnniversaryCategory saved = dataService.saveAnniversaryCategory(spaceId, category);
            broadcastMessage(spaceId, deviceId, "category_update", saved);
            log.info("Updated category: {} in space: {}", saved.getId(), spaceId);
        } catch (Exception e) {
            log.error("Error handling category_update: {}", e.getMessage(), e);
        }
    }

    private void handleCategoryDelete(String spaceId, String deviceId, Object data) {
        try {
            Map<String, Object> dataMap = (Map<String, Object>) data;
            String categoryId = (String) dataMap.get("id");

            dataService.deleteAnniversaryCategory(spaceId, categoryId);
            broadcastMessage(spaceId, deviceId, "category_delete", data);
            log.info("Deleted category: {} in space: {}", categoryId, spaceId);
        } catch (Exception e) {
            log.error("Error handling category_delete: {}", e.getMessage(), e);
        }
    }

    /**
     * 广播消息到同一空间的所有设备
     */
    private void broadcastMessage(String spaceId, String excludeDeviceId, String type, Object data) {
        try {
            SyncMessage message = SyncMessage.of(type, data, excludeDeviceId);
            String json = objectMapper.writeValueAsString(message);

            // 通过 Redis 发布消息
            messagePublisher.publish(spaceId, json);

            // 同时通过 WebSocket 直接广播
            sessionManager.broadcastToSpace(spaceId, json, excludeDeviceId);
        } catch (Exception e) {
            log.error("Error broadcasting message: {}", e.getMessage(), e);
        }
    }

    /**
     * 处理 ping 心跳消息
     * 返回 pong 响应并更新空间活跃时间
     */
    private void handlePing(String spaceId, String deviceId) {
        try {
            // 发送 pong 响应
            SyncMessage pong = SyncMessage.of("pong", null, deviceId);
            String json = objectMapper.writeValueAsString(pong);
            sessionManager.sendToDevice(deviceId, json);

            // 更新空间活跃时间
            spaceService.updateLastActive(spaceId);
            log.debug("Ping handled, pong sent to device: {} in space: {}", deviceId, spaceId);
        } catch (Exception e) {
            log.error("Error handling ping: {}", e.getMessage(), e);
        }
    }

    /**
     * 处理心跳消息
     * 更新空间的最后活跃时间，不广播心跳消息
     */
    private void handleHeartbeat(String spaceId) {
        try {
            spaceService.updateLastActive(spaceId);
            log.debug("Updated last active time for space: {}", spaceId);
        } catch (Exception e) {
            log.error("Error handling heartbeat: {}", e.getMessage(), e);
        }
    }
}