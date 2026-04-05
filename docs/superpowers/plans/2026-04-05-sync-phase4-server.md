# Phase 4 服务端同步增强实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 在服务端新增 3 张数据库表和 10+ 个新 API 接口，实现完整的操作日志、数据快照和设备同步状态跟踪。

**Architecture:** 在现有 Spring Boot 项目中新增 JPA 实体和 Repository，扩展 SyncController 新增 API 接口，新增 @Scheduled 定时快照任务，SyncService 中集成日志记录。

**Tech Stack:** Spring Boot 3.2, JPA/Hibernate, MySQL, Lombok

---

## 现有代码结构

### SyncController.java (现有 4 个端点)
- GET /api/sync/pull
- POST /api/sync/push
- GET /api/sync/full
- GET /api/sync/status

### SyncService.java (现有逻辑)
- pull(spaceId, sinceVersion) - 拉取增量
- push(spaceId, deviceId, changes) - 推送变更
- fullSync(spaceId) - 全量同步
- getStatus(spaceId) - 状态查询

### 现有 DTOs
- SyncPullResult, SyncPushRequest, SyncPushResult, SyncFullResult, SyncStatusResult
- Change, ConflictInfo, ApiResponse

### 现有 Entity/Repo
- Event, Anniversary, EventType, AnniversaryCategory (已有 version/deleted)
- Space, Device, SpaceVersion
- 各自 Repository 接口

### schema.sql
- 已有所有表定义 + space_version 表

---

## Task 1: operation_log 表 + 实体 + Repository

**Files:**
- Create: `sync-server/src/main/java/com/record/sync/entity/OperationLog.java`
- Create: `sync-server/src/main/java/com/record/sync/repository/OperationLogRepository.java`
- Modify: `sync-server/src/main/resources/schema.sql`

### 1a: Entity

```java
package com.record.sync.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "operation_log", indexes = {
    @Index(name = "idx_op_space_version", columnList = "space_id, server_version"),
    @Index(name = "idx_op_space_entity_id", columnList = "space_id, entity, entity_id")
})
public class OperationLog {
    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "space_id", length = 64, nullable = false)
    private String spaceId;

    @Column(length = 20, nullable = false)
    private String entity;  // event, anniversary, eventType, category

    @Column(name = "entity_id", length = 64, nullable = false)
    private String entityId;

    @Column(length = 10, nullable = false)
    private String operation;  // create, update, delete

    @Column(name = "changed_fields", columnDefinition = "JSON")
    private String changedFields;  // JSON array

    @Column(name = "new_values", columnDefinition = "JSON")
    private String newValues;  // JSON object

    @Column(name = "client_version")
    private Long clientVersion;

    @Column(name = "server_version")
    private Long serverVersion;

    @Column(name = "device_id", length = 64)
    private String deviceId;

    @Column(name = "created_at")
    private Long createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = System.currentTimeMillis();
    }
}
```

### 1b: Repository

```java
package com.record.sync.repository;

import com.record.sync.entity.OperationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OperationLogRepository extends JpaRepository<OperationLog, String> {

    List<OperationLog> findBySpaceIdAndServerVersionGreaterThanOrderByServerVersionAsc(
            String spaceId, Long serverVersion);

    @Query("SELECT MAX(o.serverVersion) FROM OperationLog o WHERE o.spaceId = :spaceId")
    Optional<Long> findMaxServerVersion(@Param("spaceId") String spaceId);

    @Query("SELECT COUNT(o) FROM OperationLog o WHERE o.spaceId = :spaceId AND o.serverVersion > :sinceVersion")
    long countBySpaceIdAndServerVersionGreaterThan(@Param("spaceId") String spaceId,
                                                    @Param("sinceVersion") Long sinceVersion);
}
```

### 1c: schema.sql 追加

在 `sync-server/src/main/resources/schema.sql` 最后追加:

```sql
-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_log (
    id VARCHAR(64) PRIMARY KEY,
    space_id VARCHAR(64) NOT NULL,
    entity VARCHAR(20) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    changed_fields JSON,
    new_values JSON,
    client_version BIGINT,
    server_version BIGINT,
    device_id VARCHAR(64),
    created_at BIGINT
);
CREATE INDEX idx_op_space_version ON operation_log(space_id, server_version);
CREATE INDEX idx_op_space_entity_id ON operation_log(space_id, entity, entity_id);
```

**Commit:** `feat(server): 新增 operation_log 表和 Repository`

---

## Task 2: data_snapshot 表 + 实体 + Repository

**Files:**
- Create: `sync-server/src/main/java/com/record/sync/entity/DataSnapshot.java`
- Create: `sync-server/src/main/java/com/record/sync/repository/DataSnapshotRepository.java`
- Modify: `sync-server/src/main/resources/schema.sql`

### 2a: Entity

```java
package com.record.sync.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "data_snapshot", indexes = {
    @Index(name = "idx_snap_space_version", columnList = "space_id, version")
})
public class DataSnapshot {
    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "space_id", length = 64, nullable = false)
    private String spaceId;

    @Column(nullable = false)
    private Long version;

    @Column(name = "data_hash", length = 64)
    private String dataHash;

    @Column(name = "snapshot_data", columnDefinition = "MEDIUMTEXT")
    private String snapshotData;  // gzip base64

    @Column(name = "created_at")
    private Long createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = System.currentTimeMillis();
    }
}
```

### 2b: Repository

```java
package com.record.sync.repository;

import com.record.sync.entity.DataSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DataSnapshotRepository extends JpaRepository<DataSnapshot, String> {

    List<DataSnapshot> findBySpaceIdAndVersionGreaterThanOrderByVersionAsc(
            String spaceId, Long version);

    @Modifying
    @Query("DELETE FROM DataSnapshot d WHERE d.spaceId = :spaceId AND d.createdAt < :beforeTimestamp")
    void deleteOlderThan(@Param("spaceId") String spaceId,
                         @Param("beforeTimestamp") Long beforeTimestamp);
}
```

### 2c: schema.sql 追加

```sql
-- 数据快照表
CREATE TABLE IF NOT EXISTS data_snapshot (
    id VARCHAR(64) PRIMARY KEY,
    space_id VARCHAR(64) NOT NULL,
    version BIGINT NOT NULL,
    data_hash VARCHAR(64),
    snapshot_data MEDIUMTEXT,
    created_at BIGINT
);
CREATE INDEX idx_snap_space_version ON data_snapshot(space_id, version);
```

**Commit:** `feat(server): 新增 data_snapshot 表和 Repository`

---

## Task 3: device_sync_state 表 + 实体 + Repository

**Files:**
- Create: `sync-server/src/main/java/com/record/sync/entity/DeviceSyncState.java`
- Create: `sync-server/src/main/java/com/record/sync/repository/DeviceSyncStateRepository.java`
- Modify: `sync-server/src/main/resources/schema.sql`

### 3a: Entity

```java
package com.record.sync.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "device_sync_state")
public class DeviceSyncState {
    @Id
    @Column(name = "device_id", length = 64)
    private String deviceId;

    @Column(name = "space_id", length = 64, nullable = false)
    private String spaceId;

    @Column(name = "last_sync_version")
    private Long lastSyncVersion;

    @Column(name = "last_sync_time")
    private Long lastSyncTime;

    @Column(name = "pending_operations")
    private Integer pendingOperations;

    @Column(length = 20)
    private String status;  // active, inactive, blocked
}
```

### 3b: Repository

```java
package com.record.sync.repository;

import com.record.sync.entity.DeviceSyncState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeviceSyncStateRepository extends JpaRepository<DeviceSyncState, String> {

    List<DeviceSyncState> findBySpaceId(String spaceId);
}
```

### 3c: schema.sql 追加

```sql
-- 设备同步状态表
CREATE TABLE IF NOT EXISTS device_sync_state (
    device_id VARCHAR(64) PRIMARY KEY,
    space_id VARCHAR(64) NOT NULL,
    last_sync_version BIGINT,
    last_sync_time BIGINT,
    pending_operations INT,
    status VARCHAR(20)
);
```

**Commit:** `feat(server): 新增 device_sync_state 表和 Repository`

---

## Task 4: 新增 DTOs

**Files:**
- Create: `sync-server/src/main/java/com/record/sync/dto/SyncHashResult.java`
- Create: `sync-server/src/main/java/com/record/sync/dto/DiffPushRequest.java`
- Create: `sync-server/src/main/java/com/record/sync/dto/BatchPushResult.java`
- Create: `sync-server/src/main/java/com/record/sync/dto/PagePullResult.java`
- Create: `sync-server/src/main/java/com/record/sync/dto/SyncMetaResult.java`
- Create: `sync-server/src/main/java/com/record/sync/dto/DeviceStatusResult.java`
- Create: `sync-server/src/main/java/com/record/sync/dto/RecoveryRequest.java`
- Create: `sync-server/src/main/java/com/record/sync/dto/RecoveryResult.java`

### 4a: SyncHashResult

```java
package com.record.sync.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SyncHashResult {
    private String hash;
    private Long version;
}
```

### 4b: DiffPushRequest

```java
package com.record.sync.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class DiffPushRequest {
    private String spaceId;
    private String deviceId;
    private String entityId;
    private String entity;  // event, anniversary, etc
    private String operation;
    private List<String> changedFields;
    private Map<String, Object> fieldValues;
    private Long clientVersion;
}
```

### 4c: BatchPushResult

```java
package com.record.sync.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class BatchPushResult {
    private boolean success;
    private List<String> accepted;
    private List<ConflictInfo> conflicts;
    private Long newVersion;
    private Map<String, Integer> perEntityCounts;
}
```

### 4d: PagePullResult

```java
package com.record.sync.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class PagePullResult {
    private Map<String, List<Map<String, Object>>> data;  // entity -> list
    private boolean hasMore;
    private int totalPulled;
    private int totalRemaining;
    private Long maxVersion;
}
```

### 4e: SyncMetaResult

```java
package com.record.sync.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SyncMetaResult {
    private Long totalEvents;
    private Long totalAnniversaries;
    private Long totalEventTypes;
    private Long totalCategories;
    private String dataHash;
    private Long maxVersion;
}
```

### 4f: DeviceStatusResult

```java
package com.record.sync.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class DeviceStatusResult {
    private String deviceId;
    private String spaceId;
    private Long lastSyncVersion;
    private Long lastSyncTime;
    private Integer pendingOperations;
    private String status;
}
```

### 4g: RecoveryRequest / RecoveryResult

```java
package com.record.sync.dto;

import lombok.Data;

@Data
public class RecoveryRequest {
    private String spaceId;
    private String deviceId;
    private Long targetVersion;
}
```

```java
package com.record.sync.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.Map;
import java.util.List;

@Data
@AllArgsConstructor
public class RecoveryResult {
    private boolean success;
    private Long restoredVersion;
    private Map<String, List<Map<String, Object>>> data;
}
```

**Commit:** `feat(server): 新增 8 个同步相关 DTO`

---

## Task 5: 扩展 SyncService + SyncController + 定时任务

**Files:**
- Modify: `sync-server/src/main/java/com/record/sync/service/SyncService.java`
- Modify: `sync-server/src/main/java/com/record/sync/controller/SyncController.java`
- Create: `sync-server/src/main/java/com/record/sync/service/SnapshotService.java`

### 5a: SyncService 新增方法

```java
// 在 SyncService 中添加:

@Autowired
private OperationLogRepository operationLogRepository;
@Autowired
private DataSnapshotRepository dataSnapshotRepository;
@Autowired
private DeviceSyncStateRepository deviceSyncStateRepository;

// 1. 获取数据 hash
public SyncHashResult getHash(String spaceId) {
    Long maxVersion = spaceVersionRepository
            .findById(spaceId).map(SpaceVersion::getMaxVersion).orElse(0L);

    String data = eventRepository.findBySpaceIdAndVersionGreaterThan(spaceId, 0)
            .stream().map(e -> e.getId() + ":" + e.getVersion()).reduce("", String::concat);
    String hash = DigestUtils.sha256Hex(data);

    return new SyncHashResult(hash, maxVersion);
}

// 2. 字段级差异推送
public List<String> pushDiff(String spaceId, String deviceId, DiffPushRequest request) {
    // 简化实现: 与现有 push 类似，但只更新指定字段
    List<String> accepted = new ArrayList<>();
    // ... 实现字段级更新逻辑
    return accepted;
}

// 3. 批量并行推送
public BatchPushResult batchPush(String spaceId, String deviceId, List<Change> changes) {
    // 按实体类型分组并行处理
    // ... 类似现有 push 但返回 perEntityCounts
    return result;
}

// 4. 分页拉取
public PagePullResult pullPaged(String spaceId, Long sinceVersion, String entity, int limit, int offset) {
    PagePullResult result = new PagePullResult();
    // ... 查询指定实体类型的分页数据
    return result;
}

// 5. 同步元数据
public SyncMetaResult getMeta(String spaceId) {
    long events = eventRepository.countBySpaceIdAndDeletedFalse(spaceId);
    long anniversaries = anniversaryRepository.countBySpaceIdAndDeletedFalse(spaceId);
    long types = eventTypeRepository.countBySpaceIdAndDeletedFalse(spaceId);
    long categories = categoryRepository.countBySpaceIdAndDeletedFalse(spaceId);
    long maxVersion = spaceVersionRepository.findById(spaceId)
            .map(SpaceVersion::getMaxVersion).orElse(0L);

    // 计算 hash (简化版)
    String hash = DigestUtils.sha256Hex(spaceId + "-" + maxVersion);

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
            }).toList();
}

// 7. 恢复到指定版本
public RecoveryResult recover(String spaceId, String deviceId, Long targetVersion) {
    // 从快照或 operation_log 恢复数据
    // ... 实现恢复逻辑
    return new RecoveryResult(true, targetVersion, new HashMap<>());
}

// 辅助: push 成功后记录 operation_log
private void logOperation(String spaceId, Change change, Long serverVersion) {
    OperationLog log = new OperationLog();
    log.setId(java.util.UUID.randomUUID().toString().replace("-", ""));
    log.setSpaceId(spaceId);
    log.setEntity(change.getEntity());
    log.setEntityId(change.getData().getId());
    log.setOperation(change.getOperation());
    log.setClientVersion(change.getClientVersion());
    log.setServerVersion(serverVersion);
    log.setDeviceId(change.getDeviceId());
    operationLogRepository.save(log);
}
```

### 5b: SyncController 新增端点

```java
// 在 SyncController 中添加:

@GetMapping("/hash")
public ResponseEntity<ApiResponse<SyncHashResult>> getHash(
        @RequestParam String spaceId) {
    try {
        SyncHashResult result = syncService.getHash(spaceId);
        return ResponseEntity.ok(ApiResponse.success(result));
    } catch (Exception e) {
        return ResponseEntity.ok(ApiResponse.error("获取数据 hash 失败"));
    }
}

@PostMapping("/push-diff")
public ResponseEntity<ApiResponse<List<String>>> pushDiff(
        @RequestBody DiffPushRequest request) {
    try {
        List<String> accepted = syncService.pushDiff(
                request.getSpaceId(), request.getDeviceId(), request);
        return ResponseEntity.ok(ApiResponse.success(accepted));
    } catch (Exception e) {
        return ResponseEntity.ok(ApiResponse.error("差异推送失败"));
    }
}

@PostMapping("/batch-push")
public ResponseEntity<ApiResponse<BatchPushResult>> batchPush(
        @RequestBody SyncPushRequest request) {
    try {
        BatchPushResult result = syncService.batchPush(
                request.getSpaceId(), request.getDeviceId(), request.getChanges());
        return ResponseEntity.ok(ApiResponse.success(result));
    } catch (Exception e) {
        return ResponseEntity.ok(ApiResponse.error("批量推送失败"));
    }
}

@GetMapping("/ping")
public ResponseEntity<String> ping(@RequestParam String deviceId) {
    syncService.updateDeviceStatus(deviceId, "active");
    return ResponseEntity.ok("pong");
}

@GetMapping("/device-status")
public ResponseEntity<List<DeviceStatusResult>> deviceStatus(
        @RequestParam String spaceId) {
    List<DeviceStatusResult> result = syncService.getDeviceStatus(spaceId);
    return ResponseEntity.ok(result);
}

@GetMapping("/meta")
public ResponseEntity<ApiResponse<SyncMetaResult>> meta(
        @RequestParam String spaceId) {
    try {
        SyncMetaResult result = syncService.getMeta(spaceId);
        return ResponseEntity.ok(ApiResponse.success(result));
    } catch (Exception e) {
        return ResponseEntity.ok(ApiResponse.error("获取元数据失败: " + e.getMessage()));
    }
}

// 分页拉取 (每个实体类型单独端点)
@GetMapping("/events")
public ResponseEntity<ApiResponse<PagePullResult>> getEvents(
        @RequestParam String spaceId,
        @RequestParam(defaultValue = "0") Long sinceVersion,
        @RequestParam(defaultValue = "100") int limit,
        @RequestParam(defaultValue = "0") int offset) {
    try {
        PagePullResult result = syncService.pullPaged(spaceId, sinceVersion, "events", limit, offset);
        return ResponseEntity.ok(ApiResponse.success(result));
    } catch (Exception e) {
        return ResponseEntity.ok(ApiResponse.error("获取事件失败"));
    }
}

@GetMapping("/anniversaries")
public ResponseEntity<ApiResponse<PagePullResult>> getAnniversaries(
        @RequestParam String spaceId,
        @RequestParam(defaultValue = "0") Long sinceVersion,
        @RequestParam(defaultValue = "100") int limit,
        @RequestParam(defaultValue = "0") int offset) {
    try {
        PagePullResult result = syncService.pullPaged(spaceId, sinceVersion, "anniversaries", limit, offset);
        return ResponseEntity.ok(ApiResponse.success(result));
    } catch (Exception e) {
        return ResponseEntity.ok(ApiResponse.error("获取纪念日失败"));
    }
}

@GetMapping("/event-types")
public ResponseEntity<ApiResponse<PagePullResult>> getEventTypes(
        @RequestParam String spaceId,
        @RequestParam(defaultValue = "0") Long sinceVersion,
        @RequestParam(defaultValue = "100") int limit,
        @RequestParam(defaultValue = "0") int offset) {
    try {
        PagePullResult result = syncService.pullPaged(spaceId, sinceVersion, "eventTypes", limit, offset);
        return ResponseEntity.ok(ApiResponse.success(result));
    } catch (Exception e) {
        return ResponseEntity.ok(ApiResponse.error("获取事件类型失败"));
    }
}

@GetMapping("/categories")
public ResponseEntity<ApiResponse<PagePullResult>> getCategories(
        @RequestParam String spaceId,
        @RequestParam(defaultValue = "0") Long sinceVersion,
        @RequestParam(defaultValue = "100") int limit,
        @RequestParam(defaultValue = "0") int offset) {
    try {
        PagePullResult result = syncService.pullPaged(spaceId, sinceVersion, "categories", limit, offset);
        return ResponseEntity.ok(ApiResponse.success(result));
    } catch (Exception e) {
        return ResponseEntity.ok(ApiResponse.error("获取分类失败"));
    }
}
```

### 5c: SnapshotService 定时任务

```java
package com.record.sync.sync.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.record.sync.entity.DataSnapshot;
import com.record.sync.entity.Event;
import com.record.sync.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;