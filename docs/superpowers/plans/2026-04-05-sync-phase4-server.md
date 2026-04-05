# Phase 4 服务端同步增强实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在服务端新增 3 张数据库表和 10+ 个新 API 接口,实现完整的操作日志、数据快照和设备同步状态跟踪。

**Architecture:** 在现有 Spring Boot 项目中新增 JPA 实体和 Repository,扩展 SyncController 新增 API 接口,新增 @Scheduled 定时快照任务。

**Tech Stack:** Spring Boot 3.2, JPA, MySQL, Lombok

---

## Task 1: 新增 operation_log 表

**Files:**
- Create: `sync-server/src/main/java/com/record/sync/entity/OperationLog.java`
- Create: `sync-server/src/main/java/com/record/sync/repository/OperationLogRepository.java`
- Modify: `sync-server/src/main/resources/schema.sql` (新增表定义)

### Entity

```java
package com.record.sync.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "operation_log", indexes = {
    @Index(name = "idx_op_space_version", columnList = "space_id, server_version"),
    @Index(name = "idx_op_space_entity", columnList = "space_id, entity, entity_id")
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
    private String changedFields;  // JSON array of field names

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

### Repository

```java
package com.record.sync.repository;

import com.record.sync.entity.OperationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OperationLogRepository extends JpaRepository<OperationLog, String> {
    List<OperationLog> findBySpaceIdAndServerVersionGreaterThanOrderB