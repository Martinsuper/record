---
name: HTTP REST 多用户数据同步方案
description: 基于 HTTP REST + 定时轮询的多用户数据同步设计，支持本地/同步双模式
type: project
---

# HTTP REST 多用户数据同步方案设计

**日期**: 2026-04-04

## 背景

当前同步方案基于 WebSocket，存在以下问题：
- WebSocket 接口不稳定，调试困难
- 无冲突解决机制，多设备编辑会丢失更新
- 无版本控制，缺少数据追踪
- 新设备加入无法获取历史数据
- 离线队列不可靠

## 设计目标

- 简化架构，放弃 WebSocket，使用稳定的 HTTP REST
- 支持多人协作 (2-5 人)
- 支持大数据量 (>500 条记录)
- 中等实时性要求 (5-10 秒延迟可接受)
- 支持本地模式和同步模式切换

---

## 1. 核心概念

### 版本号机制

每个数据实体新增 `version` 字段，每次变更自动递增：

```java
public class Event {
    private String id;
    private String spaceId;
    private String name;
    private Long time;
    private Long version;    // 新增：版本号
    private Long updatedAt;  // 更新时间戳
    private Boolean deleted; // 新增：软删除标记
}
```

### 同步令牌

客户端维护 `lastSyncVersion`，记录上次同步的最大版本号：

```typescript
interface SyncState {
    lastSyncVersion: number;  // 上次同步的最大版本号
    lastSyncTime: number;     // 上次同步时间戳
}
```

### 增量同步原理

- 客户端请求：`GET /sync/pull?sinceVersion=123`
- 服务器返回：所有 `version > 123` 的变更记录
- 客户端应用变更，更新 `lastSyncVersion`

---

## 2. 运行模式

### 本地模式 vs 同步模式

| 模式 | 条件 | 行为 |
|------|------|------|
| 本地模式 | 无共享码/未开启同步 | 数据仅存本地，不触发同步 |
| 同步模式 | 有共享码且已开启 | 数据本地+远端同步，定时轮询 |

### 模式判断

```typescript
function getSyncMode(): 'local' | 'sync' {
    const shareCode = getStorage(STORAGE_KEYS.SYNC_SHARE_CODE)
    const syncEnabled = getStorage(STORAGE_KEYS.SYNC_ENABLED)

    if (!shareCode || !syncEnabled) {
        return 'local'
    }
    return 'sync'
}
```

---

## 3. API 设计

### 接口列表

| 接口 | 方法 | 说明 |
|------|------|------|
| `/sync/pull` | GET | 拉取增量变更 |
| `/sync/push` | POST | 推送本地变更 |
| `/sync/full` | GET | 全量同步 |
| `/sync/status` | GET | 获取同步状态 |

### 拉取变更 - `/sync/pull`

**请求**: `GET /sync/pull?spaceId=xxx&sinceVersion=100`

**响应**:
```json
{
    "success": true,
    "data": {
        "events": [
            { "id": "e1", "name": "事件A", "version": 101, "updatedAt": 170000, "deleted": false },
            { "id": "e2", "version": 102, "deleted": true }
        ],
        "anniversaries": [],
        "eventTypes": [],
        "categories": [],
        "maxVersion": 105,
        "hasMore": false
    }
}
```

### 推送变更 - `/sync/push`

**请求**:
```json
{
    "spaceId": "xxx",
    "deviceId": "d1",
    "changes": [
        {
            "entity": "event",
            "operation": "create",
            "data": { "id": "e3", "name": "新事件" },
            "clientVersion": 100
        }
    ]
}
```

**响应**:
```json
{
    "success": true,
    "data": {
        "accepted": ["e3"],
        "conflicts": [],
        "newVersion": 106
    }
}
```

---

## 4. 客户端同步逻辑

### 同步状态

```typescript
interface SyncState {
    lastSyncVersion: number
    pendingChanges: Change[]
    isSyncing: boolean
    lastSyncTime: number
    syncInterval: number  // 默认 5-10 秒
}

interface Change {
    entity: 'event' | 'anniversary' | 'eventType' | 'category'
    operation: 'create' | 'update' | 'delete'
    data: any
    timestamp: number
}
```

### 同步流程

```
1. 用户操作触发
   └─► 更新本地数据
   └─► 记录到 pendingChanges 队列
   └─► 立即尝试推送（若网络可用）

2. 定时轮询触发（每 N 秒）
   └─► POST /sync/push 推送本地变更
   └─► GET /sync/pull 拉取远端变更
   └─► 应用变更，更新 lastSyncVersion

3. 网络恢复时
   └─► 立即触发完整同步
   └─► 处理积压的 pendingChanges
```

### 离线处理

```typescript
function onUserChange(entity, operation, data) {
    // 1. 更新本地数据
    updateLocalData(entity, data)

    // 2. 根据模式决定是否同步
    if (getSyncMode() === 'sync') {
        pendingChanges.push({ entity, operation, data, timestamp: Date.now() })
        if (isOnline() && !isSyncing) {
            syncNow()
        }
    }
}
```

---

## 5. 冲突处理

### 冲突场景

| 场景 | 检测方式 | 处理策略 |
|------|---------|---------|
| 同时编辑同一记录 | version 不匹配 | Last-Write-Wins (updatedAt 大者胜出) |
| 编辑已删除记录 | deleted=true | 服务器拒绝，客户端恢复数据 |
| 创建重复ID | ID已存在 | 服务器生成新ID返回 |

### Last-Write-Wins 实现

```java
if (current.version > change.data.version) {
    // 版本冲突
    if (change.data.updatedAt > current.updatedAt) {
        // 客户端更新时间更晚 → 客户端胜出
        applyChange(change);
    } else {
        // 服务器胜出，返回当前数据
        conflicts.add(new ConflictInfo(id, "server_win", current));
    }
}
```

---

## 6. 数据库改动

### 新增字段

每个实体表新增：
- `version` - 版本号，每次变更自增
- `deleted` - 软删除标记

### 新增索引

```sql
INDEX idx_space_version (space_id, version)
```

### 新增表：space_version

```sql
CREATE TABLE IF NOT EXISTS space_version (
    space_id VARCHAR(64) PRIMARY KEY,
    max_version BIGINT DEFAULT 0,
    updated_at BIGINT,
    FOREIGN KEY (space_id) REFERENCES space(id) ON DELETE CASCADE
);
```

---

## 7. 错误处理

### 网络错误处理

| 错误类型 | 处理策略 |
|---------|---------|
| 网络断开 | 变更存入 pendingChanges，下次重试 |
| 请求超时 | 3次重试，间隔递增 (1s, 2s, 4s) |
| 服务器 5xx | 同超时策略 |
| 服务器 4xx | 不重试，提示用户 |

### 边界情况

| 场景 | 处理方式 |
|------|---------|
| 新设备加入 | `/sync/full` 全量同步 |
| 长时间离线 | 先推送积压变更，再拉取远端 |
| pendingChanges > 100 | 分批推送，每次最多 50 条 |
| 版本差距 > 1000 | 提示全量同步 |
| 空间不存在 | 清除本地状态，提示重新加入 |

---

## 8. 服务器端核心实现

### SyncService

主要方法：
- `pull(spaceId, sinceVersion)` - 拉取增量变更
- `push(spaceId, deviceId, changes)` - 推送变更处理
- `fullSync(spaceId)` - 全量同步
- `getStatus(spaceId)` - 同步状态信息

### SyncController

- `GET /sync/pull` - 拉取接口
- `POST /sync/push` - 推送接口
- `GET /sync/full` - 全量同步接口
- `GET /sync/status` - 状态接口

---

## 9. 数据清理

### 软删除清理策略

- 保留 30 天
- 每日凌晨 3 点物理删除

```java
@Scheduled(cron = "0 0 3 * * ?")
public void cleanupSoftDeletedData() {
    long threshold = System.currentTimeMillis() - 30L * 24 * 60 * 60 * 1000;
    eventRepository.deleteByDeletedTrueAndUpdatedAtBefore(threshold);
    // ... 其他表
}
```

---

## 10. 改动总结

### 客户端改动

- 新增 `version`、`syncEnabled` 存储字段
- 改造 `syncManager.ts` → HTTP REST + 定时轮询
- 新增 `pendingChanges` 队列管理
- 新增模式切换逻辑

### 服务器改动

- 数据库表新增 `version`、`deleted` 字段
- 新增 `space_version` 表
- 新增 `SyncService`、`SyncController`
- 删除 WebSocket 相关代码（或保留备用）
- 新增定时清理任务

---

## Why

当前 WebSocket 方案不稳定、调试困难，导致同步可靠性差。HTTP REST 方案更稳定、易调试、易维护。

## How to apply

实施时先完成数据库改动，再实现服务器端 SyncService 和 Controller，最后改造客户端 syncManager。支持渐进式迁移，可先保留 WebSocket 作为备用。