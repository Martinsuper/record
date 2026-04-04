# HTTP REST 多用户数据同步方案实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 WebSocket 同步方案替换为 HTTP REST + 定时轮询方案，支持本地/同步双模式切换。

**Architecture:** 服务端新增 SyncService/SyncController 处理增量同步请求，数据库新增 version/deleted 字段和 space_version 表；客户端重写 syncManager 为 HTTP REST 调用 + pendingChanges 队列。

**Tech Stack:** Spring Boot, JPA, MySQL, TypeScript, uni-app

---

## 文件结构

### 服务端新增/修改

| 文件 | 操作 | 说明 |
|------|------|------|
| `sync-server/src/main/resources/schema.sql` | 修改 | 新增 version/deleted 字段和索引 |
| `sync-server/src/main/java/com/record/sync/entity/Event.java` | 修改 | 新增 version, deleted 字段 |
| `sync-server/src/main/java/com/record/sync/entity/Anniversary.java` | 修改 | 新增 version, deleted 字段 |
| `sync-server/src/main/java/com/record/sync/entity/EventType.java` | 修改 | 新增 version, deleted 字段 |
| `sync-server/src/main/java/com/record/sync/entity/AnniversaryCategory.java` | 修改 | 新增 version, deleted 字段 |
| `sync-server/src/main/java/com/record/sync/entity/SpaceVersion.java` | 创建 | 空间版本追踪实体 |
| `sync-server/src/main/java/com/record/sync/repository/SpaceVersionRepository.java` | 创建 | 空间版本 Repository |
| `sync-server/src/main/java/com/record/sync/repository/EventRepository.java` | 修改 | 新增版本查询方法 |
| `sync-server/src/main/java/com/record/sync/repository/AnniversaryRepository.java` | 修改 | 新增版本查询方法 |
| `sync-server/src/main/java/com/record/sync/repository/EventTypeRepository.java` | 修改 | 新增版本查询方法 |
| `sync-server/src/main/java/com/record/sync/repository/AnniversaryCategoryRepository.java` | 修改 | 新增版本查询方法 |
| `sync-server/src/main/java/com/record/sync/dto/SyncPullResult.java` | 创建 | 拉取响应 DTO |
| `sync-server/src/main/java/com/record/sync/dto/SyncPushRequest.java` | 创建 | 推送请求 DTO |
| `sync-server/src/main/java/com/record/sync/dto/SyncPushResult.java` | 创建 | 推送响应 DTO |
| `sync-server/src/main/java/com/record/sync/dto/SyncFullResult.java` | 创建 | 全量同步响应 DTO |
| `sync-server/src/main/java/com/record/sync/dto/SyncStatusResult.java` | 创建 | 同步状态响应 DTO |
| `sync-server/src/main/java/com/record/sync/dto/Change.java` | 创建 | 变更记录 DTO |
| `sync-server/src/main/java/com/record/sync/dto/ConflictInfo.java` | 创建 | 冲突信息 DTO |
| `sync-server/src/main/java/com/record/sync/service/SyncService.java` | 创建 | 核心同步服务 |
| `sync-server/src/main/java/com/record/sync/controller/SyncController.java` | 创建 | 同步 API 控制器 |
| `sync-server/src/main/java/com/record/sync/service/DataCleanupService.java` | 创建 | 定时清理服务 |

### 客户端新增/修改

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/utils/storage.ts` | 修改 | 新增存储键和类型定义 |
| `src/utils/pendingChanges.ts` | 创建 | 待推送变更队列管理 |
| `src/utils/syncManager.ts` | 重写 | HTTP REST + 定时轮询实现 |

---

## Phase 1: 数据库 Schema 改动

### Task 1: 更新数据库 Schema

**Files:**
- Modify: `sync-server/src/main/resources/schema.sql`

- [ ] **Step 1: 添加 version 和 deleted 字段到所有实体表**

修改 `sync-server/src/main/resources/schema.sql`，在 event、anniversary、event_type、anniversary_category 表中新增字段：

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS sync_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE sync_db;

-- 空间表
CREATE TABLE IF NOT EXISTS space (
    id VARCHAR(64) PRIMARY KEY,
    share_code VARCHAR(6) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 空间版本追踪表（新增）
CREATE TABLE IF NOT EXISTS space_version (
    space_id VARCHAR(64) PRIMARY KEY,
    max_version BIGINT DEFAULT 0,
    updated_at BIGINT,
    FOREIGN KEY (space_id) REFERENCES space(id) ON DELETE CASCADE
);

-- 设备表
CREATE TABLE IF NOT EXISTS device (
    id VARCHAR(64) PRIMARY KEY,
    space_id VARCHAR(64) NOT NULL,
    device_name VARCHAR(50),
    last_connected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (space_id) REFERENCES space(id) ON DELETE CASCADE,
    INDEX idx_space_id (space_id)
);

-- 事件表（修改：新增 version, deleted, 索引）
CREATE TABLE IF NOT EXISTS event (
    id VARCHAR(64) PRIMARY KEY,
    space_id VARCHAR(64) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type_id VARCHAR(64),
    time BIGINT NOT NULL,
    version BIGINT DEFAULT 1,
    deleted BOOLEAN DEFAULT FALSE,
    created_at BIGINT,
    updated_at BIGINT,
    FOREIGN KEY (space_id) REFERENCES space(id) ON DELETE CASCADE,
    INDEX idx_space_id (space_id),
    INDEX idx_space_version (space_id, version)
);

-- 纪念日表（修改：新增 version, deleted, 索引）
CREATE TABLE IF NOT EXISTS anniversary (
    id VARCHAR(64) PRIMARY KEY,
    space_id VARCHAR(64) NOT NULL,
    name VARCHAR(100) NOT NULL,
    date BIGINT NOT NULL,
    repeat_type VARCHAR(10),
    mode VARCHAR(10),
    category_id VARCHAR(64),
    sort_order INT DEFAULT 0,
    version BIGINT DEFAULT 1,
    deleted BOOLEAN DEFAULT FALSE,
    created_at BIGINT,
    updated_at BIGINT,
    FOREIGN KEY (space_id) REFERENCES space(id) ON DELETE CASCADE,
    INDEX idx_space_id (space_id),
    INDEX idx_space_version (space_id, version)
);

-- 事件类型表（修改：新增 version, deleted, 索引）
CREATE TABLE IF NOT EXISTS event_type (
    id VARCHAR(64) PRIMARY KEY,
    space_id VARCHAR(64) NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(10),
    icon VARCHAR(50),
    version BIGINT DEFAULT 1,
    deleted BOOLEAN DEFAULT FALSE,
    created_at BIGINT,
    FOREIGN KEY (space_id) REFERENCES space(id) ON DELETE CASCADE,
    INDEX idx_space_id (space_id),
    INDEX idx_space_version (space_id, version)
);

-- 纪念日分类表（修改：新增 version, deleted, 索引）
CREATE TABLE IF NOT EXISTS anniversary_category (
    id VARCHAR(64) PRIMARY KEY,
    space_id VARCHAR(64) NOT NULL,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(50),
    is_preset BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    version BIGINT DEFAULT 1,
    deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (space_id) REFERENCES space(id) ON DELETE CASCADE,
    INDEX idx_space_id (space_id),
    INDEX idx_space_version (space_id, version)
);
```

- [ ] **Step 2: 提交 Schema 改动**

```bash
git add sync-server/src/main/resources/schema.sql
git commit -m "feat(db): 新增 version/deleted 字段和 space_version 表"
```

---

## Phase 2: 实体类改动

### Task 2: 修改 Event 实体

**Files:**
- Modify: `sync-server/src/main/java/com/record/sync/entity/Event.java`

- [ ] **Step 1: 添加 version 和 deleted 字段**

```java
package com.record.sync.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;

@Data
@ToString(exclude = {"space"})
@Entity
@Table(name = "event")
public class Event {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "space_id", length = 64, nullable = false)
    private String spaceId;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(name = "type_id", length = 64)
    private String typeId;

    @Column(nullable = false)
    private Long time;

    @Column(nullable = false)
    private Long version = 1L;  // 新增：版本号

    @Column(nullable = false)
    private Boolean deleted = false;  // 新增：软删除标记

    @Column(name = "created_at")
    private Long createdAt;

    @Column(name = "updated_at")
    private Long updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", insertable = false, updatable = false)
    private Space space;
}
```

- [ ] **Step 2: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/entity/Event.java
git commit -m "feat(entity): Event 新增 version 和 deleted 字段"
```

### Task 3: 修改 Anniversary 实体

**Files:**
- Modify: `sync-server/src/main/java/com/record/sync/entity/Anniversary.java`

- [ ] **Step 1: 添加 version 和 deleted 字段**

```java
package com.record.sync.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;

@Data
@ToString(exclude = {"space"})
@Entity
@Table(name = "anniversary")
public class Anniversary {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "space_id", length = 64, nullable = false)
    private String spaceId;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(nullable = false)
    private Long date;

    @Column(name = "repeat_type", length = 10)
    private String repeatType;

    @Column(length = 10)
    private String mode;

    @Column(name = "category_id", length = 64)
    private String categoryId;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(nullable = false)
    private Long version = 1L;  // 新增：版本号

    @Column(nullable = false)
    private Boolean deleted = false;  // 新增：软删除标记

    @Column(name = "created_at")
    private Long createdAt;

    @Column(name = "updated_at")
    private Long updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", insertable = false, updatable = false)
    private Space space;
}
```

- [ ] **Step 2: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/entity/Anniversary.java
git commit -m "feat(entity): Anniversary 新增 version 和 deleted 字段"
```

### Task 4: 修改 EventType 实体

**Files:**
- Modify: `sync-server/src/main/java/com/record/sync/entity/EventType.java`

- [ ] **Step 1: 添加 version 和 deleted 字段**

```java
package com.record.sync.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;

@Data
@ToString(exclude = {"space"})
@Entity
@Table(name = "event_type")
public class EventType {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "space_id", length = 64, nullable = false)
    private String spaceId;

    @Column(length = 50, nullable = false)
    private String name;

    @Column(length = 10)
    private String color;

    @Column(length = 50)
    private String icon;

    @Column(nullable = false)
    private Long version = 1L;  // 新增：版本号

    @Column(nullable = false)
    private Boolean deleted = false;  // 新增：软删除标记

    @Column(name = "created_at")
    private Long createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", insertable = false, updatable = false)
    private Space space;
}
```

- [ ] **Step 2: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/entity/EventType.java
git commit -m "feat(entity): EventType 新增 version 和 deleted 字段"
```

### Task 5: 修改 AnniversaryCategory 实体

**Files:**
- Modify: `sync-server/src/main/java/com/record/sync/entity/AnniversaryCategory.java`

- [ ] **Step 1: 添加 version 和 deleted 字段**

```java
package com.record.sync.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;

@Data
@ToString(exclude = {"space"})
@Entity
@Table(name = "anniversary_category")
public class AnniversaryCategory {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "space_id", length = 64, nullable = false)
    private String spaceId;

    @Column(length = 50, nullable = false)
    private String name;

    @Column(length = 50)
    private String icon;

    @Column(name = "is_preset")
    private Boolean isPreset = false;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(nullable = false)
    private Long version = 1L;  // 新增：版本号

    @Column(nullable = false)
    private Boolean deleted = false;  // 新增：软删除标记

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", insertable = false, updatable = false)
    private Space space;
}
```

- [ ] **Step 2: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/entity/AnniversaryCategory.java
git commit -m "feat(entity): AnniversaryCategory 新增 version 和 deleted 字段"
```

### Task 6: 创建 SpaceVersion 实体

**Files:**
- Create: `sync-server/src/main/java/com/record/sync/entity/SpaceVersion.java`

- [ ] **Step 1: 创建 SpaceVersion 实体类**

```java
package com.record.sync.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "space_version")
public class SpaceVersion {

    @Id
    @Column(name = "space_id", length = 64)
    private String spaceId;

    @Column(name = "max_version", nullable = false)
    private Long maxVersion = 0L;

    @Column(name = "updated_at")
    private Long updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", insertable = false, updatable = false)
    private Space space;
}
```

- [ ] **Step 2: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/entity/SpaceVersion.java
git commit -m "feat(entity): 创建 SpaceVersion 空间版本追踪实体"
```

---

## Phase 3: Repository 改动

### Task 7: 创建 SpaceVersionRepository

**Files:**
- Create: `sync-server/src/main/java/com/record/sync/repository/SpaceVersionRepository.java`

- [ ] **Step 1: 创建 SpaceVersionRepository**

```java
package com.record.sync.repository;

import com.record.sync.entity.SpaceVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface SpaceVersionRepository extends JpaRepository<SpaceVersion, String> {

    @Query("SELECT sv.maxVersion FROM SpaceVersion sv WHERE sv.spaceId = :spaceId")
    Long getMaxVersion(String spaceId);

    @Modifying
    @Query("UPDATE SpaceVersion sv SET sv.maxVersion = :version, sv.updatedAt = :updatedAt WHERE sv.spaceId = :spaceId")
    void updateMaxVersion(String spaceId, Long version, Long updatedAt);

    @Modifying
    @Query("INSERT INTO SpaceVersion (spaceId, maxVersion, updatedAt) VALUES (:spaceId, 0, :updatedAt) ON DUPLICATE KEY UPDATE updatedAt = :updatedAt")
    void initSpaceVersion(String spaceId, Long updatedAt);
}
```

- [ ] **Step 2: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/repository/SpaceVersionRepository.java
git commit -m "feat(repo): 创建 SpaceVersionRepository"
```

### Task 8: 修改 EventRepository

**Files:**
- Modify: `sync-server/src/main/java/com/record/sync/repository/EventRepository.java`

- [ ] **Step 1: 新增版本查询方法**

```java
package com.record.sync.repository;

import com.record.sync.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, String> {

    List<Event> findBySpaceId(String spaceId);

    Optional<Event> findByIdAndSpaceId(String id, String spaceId);

    void deleteByIdAndSpaceId(String id, String spaceId);

    // 新增：查询版本大于指定值的数据（增量同步）
    List<Event> findBySpaceIdAndVersionGreaterThan(String spaceId, Long version);

    // 新增：查询未删除的数据（全量同步）
    List<Event> findBySpaceIdAndDeletedFalse(String spaceId);

    // 新增：物理删除超过指定时间的软删除数据
    @Modifying
    @Query("DELETE FROM Event e WHERE e.deleted = true AND e.updatedAt < :threshold")
    void deleteByDeletedTrueAndUpdatedAtBefore(Long threshold);
}
```

- [ ] **Step 2: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/repository/EventRepository.java
git commit -m "feat(repo): EventRepository 新增版本查询方法"
```

### Task 9: 修改 AnniversaryRepository

**Files:**
- Modify: `sync-server/src/main/java/com/record/sync/repository/AnniversaryRepository.java`

- [ ] **Step 1: 新增版本查询方法**

```java
package com.record.sync.repository;

import com.record.sync.entity.Anniversary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnniversaryRepository extends JpaRepository<Anniversary, String> {

    List<Anniversary> findBySpaceId(String spaceId);

    Optional<Anniversary> findByIdAndSpaceId(String id, String spaceId);

    void deleteByIdAndSpaceId(String id, String spaceId);

    // 新增：查询版本大于指定值的数据
    List<Anniversary> findBySpaceIdAndVersionGreaterThan(String spaceId, Long version);

    // 新增：查询未删除的数据
    List<Anniversary> findBySpaceIdAndDeletedFalse(String spaceId);

    // 新增：物理删除软删除数据
    @Modifying
    @Query("DELETE FROM Anniversary a WHERE a.deleted = true AND a.updatedAt < :threshold")
    void deleteByDeletedTrueAndUpdatedAtBefore(Long threshold);
}
```

- [ ] **Step 2: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/repository/AnniversaryRepository.java
git commit -m "feat(repo): AnniversaryRepository 新增版本查询方法"
```

### Task 10: 修改 EventTypeRepository

**Files:**
- Modify: `sync-server/src/main/java/com/record/sync/repository/EventTypeRepository.java`

- [ ] **Step 1: 新增版本查询方法**

```java
package com.record.sync.repository;

import com.record.sync.entity.EventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventTypeRepository extends JpaRepository<EventType, String> {

    List<EventType> findBySpaceId(String spaceId);

    Optional<EventType> findByIdAndSpaceId(String id, String spaceId);

    void deleteByIdAndSpaceId(String id, String spaceId);

    // 新增：查询版本大于指定值的数据
    List<EventType> findBySpaceIdAndVersionGreaterThan(String spaceId, Long version);

    // 新增：查询未删除的数据
    List<EventType> findBySpaceIdAndDeletedFalse(String spaceId);

    // 新增：物理删除软删除数据
    @Modifying
    @Query("DELETE FROM EventType et WHERE et.deleted = true AND et.createdAt < :threshold")
    void deleteByDeletedTrueAndCreatedAtBefore(Long threshold);
}
```

- [ ] **Step 2: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/repository/EventTypeRepository.java
git commit -m "feat(repo): EventTypeRepository 新增版本查询方法"
```

### Task 11: 修改 AnniversaryCategoryRepository

**Files:**
- Modify: `sync-server/src/main/java/com/record/sync/repository/AnniversaryCategoryRepository.java`

- [ ] **Step 1: 新增版本查询方法**

```java
package com.record.sync.repository;

import com.record.sync.entity.AnniversaryCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnniversaryCategoryRepository extends JpaRepository<AnniversaryCategory, String> {

    List<AnniversaryCategory> findBySpaceId(String spaceId);

    Optional<AnniversaryCategory> findByIdAndSpaceId(String id, String spaceId);

    void deleteByIdAndSpaceId(String id, String spaceId);

    // 新增：查询版本大于指定值的数据
    List<AnniversaryCategory> findBySpaceIdAndVersionGreaterThan(String spaceId, Long version);

    // 新增：查询未删除的数据
    List<AnniversaryCategory> findBySpaceIdAndDeletedFalse(String spaceId);

    // 新增：物理删除软删除数据
    @Modifying
    @Query("DELETE FROM AnniversaryCategory ac WHERE ac.deleted = true")
    void deleteByDeletedTrue();
}
```

- [ ] **Step 2: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/repository/AnniversaryCategoryRepository.java
git commit -m "feat(repo): AnniversaryCategoryRepository 新增版本查询方法"
```

---

## Phase 4: DTO 创建

### Task 12: 创建 Change DTO

**Files:**
- Create: `sync-server/src/main/java/com/record/sync/dto/Change.java`

- [ ] **Step 1: 创建 Change 类**

```java
package com.record.sync.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 变更记录 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Change {

    private String entity;      // event, anniversary, eventType, category
    private String operation;   // create, update, delete
    private Object data;        // 变更数据
    private Long clientVersion; // 客户端本地版本（用于冲突检测）
}
```

- [ ] **Step 2: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/dto/Change.java
git commit -m "feat(dto): 创建 Change 变更记录 DTO"
```

### Task 13: 创建 ConflictInfo DTO

**Files:**
- Create: `sync-server/src/main/java/com/record/sync/dto/ConflictInfo.java`

- [ ] **Step 1: 创建 ConflictInfo 类**

```java
package com.record.sync.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 冲突信息 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConflictInfo {

    private String id;          // 冲突数据 ID
    private String reason;      // 冲突原因：server_win, deleted, conflict
    private Object serverData;  // 服务器当前数据（用于客户端恢复）
}
```

- [ ] **Step 2: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/dto/ConflictInfo.java
git commit -m "feat(dto): 创建 ConflictInfo 冲突信息 DTO"
```

### Task 14: 创建 SyncPullResult DTO

**Files:**
- Create: `sync-server/src/main/java/com/record/sync/dto/SyncPullResult.java`

- [ ] **Step 1: 创建 SyncPullResult 类**

```java
package com.record.sync.dto;

import com.record.sync.entity.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

/**
 * 拉取同步响应 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyncPullResult {

    private List<Event> events;
    private List<Anniversary> anniversaries;
    private List<EventType> eventTypes;
    private List<AnniversaryCategory> categories;
    private Long maxVersion;    // 本次返回的最大版本号
    private Boolean hasMore;    // 是否还有更多变更
}
```

- [ ] **Step 2: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/dto/SyncPullResult.java
git commit -m "feat(dto): 创建 SyncPullResult 拉取响应 DTO"
```

### Task 15: 创建 SyncPushRequest DTO

**Files:**
- Create: `sync-server/src/main/java/com/record/sync/dto/SyncPushRequest.java`

- [ ] **Step 1: 创建 SyncPushRequest 类**

```java
package com.record.sync.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

/**
 * 推送同步请求 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyncPushRequest {

    private String spaceId;
    private String deviceId;
    private List<Change> changes;
}
```

- [ ] **Step 2: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/dto/SyncPushRequest.java
git commit -m "feat(dto): 创建 SyncPushRequest 推送请求 DTO"
```

### Task 16: 创建 SyncPushResult DTO

**Files:**
- Create: `sync-server/src/main/java/com/record/sync/dto/SyncPushResult.java`

- [ ] **Step 1: 创建 SyncPushResult 类**

```java
package com.record.sync.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

/**
 * 推送同步响应 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyncPushResult {

    private List<String> accepted;     // 成功接受的变更 ID
    private List<ConflictInfo> conflicts;  // 冲突列表
    private Long newVersion;           // 推送后的新版本号
}
```

- [ ] **Step 2: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/dto/SyncPushResult.java
git commit -m "feat(dto): 创建 SyncPushResult 推送响应 DTO"
```

### Task 17: 创建 SyncFullResult DTO

**Files:**
- Create: `sync-server/src/main/java/com/record/sync/dto/SyncFullResult.java`

- [ ] **Step 1: 创建 SyncFullResult 类**

```java
package com.record.sync.dto;

import com.record.sync.entity.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

/**
 * 全量同步响应 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyncFullResult {

    private List<Event> events;
    private List<Anniversary> anniversaries;
    private List<EventType> eventTypes;
    private List<AnniversaryCategory> categories;
    private Long maxVersion;
}
```

- [ ] **Step 2: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/dto/SyncFullResult.java
git commit -m "feat(dto): 创建 SyncFullResult 全量同步响应 DTO"
```

### Task 18: 创建 SyncStatusResult DTO

**Files:**
- Create: `sync-server/src/main/java/com/record/sync/dto/SyncStatusResult.java`

- [ ] **Step 1: 创建 SyncStatusResult 类**

```java
package com.record.sync.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 同步状态响应 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyncStatusResult {

    private Long maxVersion;
    private Integer eventCount;
    private Integer anniversaryCount;
    private Integer eventTypeCount;
    private Integer categoryCount;
    private Long lastUpdatedAt;
}
```

- [ ] **Step 2: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/dto/SyncStatusResult.java
git commit -m "feat(dto): 创建 SyncStatusResult 同步状态响应 DTO"
```

---

## Phase 5: 核心同步服务

### Task 19: 创建 SyncService

**Files:**
- Create: `sync-server/src/main/java/com/record/sync/service/SyncService.java`

- [ ] **Step 1: 创建 SyncService 类**

```java
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

    /**
     * 拉取增量变更
     */
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

    /**
     * 推送变更
     */
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
            if (eventRepository.existsById(data.getId())) {
                String newId = generateNewId();
                data.setId(newId);
            }
            data.setCreatedAt(System.currentTimeMillis());
            data.setDeleted(false);
            eventRepository.save(data);
            accepted.add(data.getId());
            log.debug("Created event: {}", data.getId());

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
            if (anniversaryRepository.existsById(data.getId())) {
                String newId = generateNewId();
                data.setId(newId);
            }
            data.setCreatedAt(System.currentTimeMillis());
            data.setDeleted(false);
            anniversaryRepository.save(data);
            accepted.add(data.getId());

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
            if (eventTypeRepository.existsById(data.getId())) {
                String newId = generateNewId();
                data.setId(newId);
            }
            data.setCreatedAt(System.currentTimeMillis());
            data.setDeleted(false);
            eventTypeRepository.save(data);
            accepted.add(data.getId());

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
            if (categoryRepository.existsById(data.getId())) {
                String newId = generateNewId();
                data.setId(newId);
            }
            data.setDeleted(false);
            categoryRepository.save(data);
            accepted.add(data.getId());

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

    /**
     * 全量同步
     */
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

    /**
     * 获取同步状态
     */
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

    private String generateNewId() {
        return java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }
}
```

- [ ] **Step 2: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/service/SyncService.java
git commit -m "feat(service): 创建 SyncService 核心同步服务"
```

### Task 20: 创建 SyncController

**Files:**
- Create: `sync-server/src/main/java/com/record/sync/controller/SyncController.java`

- [ ] **Step 1: 创建 SyncController 类**

```java
package com.record.sync.controller;

import com.record.sync.dto.*;
import com.record.sync.service.SyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;

    /**
     * 拉取增量变更
     */
    @GetMapping("/pull")
    public ResponseEntity<ApiResponse<SyncPullResult>> pull(
            @RequestParam String spaceId,
            @RequestParam(defaultValue = "0") Long sinceVersion) {

        try {
            SyncPullResult result = syncService.pull(spaceId, sinceVersion);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Pull sync error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("拉取同步失败: " + e.getMessage()));
        }
    }

    /**
     * 推送变更
     */
    @PostMapping("/push")
    public ResponseEntity<ApiResponse<SyncPushResult>> push(
            @RequestBody SyncPushRequest request) {

        try {
            SyncPushResult result = syncService.push(
                    request.getSpaceId(),
                    request.getDeviceId(),
                    request.getChanges());
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Push sync error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("推送同步失败: " + e.getMessage()));
        }
    }

    /**
     * 全量同步
     */
    @GetMapping("/full")
    public ResponseEntity<ApiResponse<SyncFullResult>> fullSync(
            @RequestParam String spaceId) {

        try {
            SyncFullResult result = syncService.fullSync(spaceId);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Full sync error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("全量同步失败: " + e.getMessage()));
        }
    }

    /**
     * 同步状态
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<SyncStatusResult>> status(
            @RequestParam String spaceId) {

        try {
            SyncStatusResult result = syncService.getStatus(spaceId);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Get sync status error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("获取状态失败: " + e.getMessage()));
        }
    }
}
```

- [ ] **Step 2: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/controller/SyncController.java
git commit -m "feat(controller): 创建 SyncController 同步 API 控制器"
```

### Task 21: 创建 DataCleanupService

**Files:**
- Create: `sync-server/src/main/java/com/record/sync/service/DataCleanupService.java`

- [ ] **Step 1: 创建 DataCleanupService 类**

```java
package com.record.sync.service;

import com.record.sync.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataCleanupService {

    private final EventRepository eventRepository;
    private final AnniversaryRepository anniversaryRepository;
    private final EventTypeRepository eventTypeRepository;
    private final AnniversaryCategoryRepository categoryRepository;

    /**
     * 清理超过 30 天的软删除数据
     * 每天凌晨 3 点执行
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupSoftDeletedData() {
        log.info("Starting soft deleted data cleanup...");

        // 30 天前的时间戳
        long threshold = System.currentTimeMillis() - 30L * 24 * 60 * 60 * 1000;

        try {
            eventRepository.deleteByDeletedTrueAndUpdatedAtBefore(threshold);
            anniversaryRepository.deleteByDeletedTrueAndUpdatedAtBefore(threshold);
            eventTypeRepository.deleteByDeletedTrueAndCreatedAtBefore(threshold);
            categoryRepository.deleteByDeletedTrue();

            log.info("Soft deleted data cleanup completed");
        } catch (Exception e) {
            log.error("Cleanup error: {}", e.getMessage(), e);
        }
    }
}
```

- [ ] **Step 2: 启用定时任务**

修改 `sync-server/src/main/java/com/record/sync/SyncServerApplication.java`，添加 `@EnableScheduling`：

```java
package com.record.sync;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling  // 新增：启用定时任务
public class SyncServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(SyncServerApplication.class, args);
    }
}
```

- [ ] **Step 3: 提交改动**

```bash
git add sync-server/src/main/java/com/record/sync/service/DataCleanupService.java
git add sync-server/src/main/java/com/record/sync/SyncServerApplication.java
git commit -m "feat(service): 创建 DataCleanupService 定时清理软删除数据"
```

---

## Phase 6: 客户端存储改动

### Task 22: 修改客户端 storage.ts

**Files:**
- Modify: `src/utils/storage.ts`

- [ ] **Step 1: 新增存储键和类型定义**

修改 `src/utils/storage.ts`，添加新的存储键：

```typescript
/**
 * 本地存储封装工具
 * 基于 uni.storage API
 */

export const STORAGE_KEYS = {
  EVENTS: 'events',
  EVENT_TYPES: 'eventTypes',
  ANNIVERSARIES: 'anniversaries',
  ANNIVERSARY_CATEGORIES: 'anniversaryCategories',
  // 同步相关
  SYNC_SHARE_CODE: 'syncShareCode',
  SYNC_SPACE_ID: 'syncSpaceId',
  SYNC_DEVICE_ID: 'syncDeviceId',
  SYNC_ENABLED: 'syncEnabled',           // 新增：同步开关
  SYNC_LAST_VERSION: 'syncLastVersion',  // 新增：上次同步版本号
  SYNC_LAST_SYNC_TIME: 'syncLastSyncTime',
  PENDING_CHANGES: 'pendingChanges'      // 新增：待推送变更队列
} as const

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]

/**
 * 获取存储数据
 */
export function getStorage<T = unknown>(key: string): T | null {
  try {
    const value = uni.getStorageSync(key)
    return (value as T) || null
  } catch (e) {
    console.error('getStorage error:', e)
    return null
  }
}

/**
 * 设置存储数据
 */
export function setStorage<T = unknown>(key: string, value: T): void {
  try {
    uni.setStorageSync(key, value)
  } catch (e) {
    console.error('setStorage error:', e)
  }
}

/**
 * 删除存储数据
 */
export function removeStorage(key: string): void {
  try {
    uni.removeStorageSync(key)
  } catch (e) {
    console.error('removeStorage error:', e)
  }
}

/**
 * 清除所有存储数据
 */
export function clearAllStorage(): void {
  try {
    uni.clearStorageSync()
  } catch (e) {
    console.error('clearAllStorage error:', e)
  }
}

// 事件类型定义（新增 version, deleted）
export interface TimelineEvent {
  id: string
  name: string
  description?: string
  time: string
  typeId?: string
  version: number       // 新增
  deleted: boolean      // 新增
  createdAt: string
  updatedAt: string
}

export interface EventType {
  id: string
  name: string
  color: string
  icon?: string
  version: number       // 新增
  deleted: boolean      // 新增
  createdAt?: number
}

// 纪念日类型定义（新增 version, deleted）
export interface AnniversaryData {
  id: string
  name: string
  date: number
  repeatType: 'none' | 'year' | 'month' | 'week' | 'day'
  mode: 'countdown' | 'elapsed'
  categoryId: string
  sortOrder: number
  version: number       // 新增
  deleted: boolean      // 新增
  createdAt: number
  updatedAt: number
}

// 纪念日分类类型定义（新增 version, deleted）
export interface AnniversaryCategory {
  id: string
  name: string
  icon: string
  isPreset: boolean
  sortOrder: number
  version: number       // 新增
  deleted: boolean      // 新增
}

/**
 * 获取事件列表
 */
export function getEvents(): TimelineEvent[] {
  return getStorage<TimelineEvent[]>(STORAGE_KEYS.EVENTS) || []
}

/**
 * 保存事件列表
 */
export function saveEvents(events: TimelineEvent[]): void {
  setStorage(STORAGE_KEYS.EVENTS, events)
}

/**
 * 获取事件类型列表
 */
export function getEventTypes(): EventType[] {
  return getStorage<EventType[]>(STORAGE_KEYS.EVENT_TYPES) || []
}

/**
 * 保存事件类型列表
 */
export function saveEventTypes(types: EventType[]): void {
  setStorage(STORAGE_KEYS.EVENT_TYPES, types)
}

/**
 * 获取纪念日列表
 */
export function getAnniversaries(): AnniversaryData[] {
  return getStorage<AnniversaryData[]>(STORAGE_KEYS.ANNIVERSARIES) || []
}

/**
 * 保存纪念日列表
 */
export function saveAnniversaries(anniversaries: AnniversaryData[]): void {
  setStorage(STORAGE_KEYS.ANNIVERSARIES, anniversaries)
}

/**
 * 获取纪念日分类列表
 */
export function getAnniversaryCategories(): AnniversaryCategory[] {
  return getStorage<AnniversaryCategory[]>(STORAGE_KEYS.ANNIVERSARY_CATEGORIES) || []
}

/**
 * 保存纪念日分类列表
 */
export function saveAnniversaryCategories(categories: AnniversaryCategory[]): void {
  setStorage(STORAGE_KEYS.ANNIVERSARY_CATEGORIES, categories)
}

// 新增：同步状态类型
export interface SyncState {
  lastSyncVersion: number
  lastSyncTime: number
  syncEnabled: boolean
}

/**
 * 获取同步状态
 */
export function getSyncState(): SyncState {
  return {
    lastSyncVersion: getStorage<number>(STORAGE_KEYS.SYNC_LAST_VERSION) || 0,
    lastSyncTime: getStorage<number>(STORAGE_KEYS.SYNC_LAST_SYNC_TIME) || 0,
    syncEnabled: getStorage<boolean>(STORAGE_KEYS.SYNC_ENABLED) || false
  }
}

/**
 * 保存同步状态
 */
export function saveSyncState(state: SyncState): void {
  setStorage(STORAGE_KEYS.SYNC_LAST_VERSION, state.lastSyncVersion)
  setStorage(STORAGE_KEYS.SYNC_LAST_SYNC_TIME, state.lastSyncTime)
  setStorage(STORAGE_KEYS.SYNC_ENABLED, state.syncEnabled)
}
```

- [ ] **Step 2: 提交改动**

```bash
git add src/utils/storage.ts
git commit -m "feat(client): storage 新增 version/deleted 字段和同步状态存储"
```

---

## Phase 7: 待推送变更队列

### Task 23: 创建 pendingChanges.ts

**Files:**
- Create: `src/utils/pendingChanges.ts`

- [ ] **Step 1: 创建 pendingChanges 队列管理**

```typescript
import { getStorage, setStorage, STORAGE_KEYS } from './storage'

// 变更记录类型
export interface PendingChange {
  entity: 'event' | 'anniversary' | 'eventType' | 'category'
  operation: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
  clientVersion: number
}

/**
 * 获取待推送变更队列
 */
export function getPendingChanges(): PendingChange[] {
  return getStorage<PendingChange[]>(STORAGE_KEYS.PENDING_CHANGES) || []
}

/**
 * 保存待推送变更队列
 */
function savePendingChanges(queue: PendingChange[]): void {
  setStorage(STORAGE_KEYS.PENDING_CHANGES, queue)
}

/**
 * 添加变更到队列
 */
export function addPendingChange(
  entity: 'event' | 'anniversary' | 'eventType' | 'category',
  operation: 'create' | 'update' | 'delete',
  data: any,
  clientVersion: number
): void {
  const queue = getPendingChanges()
  queue.push({
    entity,
    operation,
    data,
    timestamp: Date.now(),
    clientVersion
  })
  savePendingChanges(queue)
  console.log('[PendingChanges] Added:', entity, operation, data.id)
}

/**
 * 从队列移除变更
 */
export function removePendingChange(timestamp: number): void {
  const queue = getPendingChanges()
  const index = queue.findIndex(c => c.timestamp === timestamp)
  if (index !== -1) {
    queue.splice(index, 1)
    savePendingChanges(queue)
    console.log('[PendingChanges] Removed:', timestamp)
  }
}

/**
 * 清空队列
 */
export function clearPendingChanges(): void {
  savePendingChanges([])
  console.log('[PendingChanges] Cleared')
}

/**
 * 获取队列前 N 条变更（用于批量推送）
 */
export function getBatchChanges(maxCount: number = 50): PendingChange[] {
  const queue = getPendingChanges()
  return queue.slice(0, maxCount)
}

/**
 * 移除队列前 N 条变更
 */
export function removeBatchChanges(count: number): void {
  const queue = getPendingChanges()
  queue.splice(0, count)
  savePendingChanges(queue)
}

/**
 * 队列是否为空
 */
export function isPendingEmpty(): boolean {
  return getPendingChanges().length === 0
}

/**
 * 队列长度
 */
export function getPendingCount(): number {
  return getPendingChanges().length
}
```

- [ ] **Step 2: 提交改动**

```bash
git add src/utils/pendingChanges.ts
git commit -m "feat(client): 创建 pendingChanges 待推送变更队列管理"
```

---

## Phase 8: 重写 syncManager.ts

### Task 24: 重写 syncManager.ts

**Files:**
- Rewrite: `src/utils/syncManager.ts`

- [ ] **Step 1: 重写 syncManager.ts（HTTP REST + 定时轮询）**

```typescript
import { getStorage, setStorage, removeStorage, STORAGE_KEYS, getSyncState, saveSyncState } from './storage'
import { getApiUrl } from './config'
import { getOrCreateDeviceId } from './deviceId'
import {
  getPendingChanges,
  addPendingChange,
  removeBatchChanges,
  clearPendingChanges,
  isPendingEmpty,
  getPendingCount,
  PendingChange
} from './pendingChanges'
import { useEventStore } from '@/store/event'
import { useAnniversaryStore } from '@/store/anniversary'
import { useEventTypeStore } from '@/store/eventType'
import { useAnniversaryCategoryStore } from '@/store/anniversaryCategory'

// 同步配置
const SYNC_CONFIG = {
  SYNC_INTERVAL: 8000,      // 轮询间隔 8 秒
  MAX_RETRY: 3,             // 最大重试次数
  BATCH_SIZE: 50,           // 每次推送最大变更数
  REQUEST_TIMEOUT: 15000    // 请求超时时间
}

// 同步状态
type SyncStatus = 'idle' | 'syncing' | 'error'

// 内部状态
let syncTimer: ReturnType<typeof setInterval> | null = null
let currentStatus: SyncStatus = 'idle'
let isInitialized = false

// 状态回调
const statusListeners: Set<(status: SyncStatus) => void> = new Set()

/**
 * 获取同步状态
 */
export function getSyncStatus(): SyncStatus {
  return currentStatus
}

/**
 * 监听同步状态变化
 */
export function onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
  statusListeners.add(callback)
  return () => statusListeners.delete(callback)
}

/**
 * 更新同步状态
 */
function setSyncStatus(status: SyncStatus): void {
  currentStatus = status
  statusListeners.forEach(cb => cb(status))
}

/**
 * 获取当前同步模式
 */
export function getSyncMode(): 'local' | 'sync' {
  const shareCode = getStorage<string>(STORAGE_KEYS.SYNC_SHARE_CODE)
  const syncEnabled = getStorage<boolean>(STORAGE_KEYS.SYNC_ENABLED)

  if (!shareCode || !syncEnabled) {
    return 'local'
  }
  return 'sync'
}

/**
 * 发送 HTTP 请求
 */
async function request<T>(options: {
  url: string
  method: 'GET' | 'POST'
  data?: any
  timeout?: number
}): Promise<{ success: boolean; data?: T; error?: string }> {
  const apiUrl = getApiUrl()
  const fullUrl = `${apiUrl}${options.url}`

  return new Promise((resolve) => {
    uni.request({
      url: fullUrl,
      method: options.method,
      data: options.data,
      timeout: options.timeout || SYNC_CONFIG.REQUEST_TIMEOUT,
      success: (res: any) => {
        if (res.statusCode === 200 && res.data?.success) {
          resolve({ success: true, data: res.data.data })
        } else {
          resolve({ success: false, error: res.data?.error || '请求失败' })
        }
      },
      fail: (err: any) => {
        resolve({ success: false, error: err.errMsg || '网络错误' })
      }
    })
  })
}

/**
 * 执行一次同步
 */
async function doSync(): Promise<boolean> {
  if (currentStatus === 'syncing') {
    return false
  }

  const mode = getSyncMode()
  if (mode !== 'sync') {
    return false
  }

  const spaceId = getStorage<string>(STORAGE_KEYS.SYNC_SPACE_ID)
  const deviceId = getOrCreateDeviceId()
  const syncState = getSyncState()

  if (!spaceId) {
    console.warn('[Sync] No spaceId, skipping sync')
    return false
  }

  setSyncStatus('syncing')

  try {
    // 1. 推送本地变更
    const pendingChanges = getPendingChanges()
    if (pendingChanges.length > 0) {
      const batch = pendingChanges.slice(0, SYNC_CONFIG.BATCH_SIZE)
      const pushResult = await request<{ accepted: string[], conflicts: any[], newVersion: number }>({
        url: '/sync/push',
        method: 'POST',
        data: { spaceId, deviceId, changes: batch }
      })

      if (pushResult.success) {
        // 移除成功推送的变更
        removeBatchChanges(batch.length)
        // 处理冲突
        handleConflicts(pushResult.data!.conflicts)
        // 更新版本号
        if (pushResult.data!.newVersion > syncState.lastSyncVersion) {
          syncState.lastSyncVersion = pushResult.data!.newVersion
        }
        console.log('[Sync] Push success:', pushResult.data!.accepted.length, 'accepted')
      } else {
        console.error('[Sync] Push failed:', pushResult.error)
      }
    }

    // 2. 拉取远端变更
    const pullResult = await request<any>({
      url: `/sync/pull?spaceId=${spaceId}&sinceVersion=${syncState.lastSyncVersion}`,
      method: 'GET'
    })

    if (pullResult.success) {
      // 应用变更到本地
      applySyncData(pullResult.data!)
      // 更新版本号
      if (pullResult.data!.maxVersion > syncState.lastSyncVersion) {
        syncState.lastSyncVersion = pullResult.data!.maxVersion
      }
      syncState.lastSyncTime = Date.now()
      saveSyncState(syncState)
      console.log('[Sync] Pull success:', pullResult.data!.maxVersion)
    } else {
      console.error('[Sync] Pull failed:', pullResult.error)
    }

    setSyncStatus('idle')
    return true

  } catch (e) {
    console.error('[Sync] Sync error:', e)
    setSyncStatus('error')
    return false
  }
}

/**
 * 处理冲突
 */
function handleConflicts(conflicts: any[]): void {
  const eventStore = useEventStore()
  const anniversaryStore = useAnniversaryStore()
  const eventTypeStore = useEventTypeStore()
  const categoryStore = useAnniversaryCategoryStore()

  for (const conflict of conflicts) {
    if (conflict.reason === 'server_win' && conflict.serverData) {
      // 用服务器版本覆盖本地
      switch (conflict.serverData.entityType || inferEntityType(conflict.serverData)) {
        case 'event':
          const eventIndex = eventStore.events.findIndex(e => e.id === conflict.id)
          if (eventIndex !== -1) {
            eventStore.events[eventIndex] = conflict.serverData
            eventStore.saveToStorage()
          }
          break
        case 'anniversary':
          const annIndex = anniversaryStore.anniversaries.findIndex(a => a.id === conflict.id)
          if (annIndex !== -1) {
            anniversaryStore.anniversaries[annIndex] = conflict.serverData
            anniversaryStore.saveToStorage()
          }
          break
        case 'eventType':
          const typeIndex = eventTypeStore.types.findIndex(t => t.id === conflict.id)
          if (typeIndex !== -1) {
            eventTypeStore.types[typeIndex] = conflict.serverData
            eventTypeStore.saveToStorage()
          }
          break
        case 'category':
          const catIndex = categoryStore.categories.findIndex(c => c.id === conflict.id)
          if (catIndex !== -1) {
            categoryStore.categories[catIndex] = conflict.serverData
            categoryStore.saveToStorage()
          }
          break
      }
      console.log('[Sync] Conflict resolved, server win:', conflict.id)
    }
  }
}

/**
 * 推断实体类型
 */
function inferEntityType(data: any): string {
  if (data.time !== undefined) return 'event'
  if (data.date !== undefined) return 'anniversary'
  if (data.color !== undefined) return 'eventType'
  return 'category'
}

/**
 * 应用同步数据到本地
 */
function applySyncData(data: any): void {
  const eventStore = useEventStore()
  const anniversaryStore = useAnniversaryStore()
  const eventTypeStore = useEventTypeStore()
  const categoryStore = useAnniversaryCategoryStore()

  // 应用 events
  if (data.events && data.events.length > 0) {
    for (const event of data.events) {
      const index = eventStore.events.findIndex(e => e.id === event.id)
      if (event.deleted) {
        // 软删除：从本地移除
        if (index !== -1) {
          eventStore.events.splice(index, 1)
        }
      } else if (index !== -1) {
        // 更新
        eventStore.events[index] = event
      } else {
        // 新增
        eventStore.events.push(event)
      }
    }
    eventStore.saveToStorage()
  }

  // 应用 anniversaries
  if (data.anniversaries && data.anniversaries.length > 0) {
    for (const ann of data.anniversaries) {
      const index = anniversaryStore.anniversaries.findIndex(a => a.id === ann.id)
      if (ann.deleted) {
        if (index !== -1) {
          anniversaryStore.anniversaries.splice(index, 1)
        }
      } else if (index !== -1) {
        anniversaryStore.anniversaries[index] = ann
      } else {
        anniversaryStore.anniversaries.push(ann)
      }
    }
    anniversaryStore.saveToStorage()
  }

  // 应用 eventTypes
  if (data.eventTypes && data.eventTypes.length > 0) {
    for (const type of data.eventTypes) {
      const index = eventTypeStore.types.findIndex(t => t.id === type.id)
      if (type.deleted) {
        if (index !== -1) {
          eventTypeStore.types.splice(index, 1)
        }
      } else if (index !== -1) {
        eventTypeStore.types[index] = type
      } else {
        eventTypeStore.types.push(type)
      }
    }
    eventTypeStore.saveToStorage()
  }

  // 应用 categories
  if (data.categories && data.categories.length > 0) {
    for (const cat of data.categories) {
      const index = categoryStore.categories.findIndex(c => c.id === cat.id)
      if (cat.deleted) {
        if (index !== -1) {
          categoryStore.categories.splice(index, 1)
        }
      } else if (index !== -1) {
        categoryStore.categories[index] = cat
      } else {
        categoryStore.categories.push(cat)
      }
    }
    categoryStore.saveToStorage()
  }
}

/**
 * 全量同步
 */
async function fullSync(): Promise<boolean> {
  const spaceId = getStorage<string>(STORAGE_KEYS.SYNC_SPACE_ID)
  if (!spaceId) {
    return false
  }

  setSyncStatus('syncing')

  try {
    const result = await request<any>({
      url: `/sync/full?spaceId=${spaceId}`,
      method: 'GET'
    })

    if (result.success) {
      // 清空本地数据
      const eventStore = useEventStore()
      const anniversaryStore = useAnniversaryStore()
      const eventTypeStore = useEventTypeStore()
      const categoryStore = useAnniversaryCategoryStore()

      eventStore.events = []
      anniversaryStore.anniversaries = []
      eventTypeStore.types = []
      categoryStore.categories = []

      // 应用服务器数据
      applySyncData(result.data!)

      // 更新版本号
      const syncState = getSyncState()
      syncState.lastSyncVersion = result.data!.maxVersion
      syncState.lastSyncTime = Date.now()
      saveSyncState(syncState)

      // 清空待推送队列
      clearPendingChanges()

      console.log('[Sync] Full sync success:', result.data!.maxVersion)
      setSyncStatus('idle')
      return true
    } else {
      console.error('[Sync] Full sync failed:', result.error)
      setSyncStatus('error')
      return false
    }
  } catch (e) {
    console.error('[Sync] Full sync error:', e)
    setSyncStatus('error')
    return false
  }
}

/**
 * 启动同步轮询
 */
function startSyncLoop(): void {
  if (syncTimer) {
    clearInterval(syncTimer)
  }

  console.log('[Sync] Starting sync loop, interval:', SYNC_CONFIG.SYNC_INTERVAL)

  // 立即执行一次同步
  doSync()

  // 定时轮询
  syncTimer = setInterval(() => {
    doSync()
  }, SYNC_CONFIG.SYNC_INTERVAL)
}

/**
 * 停止同步轮询
 */
function stopSyncLoop(): void {
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }
  console.log('[Sync] Sync loop stopped')
}

/**
 * 设置同步开关
 */
export function setSyncEnabled(enabled: boolean): void {
  setStorage(STORAGE_KEYS.SYNC_ENABLED, enabled)

  if (enabled && getStorage<string>(STORAGE_KEYS.SYNC_SHARE_CODE)) {
    startSyncLoop()
  } else {
    stopSyncLoop()
  }

  console.log('[Sync] Sync enabled:', enabled)
}

/**
 * 用户操作触发记录变更
 */
export function recordChange(
  entity: 'event' | 'anniversary' | 'eventType' | 'category',
  operation: 'create' | 'update' | 'delete',
  data: any
): void {
  const mode = getSyncMode()

  if (mode === 'sync') {
    const syncState = getSyncState()
    addPendingChange(entity, operation, data, syncState.lastSyncVersion)

    // 立即尝试同步（如果不在同步中）
    if (currentStatus !== 'syncing') {
      doSync()
    }
  }
}

/**
 * 创建新空间
 */
export async function createSpace(): Promise<{ shareCode: string; spaceId: string } | null> {
  const apiUrl = getApiUrl()
  const deviceId = getOrCreateDeviceId()

  try {
    const result = await request<{ shareCode: string; spaceId: string }>({
      url: '/space/create',
      method: 'POST',
      data: { deviceId }
    })

    if (result.success && result.data) {
      const { shareCode, spaceId } = result.data
      setStorage(STORAGE_KEYS.SYNC_SHARE_CODE, shareCode)
      setStorage(STORAGE_KEYS.SYNC_SPACE_ID, spaceId)
      setStorage(STORAGE_KEYS.SYNC_ENABLED, true)

      // 初始化同步状态
      saveSyncState({ lastSyncVersion: 0, lastSyncTime: Date.now(), syncEnabled: true })

      // 开始同步
      startSyncLoop()

      return { shareCode, spaceId }
    }

    return null
  } catch (e) {
    console.error('[Sync] Create space error:', e)
    return null
  }
}

/**
 * 验证分享码
 */
export async function verifyShareCode(code: string): Promise<{ valid: boolean; spaceId?: string }> {
  const result = await request<{ spaceId: string }>({
    url: `/space/verify?code=${encodeURIComponent(code)}`,
    method: 'GET'
  })

  if (result.success && result.data) {
    return { valid: true, spaceId: result.data.spaceId }
  }

  return { valid: false }
}

/**
 * 加入空间（使用分享码）
 */
export async function joinSpace(shareCode: string): Promise<boolean> {
  const verifyResult = await verifyShareCode(shareCode)

  if (!verifyResult.valid || !verifyResult.spaceId) {
    console.error('[Sync] Invalid share code')
    return false
  }

  setStorage(STORAGE_KEYS.SYNC_SHARE_CODE, shareCode)
  setStorage(STORAGE_KEYS.SYNC_SPACE_ID, verifyResult.spaceId)
  setStorage(STORAGE_KEYS.SYNC_ENABLED, true)

  // 初始化同步状态
  saveSyncState({ lastSyncVersion: 0, lastSyncTime: Date.now(), syncEnabled: true })

  // 执行全量同步
  const success = await fullSync()

  if (success) {
    startSyncLoop()
    return true
  }

  return false
}

/**
 * 退出空间
 */
export function leaveSpace(): void {
  stopSyncLoop()

  removeStorage(STORAGE_KEYS.SYNC_SHARE_CODE)
  removeStorage(STORAGE_KEYS.SYNC_SPACE_ID)
  removeStorage(STORAGE_KEYS.SYNC_ENABLED)
  removeStorage(STORAGE_KEYS.SYNC_LAST_VERSION)

  clearPendingChanges()

  console.log('[Sync] Left space')
}

/**
 * 初始化同步管理器
 */
export function initSyncManager(): void {
  if (isInitialized) {
    return
  }

  isInitialized = true

  const mode = getSyncMode()
  console.log('[Sync] Init, mode:', mode)

  if (mode === 'sync') {
    // 如果有待推送变更，先同步
    if (!isPendingEmpty()) {
      console.log('[Sync] Pending changes:', getPendingCount())
    }

    // 开始同步轮询
    startSyncLoop()
  }
}

/**
 * 手动触发同步
 */
export async function triggerSync(): Promise<boolean> {
  return doSync()
}

/**
 * 获取同步状态信息
 */
export function getSyncInfo(): {
  mode: 'local' | 'sync'
  status: SyncStatus
  pendingCount: number
  lastSyncTime: number
  lastSyncVersion: number
} {
  const syncState = getSyncState()
  return {
    mode: getSyncMode(),
    status: currentStatus,
    pendingCount: getPendingCount(),
    lastSyncTime: syncState.lastSyncTime,
    lastSyncVersion: syncState.lastSyncVersion
  }
}

// 导出兼容旧代码的函数（渐进式迁移）
export { getSyncMode as getConnectionStatus } from './syncManager'
```

- [ ] **Step 2: 提交改动**

```bash
git add src/utils/syncManager.ts
git commit -m "feat(client): 重写 syncManager 为 HTTP REST + 定时轮询方案"
```

---

## Phase 9: 清理旧代码

### Task 25: 更新 config.ts 移除 WebSocket 配置

**Files:**
- Modify: `src/utils/config.ts`

- [ ] **Step 1: 查看当前 config.ts 内容**

读取 `src/utils/config.ts` 文件内容。

- [ ] **Step 2: 移除 WebSocket 相关配置，保留必要配置**

修改 `src/utils/config.ts`，移除 WebSocket URL，保留 API URL：

```typescript
/**
 * 配置文件
 */

// API 服务地址
const API_BASE_URL = 'http://localhost:8080'

// 生产环境配置
const PROD_API_BASE_URL = 'https://your-production-server.com'

// 获取 API URL
export function getApiUrl(): string {
  // 根据环境切换
  const env = process.env.NODE_ENV
  return env === 'production' ? PROD_API_BASE_URL : API_BASE_URL
}

// 同步配置
export const SYNC_CONFIG = {
  SYNC_INTERVAL: 8000,      // 同步轮询间隔（毫秒）
  MAX_RETRY: 3,             // 最大重试次数
  BATCH_SIZE: 50,           // 每次推送最大变更数
  REQUEST_TIMEOUT: 15000    // 请求超时时间（毫秒）
}
```

- [ ] **Step 3: 提交改动**

```bash
git add src/utils/config.ts
git commit -m "refactor(client): 移除 WebSocket 配置，保留 HTTP REST 配置"
```

### Task 26: 删除不再使用的文件

**Files:**
- Delete: `src/utils/offlineQueue.ts` (由 pendingChanges.ts 替代)

- [ ] **Step 1: 删除 offlineQueue.ts**

```bash
rm src/utils/offlineQueue.ts
```

- [ ] **Step 2: 提交改动**

```bash
git add -A
git commit -m "refactor(client): 删除 offlineQueue.ts，由 pendingChanges.ts 替代"
```

---

## 总结检查清单

- [ ] 所有实体类新增 version 和 deleted 字段
- [ ] 所有 Repository 新增版本查询方法
- [ ] 新增 SpaceVersion 实体和 Repository
- [ ] 新增所有同步相关 DTO
- [ ] SyncService 实现完整的同步逻辑
- [ ] SyncController 实现四个 API 接口
- [ ] DataCleanupService 实现定时清理
- [ ] 客户端 storage.ts 新增同步状态存储
- [ ] 客户端 pendingChanges.ts 实现队列管理
- [ ] 客户端 syncManager.ts 重写为 HTTP REST 方案
- [ ] 移除 WebSocket 相关代码和配置

---

## 验证测试

实现完成后，执行以下验证：

1. **服务器启动测试**
```bash
cd sync-server && mvn spring-boot:run
```

2. **API 接口测试**
```bash
curl http://localhost:8080/sync/status?spaceId=test
curl http://localhost:8080/sync/pull?spaceId=test&sinceVersion=0
```

3. **客户端集成测试**
- 创建空间 → 验证 shareCode
- 加入空间 → 验证全量同步
- 本地修改 → 验证推送和拉取
- 离线修改 → 验证 pendingChanges 队列
- 网络恢复 → 验证自动同步