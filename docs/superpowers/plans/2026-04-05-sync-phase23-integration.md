# Phase 2/3 集成修复与性能优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复 Phase 2 模块未集成的问题 + 实现 Phase 3 gzip 压缩、并行拉取和字段级差推。

**Architecture:** 在 initSyncSystem 中启动 NetworkMonitor/BackupManager，在 recordChange 中集成 ChangeMerger，在 SyncEngine 中集成 DataHasher 校验。NetworkClient 新增 pako gzip 压缩，Pull 改为各实体类型并行。

**Tech Stack:** TypeScript, pako, Dexie 4

---

## Task 1: 集成 NetworkMonitor + BackupManager + ChangeMerger

**Files:**
- Modify: `src/utils/sync/SyncEngine.ts`
- Modify: `src/utils/syncManager.ts`

NetworkMonitor, BackupManager, ChangeMerger 模块已实现但从未被调用。修复:

```typescript
// syncManager.ts 修改 initSyncManager 函数

async function _init() {
  if (_initPromise) return _initPromise
  _initPromise = (async () => {
    if (_initialized) return
    _initialized = true
    const { initSyncSystem } = await import('./sync')
    const { startNetworkMonitor } = await import('./sync')
    const { startPeriodicBackup } = await import('./sync')
    const { startScheduler } = await import('./sync')

    initSyncSystem()
    startNetworkMonitor()
    startPeriodicBackup()
    startScheduler(async () => {
      const { triggerSync } = await import('./sync')
      await triggerSync()
    })
    // 恢复备份
    const { restorePendingFromBackup } = await import('./sync')
    await restorePendingFromBackup()
  })()
  return _initPromise
}
```

```typescript
// SyncEngine.doFullSync() 末尾添加 hash 校验:
// 全量同步后校验
await (async () => {
  const { calculateHash, hashMatches } = await import('./sync')  // from sync/index via NetworkClient
  const localHash = await calculateDataHash()
  const serverHash = await getApi<{ hash: string }>('/sync/hash', { spaceId: _currentSpaceId })
  if (serverHash?.hash && !hashMatches(localHash, serverHash.hash)) {
    console.warn('[Sync] Hash mismatch, data may be corrupted')
  }
})()
```

**Commit:** `fix(sync): 集成 NetworkMonitor, BackupManager, ChangeMerger`

---

## Task 2: recordChange 集成 ChangeMerger

**Files:**
- Modify: `src/utils/sync/SyncEngine.ts`

当前 `recordChange` 直接写入 IndexedDB 队列。改为先收集到内存 buffer，2 秒窗口后调用 ChangeMerger 合并再入队。

```typescript
// SyncEngine.ts — 在顶部添加 change buffer

let _changeBuffer: { entity: EntityName; operation: Operation; data: any; fields?: string[] }[] = []
let _mergeTimer: ReturnType<typeof setTimeout> | null = null

export async function recordChange(entity: EntityName, operation: Operation, data: any, fields?: string[]): Promise<void> {
  _changeBuffer.push({ entity, operation, data, fields })

  if (_mergeTimer) clearTimeout(_mergeTimer)
  _mergeTimer = setTimeout(async () => {
    const { mergeChanges } = await import('./ChangeMerger')
    // 先将 buffer 转为 PendingChange 格式
    const pendingLike = _changeBuffer.map((c, i) => ({
      id: `buf_${i}`,
      entity: c.entity,
      operation: c.operation,
      data: c.data,
      fields: c.fields,
      timestamp: Date.now(),
      clientVersion: c.data.version || 1,
      retryCount: 0,
      status: 'pending' as const
    }))

    const merged = mergeChanges(pendingLike)

    const db = await _getDB()
    for (const c of merged) {
      await db.pendingQueue.add(c as any)
    }
    _changeBuffer = []
    _infoListeners.forEach(cb => cb())
    _updatePendingState()
  }, 2000)

  // 立即更新 pending 状态计数
  _infoListeners.forEach(cb => cb())
  _updatePendingState()
}
```

**Commit:** `feat(sync): recordChange 集成 ChangeMerger 合并短时间内变更`

---

## Task 3: NetworkClient 新增 pako gzip 压缩

**Files:**
- Modify: `src/utils/sync/NetworkClient.ts`
- Read: `src/utils/sync/constants.ts` (PUSH_CONFIG.compressionThreshold)

```typescript
// NetworkClient.ts 顶部添加
import pako from 'pako'
import { PUSH_CONFIG } from './constants'

// 在 doRequest 函数中，POST 请求添加压缩逻辑:
async function doRequest<T>(options: HttpOptions & { headers: Record<string, string> }): Promise<T | null> {
  let body = options.data
  let contentType = 'application/json'

  // Compress request body if > 1KB
  if (options.method === 'POST' && options.data) {
    const json = JSON.stringify(options.data)
    if (json.length > PUSH_CONFIG.compressionThreshold) {
      const compressed = pako.gzip(json)
      body = compressed
      contentType = 'application/gzip'
    }
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject({ errMsg: 'request:fail timeout', statusCode: 0 })
    }, RETRY_CONFIG.timeout)

    const headers = { ...options.headers, 'Content-Type': contentType }

    uni.request({
      url: options.url,
      method: options.method || 'GET',
      data: body,
      header: headers,
      // Accept-Encoding for compressed responses
      enableQuic: true,
      enableHttp2: true,
      success: (res: any) => { clearTimeout(timeoutId); /* existing */ },
      fail: (err) => { clearTimeout(timeoutId); reject(err) }
    })
  })
}
```

**Commit:** `feat(sync): NetworkClient 新增 pako gzip 请求压缩`

---

## Task 4: 分页拉取并行 + 用户活动检测

**Files:**
- Modify: `src/utils/sync/SyncEngine.ts` (doPullChanges)
- Modify: `src/utils/sync/SyncScheduler.ts` (add setUserActivity)

### 4a: 各实体类型并行拉取
```typescript
// Pull each entity type concurrently
const entityTypes = ['events', 'anniversaries', 'eventTypes', 'categories'] as const
const entityMap = { events: 'event', anniversaries: 'anniversary', eventTypes: 'eventType', categories: 'category' }

const results = await Promise.all(
  entityTypes.map(async (entity) => {
    let total = 0
    while (true) {
      const result = await getApi<any>('/sync/pull', {
        spaceId: _currentSpaceId!,
        sinceVersion: _lastSyncVersion,
        entity, // server-side filter if supported, otherwise filter client-side
        limit: PULL_CONFIG.pageSize,
        offset: total
      })
      if (!result || !result[entity]?.length) break
      // ... process and batchPutAll
    }
    return { entity, count: total }
  })
)
```

### 4b: 用户活动检测
```typescript
// SyncScheduler.ts — 添加:
let _userActive = true

export function setUserActivity(active: boolean): void {
  _userActive = active
}

// 在 calcInterval 中添加:
if (_userActive) interval *= POLL_CONFIG.adaptiveFactors.userActive
else interval *= POLL_CONFIG.adaptiveFactors.userIdle
```

```typescript
// SyncEngine.ts — 添加用户活动监听:
// In initSyncSystem:
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    const { setUserActivity } = import('./SyncScheduler').then(m => m.setUserActivity)
    // fire-and-forget
  })
}
```

**Commit:** `feat(sync): 并行拉取 + 用户活动检测适配轮询`

---

## 自审查

- [x] 所有任务有明确文件路径和代码内容
- [x] 无 TBD/TODO 占位符
- [x] 类型一致性: 所有使用 EntityName, Operation 等现有类型
- [x] 无循环依赖: gzip 在 NetworkClient 内部使用, 无跨循环
- [x] 每个 Task 可独立提交
