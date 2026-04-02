package com.record.sync.service;

import com.record.sync.dto.SyncMessage;
import com.record.sync.entity.Event;
import com.record.sync.service.DataService;
import com.record.sync.service.SyncMessageHandler;
import com.record.sync.service.MessagePublisher;
import com.record.sync.websocket.WebSocketSessionManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SyncMessageHandlerTest {

    @Mock
    private DataService dataService;

    @Mock
    private SpaceService spaceService;

    @Mock
    private MessagePublisher messagePublisher;

    @Mock
    private WebSocketSessionManager sessionManager;

    private SyncMessageHandler handler;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        handler = new SyncMessageHandler(dataService, spaceService, messagePublisher, sessionManager, objectMapper);
    }

    @Test
    void handleMessage_eventAdd_shouldSaveAndPublish() throws Exception {
        // Setup mock to return a valid Event
        Event savedEvent = new Event();
        savedEvent.setId("event_123");
        savedEvent.setName("Test Event");
        when(dataService.saveEvent(anyString(), any(Event.class))).thenReturn(savedEvent);

        Map<String, Object> eventData = new HashMap<>();
        eventData.put("id", "event_123");
        eventData.put("name", "Test Event");
        eventData.put("time", System.currentTimeMillis());

        SyncMessage message = SyncMessage.of("event_add", eventData, "device_001");
        String messageJson = objectMapper.writeValueAsString(message);

        handler.handleMessage("space_123", "device_001", messageJson);

        verify(dataService).saveEvent(anyString(), any(Event.class));
        verify(messagePublisher).publish(anyString(), any(Object.class));
    }

    @Test
    void handleMessage_eventDelete_shouldDeleteAndPublish() throws Exception {
        Map<String, String> deleteData = new HashMap<>();
        deleteData.put("id", "event_123");

        SyncMessage message = SyncMessage.of("event_delete", deleteData, "device_001");
        String messageJson = objectMapper.writeValueAsString(message);

        handler.handleMessage("space_123", "device_001", messageJson);

        verify(dataService).deleteEvent("space_123", "event_123");
        verify(messagePublisher).publish(anyString(), any(Object.class));
    }

    @Test
    void handleMessage_heartbeat_shouldOnlyUpdateActiveTime() throws Exception {
        SyncMessage message = SyncMessage.of("heartbeat", null, "device_001");
        String messageJson = objectMapper.writeValueAsString(message);

        handler.handleMessage("space_123", "device_001", messageJson);

        verify(spaceService).updateLastActive("space_123");
        verify(messagePublisher, never()).publish(anyString(), any(Object.class));
        verify(dataService, never()).saveEvent(anyString(), any());
    }
}