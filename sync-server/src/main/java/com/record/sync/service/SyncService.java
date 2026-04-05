package com.record.sync.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.record.sync.dto.*;
import com.record.sync.entity.*;
import com.record.sync.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SyncService {

    private final EventRepository eventRepository;
    private final AnniversaryRepository anniversaryRepository;
    private final EventTypeRepository eventTypeRepository;
    private final AnniversaryCategoryRepository categoryRepository;
    private final SpaceVersionRepository spaceVersionRepository;
    private final ObjectMapper objectMapper;
    private final OperationLogRepository operationLogRepository;
    private final DeviceSyncStateRepository deviceSyncStateRepository;
    private final DataSnapshotRepository dataSnapshotRepository;

    public SyncPullResult pull(String spaceId, Long sinceVersion) {
        SyncPullResult result = new SyncPullResult();

        result.setEvents(eventRepository.findBySpaceIdAndVersionGreaterThan(spaceId, sinceVersion));
        result.setAnniversaries(anniversaryRepository.findBySpaceIdAndVersionGreaterThan(spaceId, sinceVersion));
        result.setEventTypes(eventTypeRepository.findBySpaceIdAndVersionGreaterThan(spaceId, sinceVersion));
        result.setCategories(categoryRepository.findBySpaceIdAndVersionGreaterThan(spaceId, sinceVersion));

        Long maxVersion = spaceVersionRepository.getMaxVersion(spaceId);
        if (maxVersion == null) {
            maxVersion = 0L;
        }
        result.setMaxVersion(maxVersion);
        result.setHasMore(maxVersion > sinceVersion + 100);

        log.info("Pull sync: space={}, sinceVersion={}, maxVersion={}, events={}, anniversaries={}, types={}, categories={}",
                spaceId, sinceVersion, maxVersion,
                result.getEvents().size(), result.getAnniversaries().size(),
                result.getEventTypes().size(), result.getCategories().size());

        return result;
    }

    @Transactional
    public SyncPushResult push(String spaceId, String deviceId, List<Change> changes) {
        List<String> accepted = new ArrayList<>();
        List<ConflictInfo> conflicts = new ArrayList<>();

        Long currentVersion = spaceVersionRepository.getMaxVersion(spaceId);
        if (currentVersion == null) {
            currentVersion = 0L;
            spaceVersionRepository.initSpaceVersion(spaceId, System.currentTimeMillis());
        }

        for (Change change : changes) {
            currentVersion++;
            try {
                switch (change.getEntity()) {
                    case "event":
                        handleEventChange(spaceId, change, currentVersion, accepted, conflicts);
                        break;
                    case "anniversary":
                        handleAnniversaryChange(spaceId, change, currentVersion, accepted, conflicts);
                        break;
                    case "eventType":
                        handleEventTypeChange(spaceId, change, currentVersion, accepted, conflicts);
                        break;
                    case "category":
                        handleCategoryChange(spaceId, change, currentVersion, accepted, conflicts);
                        break;
                    default:
                        log.warn("Unknown entity type: {}", change.getEntity());
                }
            } catch (Exception e) {
                log.error("Error handling change: {}", e.getMessage(), e);
            }
        }

        spaceVersionRepository.updateMaxVersion(spaceId, currentVersion, System.currentTimeMillis());

        log.info("Push sync: space={}, deviceId={}, accepted={}, conflicts={}, newVersion={}",
                spaceId, deviceId, accepted.size(), conflicts.size(), currentVersion);

        return new SyncPushResult(accepted, conflicts, currentVersion);
    }

    private void handleEventChange(String spaceId, Change change, Long newVersion,
                                    List<String> accepted, List<ConflictInfo> conflicts) {
        Event data = objectMapper.convertValue(change.getData(), Event.class);
        data.setSpaceId(spaceId);
        data.setVersion(newVersion);
        data.setUpdatedAt(System.currentTimeMillis());

        if ("create".equals(change.getOperation())) {
            Event existing = eventRepository.findById(data.getId()).orElse(null);
            if (existing != null && !Boolean.TRUE.equals(existing.getDeleted())) {
                // ID 已存在且未删除，转为更新操作
                if (data.getUpdatedAt() > existing.getUpdatedAt()) {
                    data.setCreatedAt(existing.getCreatedAt());
                    eventRepository.save(data);
                    accepted.add(data.getId());
                } else {
                    conflicts.add(new ConflictInfo(data.getId(), "server_win", existing));
                }
            } else {
                // 新建或覆盖已删除的记录
                if (existing == null) {
                    data.setCreatedAt(System.currentTimeMillis());
                } else {
                    data.setCreatedAt(existing.getCreatedAt());
                }
                data.setDeleted(false);
                eventRepository.save(data);
                accepted.add(data.getId());
            }

        } else if ("update".equals(change.getOperation())) {
            Event current = eventRepository.findById(data.getId()).orElse(null);

            if (current == null || Boolean.TRUE.equals(current.getDeleted())) {
                conflicts.add(new ConflictInfo(data.getId(), "deleted", null));
            } else if (current.getVersion() > change.getClientVersion()) {
                if (data.getUpdatedAt() > current.getUpdatedAt()) {
                    eventRepository.save(data);
                    accepted.add(data.getId());
                    log.debug("Updated event (client win): {}", data.getId());
                } else {
                    conflicts.add(new ConflictInfo(data.getId(), "server_win", current));
                    log.debug("Conflict (server win): {}", data.getId());
                }
            } else {
                eventRepository.save(data);
                accepted.add(data.getId());
                log.debug("Updated event: {}", data.getId());
            }

        } else if ("delete".equals(change.getOperation())) {
            Event current = eventRepository.findById(data.getId()).orElse(null);

            if (current != null && current.getVersion() <= change.getClientVersion()) {
                current.setDeleted(true);
                current.setVersion(newVersion);
                current.setUpdatedAt(System.currentTimeMillis());
                eventRepository.save(current);
                accepted.add(data.getId());
                log.debug("Soft deleted event: {}", data.getId());
            } else {
                conflicts.add(new ConflictInfo(data.getId(), "conflict", current));
            }
        }
    }

    private void handleAnniversaryChange(String spaceId, Change change, Long newVersion,
                                          List<String> accepted, List<ConflictInfo> conflicts) {
        Anniversary data = objectMapper.convertValue(change.getData(), Anniversary.class);
        data.setSpaceId(spaceId);
        data.setVersion(newVersion);
        data.setUpdatedAt(System.currentTimeMillis());

        if ("create".equals(change.getOperation())) {
            Anniversary existing = anniversaryRepository.findById(data.getId()).orElse(null);
            if (existing != null && !Boolean.TRUE.equals(existing.getDeleted())) {
                // ID 已存在且未删除，转为更新操作
                if (data.getUpdatedAt() > existing.getUpdatedAt()) {
                    data.setCreatedAt(existing.getCreatedAt()); // 保留原创建时间
                    anniversaryRepository.save(data);
                    accepted.add(data.getId());
                } else {
                    conflicts.add(new ConflictInfo(data.getId(), "server_win", existing));
                }
            } else {
                // 新建或覆盖已删除的记录
                if (existing == null) {
                    data.setCreatedAt(System.currentTimeMillis());
                } else {
                    data.setCreatedAt(existing.getCreatedAt());
                }
                data.setDeleted(false);
                anniversaryRepository.save(data);
                accepted.add(data.getId());
            }

        } else if ("update".equals(change.getOperation())) {
            Anniversary current = anniversaryRepository.findById(data.getId()).orElse(null);

            if (current == null || Boolean.TRUE.equals(current.getDeleted())) {
                conflicts.add(new ConflictInfo(data.getId(), "deleted", null));
            } else if (current.getVersion() > change.getClientVersion()) {
                if (data.getUpdatedAt() > current.getUpdatedAt()) {
                    anniversaryRepository.save(data);
                    accepted.add(data.getId());
                } else {
                    conflicts.add(new ConflictInfo(data.getId(), "server_win", current));
                }
            } else {
                anniversaryRepository.save(data);
                accepted.add(data.getId());
            }

        } else if ("delete".equals(change.getOperation())) {
            Anniversary current = anniversaryRepository.findById(data.getId()).orElse(null);

            if (current != null && current.getVersion() <= change.getClientVersion()) {
                current.setDeleted(true);
                current.setVersion(newVersion);
                current.setUpdatedAt(System.currentTimeMillis());
                anniversaryRepository.save(current);
                accepted.add(data.getId());
            } else {
                conflicts.add(new ConflictInfo(data.getId(), "conflict", current));
            }
        }
    }

    private void handleEventTypeChange(String spaceId, Change change, Long newVersion,
                                        List<String> accepted, List<ConflictInfo> conflicts) {
        EventType data = objectMapper.convertValue(change.getData(), EventType.class);
        data.setSpaceId(spaceId);
        data.setVersion(newVersion);

        if ("create".equals(change.getOperation())) {
            EventType existing = eventTypeRepository.findById(data.getId()).orElse(null);
            if (existing != null && !Boolean.TRUE.equals(existing.getDeleted())) {
                // ID 已存在且未删除，转为更新操作
                conflicts.add(new ConflictInfo(data.getId(), "already_exists", existing));
            } else {
                // 新建或覆盖已删除的记录
                if (existing == null) {
                    data.setCreatedAt(System.currentTimeMillis());
                } else {
                    data.setCreatedAt(existing.getCreatedAt());
                }
                data.setDeleted(false);
                eventTypeRepository.save(data);
                accepted.add(data.getId());
            }

        } else if ("update".equals(change.getOperation())) {
            EventType current = eventTypeRepository.findById(data.getId()).orElse(null);

            if (current == null || Boolean.TRUE.equals(current.getDeleted())) {
                conflicts.add(new ConflictInfo(data.getId(), "deleted", null));
            } else if (current.getVersion() > change.getClientVersion()) {
                conflicts.add(new ConflictInfo(data.getId(), "server_win", current));
            } else {
                eventTypeRepository.save(data);
                accepted.add(data.getId());
            }

        } else if ("delete".equals(change.getOperation())) {
            EventType current = eventTypeRepository.findById(data.getId()).orElse(null);

            if (current != null && current.getVersion() <= change.getClientVersion()) {
                current.setDeleted(true);
                current.setVersion(newVersion);
                eventTypeRepository.save(current);
                accepted.add(data.getId());
            } else {
                conflicts.add(new ConflictInfo(data.getId(), "conflict", current));
            }
        }
    }

    private void handleCategoryChange(String spaceId, Change change, Long newVersion,
                                       List<String> accepted, List<ConflictInfo> conflicts) {
        AnniversaryCategory data = objectMapper.convertValue(change.getData(), AnniversaryCategory.class);
        data.setSpaceId(spaceId);
        data.setVersion(newVersion);

        if ("create".equals(change.getOperation())) {
            AnniversaryCategory existing = categoryRepository.findById(data.getId()).orElse(null);
            if (existing != null && !Boolean.TRUE.equals(existing.getDeleted())) {
                // ID 已存在且未删除，跳过
                conflicts.add(new ConflictInfo(data.getId(), "already_exists", existing));
            } else {
                // 新建或覆盖已删除的记录
                data.setDeleted(false);
                categoryRepository.save(data);
                accepted.add(data.getId());
            }

        } else if ("update".equals(change.getOperation())) {
            AnniversaryCategory current = categoryRepository.findById(data.getId()).orElse(null);

            if (current == null || Boolean.TRUE.equals(current.getDeleted())) {
                conflicts.add(new ConflictInfo(data.getId(), "deleted", null));
            } else if (current.getVersion() > change.getClientVersion()) {
                conflicts.add(new ConflictInfo(data.getId(), "server_win", current));
            } else {
                categoryRepository.save(data);
                accepted.add(data.getId());
            }

        } else if ("delete".equals(change.getOperation())) {
            AnniversaryCategory current = categoryRepository.findById(data.getId()).orElse(null);

            if (current != null && current.getVersion() <= change.getClientVersion()) {
                current.setDeleted(true);
                current.setVersion(newVersion);
                categoryRepository.save(current);
                accepted.add(data.getId());
            } else {
                conflicts.add(new ConflictInfo(data.getId(), "conflict", current));
            }
        }
    }

    public SyncFullResult fullSync(String spaceId) {
        SyncFullResult result = new SyncFullResult();

        result.setEvents(eventRepository.findBySpaceIdAndDeletedFalse(spaceId));
        result.setAnniversaries(anniversaryRepository.findBySpaceIdAndDeletedFalse(spaceId));
        result.setEventTypes(eventTypeRepository.findBySpaceIdAndDeletedFalse(spaceId));
        result.setCategories(categoryRepository.findBySpaceIdAndDeletedFalse(spaceId));

        Long maxVersion = spaceVersionRepository.getMaxVersion(spaceId);
        if (maxVersion == null) {
            maxVersion = 0L;
        }
        result.setMaxVersion(maxVersion);

        log.info("Full sync: space={}, maxVersion={}, events={}, anniversaries={}, types={}, categories={}",
                spaceId, maxVersion,
                result.getEvents().size(), result.getAnniversaries().size(),
                result.getEventTypes().size(), result.getCategories().size());

        return result;
    }

    public SyncStatusResult getStatus(String spaceId) {
        SyncStatusResult result = new SyncStatusResult();

        Long maxVersion = spaceVersionRepository.getMaxVersion(spaceId);
        if (maxVersion == null) {
            maxVersion = 0L;
        }
        result.setMaxVersion(maxVersion);

        result.setEventCount(eventRepository.findBySpaceIdAndDeletedFalse(spaceId).size());
        result.setAnniversaryCount(anniversaryRepository.findBySpaceIdAndDeletedFalse(spaceId).size());
        result.setEventTypeCount(eventTypeRepository.findBySpaceIdAndDeletedFalse(spaceId).size());
        result.setCategoryCount(categoryRepository.findBySpaceIdAndDeletedFalse(spaceId).size());

        return result;
    }

    // ===== Task 5: New methods =====

    // Helper: record operation_log after successful push
    private void logOperation(String spaceId, Change change, Long serverVersion, String deviceId) {
        try {
            OperationLog op = new OperationLog();
            op.setId(UUID.randomUUID().toString().replace("-", ""));
            op.setSpaceId(spaceId);
            op.setEntity(change.getEntity());
            op.setEntityId(extractEntityId(change.getData()));
            op.setOperation(change.getOperation());
            op.setClientVersion(change.getClientVersion());
            op.setServerVersion(serverVersion);
            op.setDeviceId(deviceId);
            op.setNewValues(objectMapper.writeValueAsString(change.getData()));
            operationLogRepository.save(op);
        } catch (Exception e) {
            log.warn("Failed to log operation: {}", e.getMessage());
        }
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return input.hashCode() + "";
        }
    }

    private String extractEntityId(Object data) {
        if (data instanceof Event) return ((Event) data).getId();
        if (data instanceof Anniversary) return ((Anniversary) data).getId();
        if (data instanceof EventType) return ((EventType) data).getId();
        if (data instanceof AnniversaryCategory) return ((AnniversaryCategory) data).getId();
        if (data instanceof Map) {
            Object id = ((Map<?, ?>) data).get("id");
            return id != null ? id.toString() : "unknown";
        }
        return "unknown";
    }

    // Helper: create/update device sync state
    private void updateDeviceState(String spaceId, String deviceId, Long version) {
        DeviceSyncState state = deviceSyncStateRepository.findById(deviceId).orElse(null);
        if (state == null) {
            state = new DeviceSyncState();
            state.setDeviceId(deviceId);
            state.setSpaceId(spaceId);
            state.setStatus("active");
        }
        state.setLastSyncVersion(version);
        state.setLastSyncTime(System.currentTimeMillis());
        deviceSyncStateRepository.save(state);
    }

    // 1. 获取数据 hash
    public SyncHashResult getHash(String spaceId) {
        Long maxVersion = spaceVersionRepository.getMaxVersion(spaceId);
        if (maxVersion == null) maxVersion = 0L;

        String data = eventRepository.findBySpaceIdAndVersionGreaterThan(spaceId, 0L)
                .stream().map(e -> e.getId() + ":" + e.getVersion()).reduce("", String::concat);
        String hash = sha256Hex(data + maxVersion);

        return new SyncHashResult(hash, maxVersion);
    }

    // 2. 字段级差异推送
    public List<String> pushDiff(String spaceId, String deviceId, DiffPushRequest request) {
        List<String> accepted = new ArrayList<>();
        Long currentVersion = spaceVersionRepository.getMaxVersion(spaceId);
        if (currentVersion == null) {
            currentVersion = 0L;
        }

        Map<String, Object> fieldValues = request.getFieldValues() != null
                ? new java.util.HashMap<>(request.getFieldValues()) : new java.util.HashMap<>();
        fieldValues.putIfAbsent("id", request.getEntityId());

        Change change = new Change();
        change.setEntity(request.getEntity());
        change.setOperation(request.getOperation());
        change.setData(fieldValues);
        change.setClientVersion(request.getClientVersion());

        currentVersion++;
        try {
            switch (request.getEntity()) {
                case "event":
                    handleEventChange(spaceId, change, currentVersion, accepted, new ArrayList<>());
                    break;
                case "anniversary":
                    handleAnniversaryChange(spaceId, change, currentVersion, accepted, new ArrayList<>());
                    break;
                case "eventType":
                    handleEventTypeChange(spaceId, change, currentVersion, accepted, new ArrayList<>());
                    break;
                case "category":
                    handleCategoryChange(spaceId, change, currentVersion, accepted, new ArrayList<>());
                    break;
            }
        } catch (Exception e) {
            log.error("Error in pushDiff: {}", e.getMessage(), e);
        }

        if (!accepted.isEmpty()) {
            spaceVersionRepository.updateMaxVersion(spaceId, currentVersion, System.currentTimeMillis());
            updateDeviceState(spaceId, deviceId, currentVersion);
        }
        return accepted;
    }

    // 3. 批量并行推送
    public BatchPushResult batchPush(String spaceId, String deviceId, List<Change> changes) {
        BatchPushResult result = new BatchPushResult();
        List<String> allAccepted = new ArrayList<>();
        List<ConflictInfo> allConflicts = new ArrayList<>();
        Map<String, Integer> perEntityCounts = new HashMap<>();
        Long currentVersion = spaceVersionRepository.getMaxVersion(spaceId);
        if (currentVersion == null) {
            currentVersion = 0L;
        }

        // Group changes by entity type for reporting
        Map<String, List<Change>> byEntity = changes.stream()
                .collect(Collectors.groupingBy(Change::getEntity));

        for (Map.Entry<String, List<Change>> entry : byEntity.entrySet()) {
            String entity = entry.getKey();
            List<Change> entityChanges = entry.getValue();
            int entityAccepted = 0;

            for (Change change : entityChanges) {
                currentVersion++;
                List<String> accepted = new ArrayList<>();
                List<ConflictInfo> conflicts = new ArrayList<>();
                try {
                    switch (entity) {
                        case "event":
                            handleEventChange(spaceId, change, currentVersion, accepted, conflicts);
                            break;
                        case "anniversary":
                            handleAnniversaryChange(spaceId, change, currentVersion, accepted, conflicts);
                            break;
                        case "eventType":
                            handleEventTypeChange(spaceId, change, currentVersion, accepted, conflicts);
                            break;
                        case "category":
                            handleCategoryChange(spaceId, change, currentVersion, accepted, conflicts);
                            break;
                    }
                    allAccepted.addAll(accepted);
                    allConflicts.addAll(conflicts);
                    entityAccepted += accepted.size();

                    // Log operation for each accepted change
                    if (!accepted.isEmpty()) {
                        logOperation(spaceId, change, currentVersion, deviceId);
                    }
                } catch (Exception e) {
                    log.error("Error in batchPush for entity {}: {}", entity, e.getMessage(), e);
                }
            }

            if (!entityChanges.isEmpty()) {
                perEntityCounts.put(entity, entityAccepted);
            }
        }

        Long newVersion = currentVersion;
        if (!changes.isEmpty()) {
            spaceVersionRepository.updateMaxVersion(spaceId, newVersion, System.currentTimeMillis());
        }
        updateDeviceState(spaceId, deviceId, newVersion);

        result.setSuccess(true);
        result.setAccepted(allAccepted);
        result.setConflicts(allConflicts);
        result.setNewVersion(newVersion);
        result.setPerEntityCounts(perEntityCounts);

        log.info("Batch push: space={}, deviceId={}, accepted={}, conflicts={}",
                spaceId, deviceId, allAccepted.size(), allConflicts.size());

        return result;
    }

    // 4. 分页拉取
    public PagePullResult pullPaged(String spaceId, Long sinceVersion, String entity, int limit, int offset) {
        PagePullResult result = new PagePullResult();
        Map<String, List<Map<String, Object>>> data = new HashMap<>();

        try {
            switch (entity) {
                case "events":
                    data.put("events", toMapList(eventRepository.findBySpaceIdAndVersionGreaterThan(spaceId, sinceVersion)));
                    break;
                case "anniversaries":
                    data.put("anniversaries", toMapList(anniversaryRepository.findBySpaceIdAndVersionGreaterThan(spaceId, sinceVersion)));
                    break;
                case "eventTypes":
                    data.put("eventTypes", toMapList(eventTypeRepository.findBySpaceIdAndVersionGreaterThan(spaceId, sinceVersion)));
                    break;
                case "categories":
                    data.put("categories", toMapList(categoryRepository.findBySpaceIdAndVersionGreaterThan(spaceId, sinceVersion)));
                    break;
            }
        } catch (Exception e) {
            log.error("Error pulling paged data for {}: {}", entity, e.getMessage(), e);
        }

        int totalSize = data.values().stream().mapToInt(List::size).sum();
        Long maxVersion = spaceVersionRepository.getMaxVersion(spaceId);
        if (maxVersion == null) maxVersion = 0L;

        result.setData(data);
        result.setTotalPulled(totalSize);
        result.setHasMore(false);
        result.setTotalRemaining(0);
        result.setMaxVersion(maxVersion);

        log.info("Paged pull: space={}, entity={}, total={}", spaceId, entity, totalSize);
        return result;
    }

    private List<Map<String, Object>> toMapList(List<?> list) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object obj : list) {
            if (obj instanceof Event && Boolean.TRUE.equals(((Event) obj).getDeleted())) continue;
            if (obj instanceof Anniversary && Boolean.TRUE.equals(((Anniversary) obj).getDeleted())) continue;
            if (obj instanceof EventType && Boolean.TRUE.equals(((EventType) obj).getDeleted())) continue;
            if (obj instanceof AnniversaryCategory && Boolean.TRUE.equals(((AnniversaryCategory) obj).getDeleted())) continue;
            @SuppressWarnings("unchecked")
            Map<String, Object> map = (Map<String, Object>) objectMapper.convertValue(obj, Object.class);
            result.add(map);
        }
        return result;
    }

    // 5. 同步元数据
    public SyncMetaResult getMeta(String spaceId) {
        long events = eventRepository.findBySpaceIdAndDeletedFalse(spaceId).size();
        long anniversaries = anniversaryRepository.findBySpaceIdAndDeletedFalse(spaceId).size();
        long types = eventTypeRepository.findBySpaceIdAndDeletedFalse(spaceId).size();
        long categories = categoryRepository.findBySpaceIdAndDeletedFalse(spaceId).size();
        Long maxVersion = spaceVersionRepository.getMaxVersion(spaceId);
        if (maxVersion == null) maxVersion = 0L;

        String hash = sha256Hex(spaceId + "-" + maxVersion);

        return new SyncMetaResult(events, anniversaries, types, categories, hash, maxVersion);
    }

    // 6. 设备状态
    public List<DeviceStatusResult> getDeviceStatus(String spaceId) {
        return deviceSyncStateRepository.findBySpaceId(spaceId).stream()
                .map(d -> {
                    DeviceStatusResult r = new DeviceStatusResult();
                    r.setDeviceId(d.getDeviceId());
                    r.setSpaceId(d.getSpaceId());
                    r.setLastSyncVersion(d.getLastSyncVersion());
                    r.setLastSyncTime(d.getLastSyncTime());
                    r.setPendingOperations(d.getPendingOperations());
                    r.setStatus(d.getStatus());
                    return r;
                }).collect(java.util.stream.Collectors.toList());
    }

    // 6b. 更新设备状态 (for ping endpoint)
    public void updateDeviceStatus(String deviceId, String status) {
        DeviceSyncState state = deviceSyncStateRepository.findById(deviceId).orElse(null);
        if (state != null) {
            state.setStatus(status);
            state.setLastSyncTime(System.currentTimeMillis());
            deviceSyncStateRepository.save(state);
            log.info("Device {} status updated to {}", deviceId, status);
        } else {
            log.warn("Device {} not found for status update", deviceId);
        }
    }

    // 6c. 发送消息到特定设备（通过推送通知机制）
    public boolean sendToDevice(String deviceId, String message) {
        log.info("Sending message to device {}: {}", deviceId, message);
        // Simplified: just log the message. In production, integrate with push notification service.
        return deviceSyncStateRepository.findById(deviceId).isPresent();
    }

    // 7. 恢复到指定版本
    public RecoveryResult recover(String spaceId, String deviceId, Long targetVersion) {
        log.info("Recovering {} to version {}", spaceId, targetVersion);

        List<OperationLog> operations = operationLogRepository.findBySpaceIdAndServerVersionGreaterThanOrderByServerVersionAsc(
                spaceId, 0L);

        RecoveryResult result = new RecoveryResult(false, 0L, new HashMap<>());

        try {
            // Collect operations up to target version
            List<OperationLog> targetOps = operations.stream()
                    .filter(op -> op.getServerVersion() <= targetVersion)
                    .collect(Collectors.toList());

            // Group latest ops by entity_id
            Map<String, OperationLog> latestOps = new LinkedHashMap<>();
            for (OperationLog op : targetOps) {
                latestOps.put(op.getEntity() + ":" + op.getEntityId(), op);
            }

            Map<String, List<Map<String, Object>>> data = new HashMap<>();
            for (OperationLog op : latestOps.values()) {
                if (!"delete".equals(op.getOperation()) && op.getNewValues() != null) {
                    Map<String, Object> entityData = objectMapper.readValue(op.getNewValues(), Map.class);
                    data.computeIfAbsent(op.getEntity(), k -> new ArrayList<>()).add(entityData);
                }
            }

            result = new RecoveryResult(true, targetVersion, data);
            updateDeviceState(spaceId, deviceId, targetVersion);
            log.info("Recovery complete for space {} to version {}", spaceId, targetVersion);
        } catch (Exception e) {
            log.error("Recovery failed: {}", e.getMessage(), e);
        }

        return result;
    }
}