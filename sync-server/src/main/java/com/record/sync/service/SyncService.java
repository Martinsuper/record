package com.record.sync.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.record.sync.dto.*;
import com.record.sync.entity.*;
import com.record.sync.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

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
}