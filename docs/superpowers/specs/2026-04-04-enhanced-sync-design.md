# 增强型增量同步方案设计

## 概述

本文档描述了对现有同步系统的增强改进方案，旨在解决以下核心问题：
- 长时间离线使用数据丢失风险
- 多设备并发修改冲突处理
- 大数据量同步效率低下
- 网络不稳定环境下同步可靠性差

方案基于现有 HTTP REST + 定时轮询架构，通过渐进式增强各组件能力，在不引入 WebSocket 复杂性的前提下，实现更强大、可靠的同步功能。

## 核心架构

### 客户端架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              客户端架构                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                    │
│   │  Pinia      │───→│ SyncEngine  │───→│ IndexedDB   │                    │
│   │  Store      │    │ (核心引擎)   │    │ (离线存储)  │                    │
│   └─────────────┘    └─────────────┘    └─────────────┘                    │
│         │                  │                    │                          │
│         ↓                  ↓                    ↓                          │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                    │
│   │ ChangeLog   │    │ HTTPClient  │    │ LocalCache  │                    │
│   │ (变更记录)  │    │ (网络层)    │    │ (本地缓存)  │                    │
│   └─────────────┘    └─────────────┘    └─────────────┘                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 服务端架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              服务端架构                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                    │
│   │ SyncAPI     │───→│ SyncService │───→│ MySQL       │                    │
│   │ (REST)      │    │ (业务逻辑)  │    │ (持久化)    │                    │
│   └─────────────┘    └─────────────┘    └─────────────┘                    │
│                             │                                               │
│                             ↓                                               │
│                      ┌─────────────┐                                       │
│                      │ OperationLog│                                       │
│                      │ DataSnapshot│                                       │
│                      └─────────────┘                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 核心改进

1. **IndexedDB 替换 localStorage**: 容量更大(~50MB+)，持久化更可靠
2. **SyncEngine 模块化**: 将同步逻辑从 syncManager.ts 中拆分为独立引擎
3. **变更记录优化**: 支持字段级差异、合并短时间内多次修改
4. **网络层增强**: 自动重试、断点续传、请求合并

---

## IndexedDB 离线存储结构

### 数据库配置

```typescript
const DB_NAME = 'RecordSyncDB'
const DB_VERSION = 1
```

### 存储对象定义

| Store 名称 | KeyPath | 索引 | 说明 |
|-----------|---------|------|------|
| events | id | spaceId, version, updatedAt, time, typeId | 事件数据缓存 |
| anniversaries | id | spaceId, version, updatedAt, date | 纪念日数据缓存 |
| eventTypes | id | spaceId, version | 事件类型缓存 |
| categories | id | spaceId, version | 分类缓存 |
| pendingQueue | id | timestamp, entity, status | 待推送队列 |
| syncMeta | key | - | 同步元数据 |
| operationLog | id | timestamp, entity, synced | 操作历史 |

### 数据记录结构

#### PendingChange（待推送队列）

```typescript
interface PendingChange {
  id: string          // UUID，用于幂等处理
  entity: 'event' | 'anniversary' | 'eventType' | 'category'
  operation: 'create' | 'update' | 'delete'
  data: any           // 完整实体数据
  fields?: string[]   // 仅修改的字段列表（用于差异推送）
  timestamp: number
  clientVersion: number
  retryCount: number  // 重试次数
  status: 'pending' | 'pushed' | 'failed'
}
```

#### SyncMeta（同步元数据）

```typescript
interface SyncMeta {
  key: 'sync_state'
  spaceId: string
  shareCode: string
  lastVersion: number
  lastSyncTime: number
  dataHash: string     // 所有数据的 hash，用于完整性校验
  enabled: boolean
}
```

---

## 同步流程与智能轮询

### 同步触发时机

| 触发源 | 优先级 | 行为 |
|--------|--------|------|
| 用户手动触发 | 最高 | 立即执行全量同步 |
| 本地变更记录 | 高 | 短延迟后推送（合并多次修改） |
| 智能轮询定时器 | 中 | 推送队列 + 取增量 |
| 网络恢复事件 | 中 | 立即触发同步 |
| App 从后台恢复 | 低 | 检查后决定是否同步 |

### 智能轮询配置

```typescript
const POLL_CONFIG = {
  minInterval: 3000,     // 最快 3 秒
  maxInterval: 60000,    // 最慢 60 秒
  defaultInterval: 8000, // 默认 8 秒

  adaptiveFactors: {
    userActive: 0.5,      // 用户活跃时间隔减半
    userIdle: 1.5,        // 用户空闲时间隔增加 50%
    networkGood: 0.8,     // 网络良好时加快
    networkPoor: 2.0,     // 网络差时减慢
    hasPending: 0.7,      // 有待推送时加快
    noPending: 1.2,       // 无待推送时减慢
    syncSuccess: 1.0,     // 同步成功保持
    syncFailed: 1.5,      // 同步失败减慢
  }
}
```

### 变更合并策略

```typescript
const MERGE_CONFIG = {
  window: 2000,  // 2 秒内的修改合并

  rules: {
    'create+update': 'create',      // 保留最新数据，操作类型为 create
    'create+delete': 'discard',     // 删除队列中的 create
    'update+update': 'merge',       // 合并 changedFields
    'update+delete': 'delete',      // 最终为删除
    'delete+create': 'create',      // 删除后新建
    'delete+update': 'delete'       // 忽略已删除项的更新
  }
}
```

---

## 差异压缩与数据校验

### 字段级差异传输

**原则**: 只传输变化的字段而非完整实体

```typescript
interface DiffPushRequest {
  entityId: string
  entity: EntityName
  changedFields: string[]      // 变化的字段名列表
  fieldValues: Record<string, any>  // 变化字段的新值
  clientVersion: number
}
```

**效果**: 数据传输量减少 50-75%

### 数据完整性校验

**流程**:
1. 客户端计算本地数据 SHA-256 hash
2. 请求服务端 hash
3. 比对不一致则触发全量同步

```typescript
// 校验时机
- 全量同步完成后
- 定期校验（每 24 小时）
- 用户手动触发

// hash 计算
function calculateDataHash(): string {
  const allData = {
    events: sortByVersion(getAllEvents()),
    anniversaries: sortByVersion(getAllAnniversaries()),
    eventTypes: sortByVersion(getAllEventTypes()),
    categories: sortByVersion(getAllCategories())
  }
  return sha256(JSON.stringify(allData))
}
```

### 批量推送优化

- 每批最多 50 条变更
- 服务端按实体类型并行处理
- 支持请求压缩（gzip，超过 1KB 启用）

---

## 离线恢复与重试机制

### 双重备份策略

```typescript
// 1. IndexedDB 主存储
// 2. localStorage 备份（最近 10 条待推送 + 6小时数据备份）

const BACKUP_CONFIG = {
  localStorageLimit: 10,        // localStorage 只存最近 10 条待推送
  periodicBackupInterval: 21600000,  // 每 6 小时备份一次
  backupRetention: 86400000     // 备份保留 24 小时
}
```

### 重试策略

```typescript
const RETRY_CONFIG = {
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,

  errorStrategy: {
    'network_error': 'retry',
    'timeout': 'retry',
    'server_error': 'retry',
    'conflict': 'no_retry',
    'auth_error': 'no_retry'
  }
}
```

### 断点续传

通过 SyncSession 记录同步进度：

```typescript
interface SyncSession {
  sessionId: string
  startTime: number
  lastProcessedId: string  // 最后成功推送的变更 ID
  totalChanges: number
  processedCount: number
  status: 'running' | 'paused' | 'completed' | 'failed'
}
```

网络恢复时从 lastProcessedId 继续。

### 网络状态监听

- 监听 `online`/`offline` 事件
- 定期 ping 服务端检测网络质量（延迟 < 500ms 为良好）
- 网络恢复时立即触发同步续传

---

## 服务端改进

### 新增数据库表

#### operation_log（操作日志）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(64) | 主键 |
| space_id | VARCHAR(64) | 空间 ID |
| entity | VARCHAR(20) | 实体类型 |
| entity_id | VARCHAR(64) | 实体 ID |
| operation | VARCHAR(10) | 操作类型 |
| changed_fields | JSON | 变化字段列表 |
| new_values | JSON | 新值 |
| client_version | BIGINT | 客户端版本 |
| server_version | BIGINT | 服务端版本 |
| device_id | VARCHAR(64) | 设备 ID |
| created_at | BIGINT | 创建时间 |

索引: `(space_id, server_version)`, `(space_id, entity, entity_id)`

#### data_snapshot（数据快照）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(64) | 主键 |
| space_id | VARCHAR(64) | 空间 ID |
| version | BIGINT | 版本号 |
| data_hash | VARCHAR(64) | 数据 hash |
| snapshot_data | JSON | 快照数据（压缩） |
| created_at | BIGINT | 创建时间 |

索引: `(space_id, version)`

#### device_sync_state（设备同步状态）

| 字段 | 类型 | 说明 |
|------|------|------|
| device_id | VARCHAR(64) | 主键 |
| space_id | VARCHAR(64) | 空间 ID |
| last_sync_version | BIGINT | 最后同步版本 |
| last_sync_time | BIGINT | 最后同步时间 |
| pending_operations | INT | 待处理操作数 |
| status | VARCHAR(20) | 状态 |

### 新增 API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/sync/hash` | GET | 获取数据 hash |
| `/api/sync/push-diff` | POST | 字段级差异推送 |
| `/api/sync/batch-push` | POST | 批量并行推送 |
| `/api/sync/recover` | POST | 恢复到指定版本 |
| `/api/sync/ping` | GET | 网络探测 |
| `/api/sync/device-status` | GET | 设备同步状态 |
| `/api/sync/meta` | GET | 同步元数据（总数、hash） |
| `/api/sync/events` | GET | 分批获取事件 |
| `/api/sync/anniversaries` | GET | 分批获取纪念日 |
| `/api/sync/event-types` | GET | 分批获取事件类型 |
| `/api/sync/categories` | GET | 分批获取分类 |

### 定期快照生成

- 每天凌晨 3 点自动生成
- 保留最近 7 天的快照
- 快照数据 gzip 压缩存储

---

## 大数据量同步优化

### 分页增量拉取

```typescript
const PULL_CONFIG = {
  pageSize: 100,       // 每页 100 条
  maxConcurrency: 2    // 各实体类型并行拉取限制
}
```

服务端返回:
- `hasMore`: 是否有更多数据
- `totalPulled`: 已拉取总数
- `totalRemaining`: 剩余总数

### 全量同步分批处理

```typescript
const FULL_SYNC_CONFIG = {
  batchSize: 500,      // 每批 500 条
  parallelEntities: true  // 不同实体类型并行拉取
}
```

流程:
1. 先获取元数据（总数、hash）
2. 各实体类型分批并行拉取
3. 直接写入 IndexedDB（不经过 Pinia）
4. 最终校验 hash

### 数据压缩

- 请求超过 1KB 启用 gzip 压缩
- 响应超过 1KB 自动压缩
- 压缩率通常 60-80%

### 本地索引优化

IndexedDB 索引:
- `(spaceId, version)` - 按版本查询
- `(updatedAt)` - 按更新时间查询
- `(typeId)` - 按类型查询（events）

批量写入使用 `bulkPut` 单次事务，比逐条写入快 10 倍+。

### 服务端查询优化

新增复合索引:
```sql
CREATE INDEX idx_event_space_version ON event(space_id, version);
CREATE INDEX idx_anniversary_space_version ON anniversary(space_id, version);
CREATE INDEX idx_event_type_space_version ON event_type(space_id, version);
CREATE INDEX idx_category_space_version ON anniversary_category(space_id, version);
```

---

## 错误处理与边界情况

### 错误类型分类

| 类型 | 重试 | 通知用户 | 处理动作 |
|------|------|----------|----------|
| NETWORK_OFFLINE | 否 | 否 | 等待恢复 |
| NETWORK_TIMEOUT | 是(3次) | 否 | 退避重试 |
| NETWORK_ERROR | 是(5次) | 否 | 退避重试 |
| SERVER_UNAVAILABLE | 是(5次) | 是 | 退避重试 |
| SERVER_BUSY | 是(3次) | 否 | 延迟重试 |
| RATE_LIMITED | 是(1次) | 是 | 降速 |
| AUTH_INVALID | 否 | 是 | 重新加入空间 |
| AUTH_EXPIRED | 否 | 是 | 重新加入空间 |
| DEVICE_BLOCKED | 否 | 是 | 离开空间 |
| DATA_CONFLICT | 否 | 是 | 更新本地数据 |
| DATA_DELETED | 否 | 否 | 更新本地数据 |
| DATA_INVALID | 否 | 否 | 丢弃 |
| DATA_TOO_LARGE | 否 | 是 | 减少数据 |
| STORAGE_FULL | 否 | 是 | 清理缓存 |
| STORAGE_CORRUPT | 否 | 是 | 全量同步 |

### 边界情况处理

| 场景 | 处理策略 |
|------|----------|
| IndexedDB 空间不足 | 监控使用率 >90% 时自动清理 30 天以上已删除数据 |
| 数据损坏检测 | hash 校验失败时尝试 localStorage 备份恢复或全量同步 |
| 长时间离线 (>7天) | 提示用户选择全量或增量同步 |
| 版本号跳跃 (>1000) | 检查快照，优先从快照恢复 |
| 多设备并发修改同一实体 | 记录冲突日志，Last-Write-Wins 使用最新版本 |
| 同步超时 (>30秒) | 检查网络状态，降级轮询频率 |

---

## 客户端模块架构

### 模块拆分

```
src/utils/sync/
├── index.ts                # 统一入口 API
├── SyncEngine.ts           # 同步引擎核心
├── IndexedDBManager.ts     # IndexedDB 管理
├── PendingQueue.ts         # 待推送队列
├── NetworkClient.ts        # 网络请求封装
├── NetworkMonitor.ts       # 网络状态监听
├── SyncScheduler.ts        # 智能轮询调度
├── ChangeMerger.ts         # 变更合并逻辑
├── DataHasher.ts           # 数据 hash 计算
├── BackupManager.ts        # 数据备份恢复
├── ErrorHandler.ts         # 错误处理
├── types.ts                # 类型定义
└── constants.ts            # 常量配置
```

### 对外统一 API

保持与现有 `syncManager.ts` API 兼容:

```typescript
// 初始化
initSyncSystem(): Promise<void>

// 空间管理
createSpace(): Promise<SpaceInfo | null>
joinSpace(shareCode: string): Promise<boolean>
leaveSpace(): void

// 同步控制
triggerSync(): Promise<SyncResult>
setSyncEnabled(enabled: boolean): void

// 变更记录
recordChange(entity, operation, data): void

// 状态查询
getSyncMode(): SyncMode
getSyncInfo(): SyncInfo
getSyncStatusFromServer(): Promise<SyncStatus | null>

// 状态监听
onSyncChange(callback): () => void
onSyncModeChange(callback): () => void
onSyncStatusChange(callback): () => void

// 兼容旧 API
connectWebSocket(shareCode): void  // 已废弃，内部调用 joinSpace
```

---

## 实现优先级

### 第一阶段：核心基础设施（必需）

1. IndexedDB 数据库初始化与管理
2. IndexedDBManager 模块实现
3. PendingQueue 队列管理
4. 网络重试机制
5. 错误分类与处理

### 第二阶段：同步流程增强

1. SyncEngine 核心引擎
2. SyncScheduler 智能轮询
3. ChangeMerger 变更合并
4. 数据备份恢复机制
5. 网络状态监听

### 第三阶段：性能优化

1. 字段级差异传输
2. 分页拉取实现
3. 批量推送优化
4. 数据压缩启用
5. 本地索引优化

### 第四阶段：服务端改进

1. 操作日志表创建
2. 数据快照表创建
3. 设备同步状态表
4. 新增 API 接口实现
5. 定期快照生成任务

### 第五阶段：边界与完善

1. 错误处理完善
2. 边界情况处理
3. 数据完整性校验
4. UI 进度展示集成
5. 测试与文档

---

## 技术依赖

### 新增依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| dexie | ^4.0.0 | IndexedDB 操作简化库 |
| js-sha256 | ^0.9.0 | SHA-256 hash 计算 |
| pako | ^1.0.0 | gzip 压缩/解压 |

### 可选依赖

| 依赖 | 用途 |
|------|------|
| localforage | IndexedDB/localStorage 统一接口（备选 dexie） |

---

## 冲突解决策略

采用 **Last-Write-Wins（最后写入者获胜）** 策略：

- 比较 `updatedAt` 时间戳，较新的覆盖较旧的
- 服务端版本号 `version` 作为辅助判断
- 冲突记录写入 `operation_log` 供审计
- 不需要用户手动干预

---

## 预期效果

| 场景 | 改进效果 |
|------|----------|
| 离线使用 | IndexedDB + localStorage 双重备份，数据丢失风险降低 99%+ |
| 并发修改 | Last-Write-Wins + 冲突日志，数据一致性保障 |
| 大数据量 | 分页拉取 + 压缩 + 并行处理，同步时间减少 50%+ |
| 网络不稳定 | 智能轮询 + 重试 + 断点续传，同步成功率提升 90%+ |
| 存储可靠性 | IndexedDB 容量 50MB+，比 localStorage 提升 25 倍 |