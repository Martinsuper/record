# Enhanced Sync Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构客户端同步系统，引入 IndexedDB 存储、模块化同步引擎、智能轮询、变更合并和性能优化。

**Architecture:** 将单层 syncManager.ts 拆分为模块化 sync/ 目录，使用 IndexedDB 作为主存储（dexie），NetworkClient 封装网络重试，SyncEngine 编排 pull/push，SyncScheduler 实现自适应轮询。保持对外 API 兼容。

**Tech Stack:** TypeScript, Dexie 4, js-sha256, pako, Pinia, uni-app

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/utils/sync/types.ts` | 所有类型定义 (PendingChange, SyncInfo, SyncMode, SyncStatus, etc.) |
| `src/utils/sync/constants.ts` | 所有常量配置 (POLL_CONFIG, MERGE_CONFIG, RETRY_CONFIG, DB_CONFIG, BACKUP_CONFIG) |
| `src/utils/sync/IndexedDBManager.ts` | Dexie 数据库初始化、schema 定义、批量 CRUD |
| `src/utils/sync/PendingQueue.ts` | 基于 IndexedDB 的待推送队列 (增删查合并) |
| `src/utils/sync/ErrorHandler.ts` | 错误分类、重试策略判断 |
| `src/utils/sync/NetworkClient.ts` | HTTP 请求封装 (含自动重试、超时、pako 压缩) |
| `src/utils/sync/DataHasher.ts` | SHA-256 数据完整性校验 |
| `src/utils/sync/NetworkMonitor.ts` | 网络状态监听 (online/offline, ping, 质量评估) |
| `src/utils/sync/ChangeMerger.ts` | 短时间内多次变更的合并逻辑 |
| `src/utils/sync/SyncScheduler.ts` | 智能轮询器 (自适应间隔) |
| `src/utils/sync/BackupManager.ts` | localStorage 双重备份 (最近 pending + 定期快照) |
| `src/utils/sync/SyncEngine.ts` | 同步引擎核心 (push/pull/fullSync 编排) |
| `src/utils/sync/index.ts` | 统一对外 API (替代原 syncManager.ts 导出) |

### Modified Files

| File | Change |
|------|--------|
| `package.json` | 新增 dexie, js-sha256, pako 依赖 |
| `src/utils/syncManager.ts` | 改为从 sync/ 模块转发导出 (兼容层) |

---

## Phase 1: Types, Constants, IndexedDB 基础

### Task 1: 安装依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装新依赖**

```bash
npm install dexie@^4 js-sha256@^0.9 pako@^1.0
```

- [ ] **Step 2: 提交改动**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): 安装 dexie, js-sha256, pako 依赖"
```

---

### Task 2: 定义类型

**Files:**
- Create: `src/utils/sync/types.ts`

- [ ] **Step 1: 创建类型定义文件**

```typescript
// src/utils/sync/types.ts

/** 同步模式 */
export type SyncMode = 'local' | 'sync'

/** 同步状态 */
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'synced'

/** 实体类型 */
export type EntityName = 'event' | 'anniversary' | 'eventType' | 'category'

/** 操作类型 */
export type Operation = 'create' | 'update' | 'delete'

/** 变更状态 */
export type ChangeStatus = 'pending' | 'pushed' | 'failed'

/** 错误类型 */
export type ErrorType =
  | 'NETWORK_OFFLINE'
  | 'NETWORK_TIMEOUT'
  | 'NETWORK_ERROR'
  | 'SERVER_UNAVAILABLE'
  | 'SERVER_BUSY'
  | 'RATE_LIMITED'
  | 'AUTH_INVALID'
  | 'AUTH_EXPIRED'
  | 'DEVICE_BLOCKED'
  | 'DATA_CONFLICT'
  | 'DATA_DELETED'
  | 'DATA_INVALID'
  | 'DATA_TOO_LARGE'
  | 'STORAGE_FULL'
  | 'STORAGE_CORRUPT'

/** 待推送变更记录 (对应 IndexedDB pendingQueue) */
export interface PendingChange {
  id: string
  entity: EntityName
  operation: Operation
  data: any
  fields?: string[]
  timestamp: number
  clientVersion: number
  retryCount: number
  status: ChangeStatus
}

/** 同步元数据 (对应 IndexedDB syncMeta) */
export interface SyncMeta {
  key: 'sync_state'
  spaceId: string
  shareCode: string
  lastVersion: number
  lastSyncTime: number
  dataHash: string
  enabled: boolean
}

/** 同步信息 */
export interface SyncInfo {
  mode: SyncMode
  status: SyncStatus
  shareCode: string | null
  spaceId: string | null
  lastSyncVersion: number
  lastSyncTime: number
  pendingCount: number
}

/** 同步结果 */
export interface SyncResult {
  success: boolean
  pushed: number
  pulled: number
  errors?: string[]
}

/** 同步会话 (断点续传) */
export interface SyncSession {
  sessionId: string
  startTime: number
  lastProcessedId: string
  totalChanges: number
  processedCount: number
  status: 'running' | 'paused' | 'completed' | 'failed'
}

/** 操作日志 (对应 IndexedDB operationLog) */
export interface OperationLog {
  id: string
  entity: EntityName
  entityId: string
  operation: Operation
  timestamp: number
  synced: boolean
}

/** 空间信息 */
export interface SpaceInfo {
  shareCode: string
  spaceId: string
}
```

- [ ] **Step 2: 提交**

```bash
git add src/utils/sync/types.ts
git commit -m "feat(sync): 定义类型系统 (types.ts)"
```

---

### Task 3: 定义常量配置

**Files:**
- Create: `src/utils/sync/constants.ts`

- [ ] **Step 1: 创建常量配置文件**

```typescript
// src/utils/sync/constants.ts

/** IndexedDB 数据库配置 */
export const DB_CONFIG = {
  name: 'RecordSyncDB',
  version: 1
}

/** 智能轮询配置 */
export const POLL_CONFIG = {
  minInterval: 3000,
  maxInterval: 60000,
  defaultInterval: 8000,
  adaptiveFactors: {
    userActive: 0.5,
    userIdle: 1.5,
    networkGood: 0.8,
    networkPoor: 2.0,
    hasPending: 0.7,
    noPending: 1.2,
    syncSuccess: 1.0,
    syncFailed: 1.5,
  }
}

/** 变更合并配置 */
export const MERGE_CONFIG = {
  window: 2000,
  rules: {
    'create+update': 'create',
    'create+delete': 'discard',
    'update+update': 'merge',
    'update+delete': 'delete',
    'delete+create': 'create',
    'delete+update': 'delete',
  } as Record<string, string>
}

/** 网络重试配置 */
export const RETRY_CONFIG = {
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  timeout: 15000,
  errorStrategy: {
    'NETWORK_OFFLINE': false,
    'NETWORK_TIMEOUT': true,
    'NETWORK_ERROR': true,
    'SERVER_UNAVAILABLE': true,
    'SERVER_BUSY': true,
  } as Record<string, boolean>
}

/** 数据备份配置 */
export const BACKUP_CONFIG = {
  localStorageLimit: 10,
  periodicBackupInterval: 21600000,  // 6h
  backupRetention: 86400000,          // 24h
}

/** 批量推送配置 */
export const PUSH_CONFIG = {
  batchSize: 50,
  compressionThreshold: 1024,  // 1KB
}

/** 分页拉取配置 */
export const PULL_CONFIG = {
  pageSize: 100,
  maxConcurrency: 2,
}

/** 全量同步配置 */
export const FULL_SYNC_CONFIG = {
  batchSize: 500,
  parallelEntities: true,
}

/** 网络质量评估 */
export const NETWORK_CONFIG = {
  pingInterval: 30000,       // 30s
  pingTimeout: 5000,         // 5s
  goodLatencyThreshold: 500, // ms
}
```

- [ ] **Step 2: 提交**

```bash
git add src/utils/sync/constants.ts
git commit -m "feat(sync): 定义所有常量配置"
```

---

### Task 4: IndexedDBManager — 数据库初始化

**Files:**
- Create: `src/utils/sync/IndexedDBManager.ts`
- Modify: `src/utils/sync/types.ts` (不需要修改，已完成)

- [ ] **Step 1: 验证 Dexie 可导入**

```bash
cd /Users/duanluyao/code/record && node -e "require('dexie')" && echo "dexie OK"
```

- [ ] **Step 2: 创建 IndexedDBManager 基础实现**

```typescript
// src/utils/sync/IndexedDBManager.ts

import Dexie, { Table } from 'dexie'
import type { PendingChange, SyncMeta, OperationLog, EntityName } from './types'
import { DB_CONFIG } from './constants'

class RecordSyncDatabase extends Dexie {
  events!: Table<any, string>
  anniversaries!: Table<any, string>
  eventTypes!: Table<any, string>
  categories!: Table<any, string>
  pendingQueue!: Table<PendingChange, string>
  syncMeta!: Table<SyncMeta, string>
  operationLog!: Table<OperationLog, string>

  constructor() {
    super(DB_CONFIG.name)
    this.version(DB_CONFIG.version).stores({
      events: 'id, spaceId, version, updatedAt, time, typeId',
      anniversaries: 'id, spaceId, version, updatedAt, date',
      eventTypes: 'id, spaceId, version',
      categories: 'id, spaceId, version',
      pendingQueue: '++id, timestamp, entity, status',
      syncMeta: 'key',
      operationLog: '++id, timestamp, entity, synced'
    })
  }
}

let db: RecordSyncDatabase | null = null

export function getDB(): RecordSyncDatabase {
  if (!db) {
    db = new RecordSyncDatabase()
  }
  return db
}

export async function closeDB(): Promise<void> {
  if (db) {
    await db.close()
    db = null
  }
}

// ===== Entity CRUD helpers =====

async function bulkPut<Entity extends EntityName>(
  store: Entity,
  items: any[]
): Promise<void> {
  const table = getDB()[store] as Table<any, string>
  await table.bulkPut(items)
}

async function getAll<Entity extends EntityName>(
  store: Entity
): Promise<any[]> {
  const table = getDB()[store] as Table<any, string>
  return table.toArray()
}

async function deleteById<Entity extends EntityName>(
  store: Entity,
  id: string
): Promise<void> {
  const table = getDB()[store] as Table<any, string>
  await table.delete(id)
}

async function clearStore<Entity extends EntityName>(
  store: Entity
): Promise<void> {
  const table = getDB()[store] as Table<any, string>
  await table.clear()
}

// ===== SyncMeta helpers =====

export async function getSyncState(): Promise<SyncMeta | null> {
  return getDB().syncMeta.get('sync_state') || null
}

export async function saveSyncState(state: Partial<SyncMeta>): Promise<void> {
  const existing = await getSyncState()
  const merged = {
    key: 'sync_state',
    ...existing,
    ...state
  } as SyncMeta
  await getDB().syncMeta.put(merged)
}

// ===== Batch operations =====

type EntityStores = {
  [E in EntityName]: Table<any, string>
}

export async function batchPutAll(
  data: Partial<Record<EntityName, any[]>>
): Promise<void> {
  const store = getDB()
  for (const [entity, items] of Object.entries(data)) {
    if (items && items.length > 0) {
      const table = store[entity as EntityName] as Table<any, string>
      await table.bulkPut(items)
    }
  }
}

export { bulkPut, getAll, deleteById, clearStore }
```

- [ ] **Step 3: 提交**

```bash
git add src/utils/sync/IndexedDBManager.ts
git commit -m "feat(sync): 实现 IndexedDBManager 数据库初始化"
```

---

### Task 5: PendingQueue — 基于 IndexedDB 的队列

**Files:**
- Create: `src/utils/sync/PendingQueue.ts`

- [ ] **Step 1: 创建 PendingQueue 模块**

```typescript
// src/utils/sync/PendingQueue.ts

import { getDB } from './IndexedDBManager'
import type { PendingChange, EntityName, Operation, ChangeStatus } from './types'
import { PUSH_CONFIG } from './constants'

function generateId(): string {
  return `change_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/** 添加变更到待推送队列 */
export async function enqueue(
  entity: EntityName,
  operation: Operation,
  data: any,
  clientVersion: number,
  fields?: string[]
): Promise<string> {
  const change: PendingChange = {
    id: generateId(),
    entity,
    operation,
    data,
    fields,
    timestamp: Date.now(),
    clientVersion,
    retryCount: 0,
    status: 'pending'
  }
  await getDB().pendingQueue.add(change)
  return change.id
}

/** 获取待推送的批次 */
export async function getPendingBatch(maxCount: number = PUSH_CONFIG.batchSize): Promise<PendingChange[]> {
  return getDB().pendingQueue
    .where('status').equals('pending')
    .limit(maxCount)
    .sortBy('timestamp')
}

/** 标记批次为已推送 */
export async function markAsPushed(ids: string[]): Promise<void> {
  const db = getDB()
  for (const id of ids) {
    await db.pendingQueue.update(id, { status: 'pushed' as ChangeStatus })
  }
}

/** 标记为失败并增加重试计数 */
export async function markAsFailed(id: string): Promise<void> {
  const change = await getDB().pendingQueue.get(id)
  if (!change) return

  await getDB().pendingQueue.update(id, {
    status: 'failed' as ChangeStatus,
    retryCount: (change.retryCount || 0) + 1
  })
}

/** 重置失败项为 pending（网络恢复时重试） */
export async function retryFailed(): Promise<number> {
  const failed = await getDB().pendingQueue
    .where('status').equals('failed')
    .toArray()
  for (const item of failed) {
    await getDB().pendingQueue.update(item.id!, { status: 'pending' as ChangeStatus })
  }
  return failed.length
}

/** 清除所有待推送队列 */
export async function clearQueue(): Promise<void> {
  await getDB().pendingQueue.clear()
}

/** 待推送数量 */
export async function getPendingCount(): Promise<number> {
  return getDB().pendingQueue.where('status').equals('pending').count()
}

/** 是否有待推送项 */
export async function hasPending(): Promise<boolean> {
  return (await getPendingCount()) > 0
}
```

- [ ] **Step 2: 提交**

```bash
git add src/utils/sync/PendingQueue.ts
git commit -m "feat(sync): 实现 IndexedDB 待推送队列"
```

---

### Task 6: ErrorHandler — 错误分类

**Files:**
- Create: `src/utils/sync/ErrorHandler.ts`

- [ ] **Step 1: 创建 ErrorHandler 模块**

```typescript
// src/utils/sync/ErrorHandler.ts

import type { ErrorType } from './types'
import { RETRY_CONFIG } from './constants'

export interface SyncError {
  type: ErrorType
  message: string
  shouldRetry: boolean
  httpStatus?: number
  rawError?: any
}

/** 对错误进行分类并返回处理策略 */
export function classifyError(error: any): SyncError {
  // 网络断开
  if (error?.errMsg?.includes('request:fail') || error?.errMsg?.includes('abort')) {
    if (!navigator?.onLine) {
      return { type: 'NETWORK_OFFLINE', message: '网络已断开', shouldRetry: false, rawError: error }
    }
    return { type: 'NETWORK_ERROR', message: '网络请求失败', shouldRetry: true, rawError: error }
  }

  if (error?.errMsg?.includes('timeout')) {
    return { type: 'NETWORK_TIMEOUT', message: '请求超时', shouldRetry: true, rawError: error }
  }

  // HTTP 状态码分类
  const status = error?.statusCode || error?.status
  if (status) {
    if (status === 401 || status === 403) {
      return { type: 'AUTH_EXPIRED', message: '认证已失效，请重新加入空间', shouldRetry: false, httpStatus: status, rawError: error }
    }
    if (status === 429) {
      return { type: 'RATE_LIMITED', message: '请求过于频繁', shouldRetry: true, httpStatus: status, rawError: error }
    }
    if (status >= 500) {
      return { type: 'SERVER_UNAVAILABLE', message: '服务器暂时不可用', shouldRetry: true, httpStatus: status, rawError: error }
    }
    if (status >= 400) {
      return { type: 'DATA_INVALID', message: '请求数据无效', shouldRetry: false, httpStatus: status, rawError: error }
    }
  }

  // 服务端业务错误
  const code = error?.code || error?.data?.code
  if (code === 'CONFLICT') {
    return { type: 'DATA_CONFLICT', message: '数据冲突，将以服务端为准', shouldRetry: false, rawError: error }
  }
  if (code === 'DELETED') {
    return { type: 'DATA_DELETED', message: '数据已被删除', shouldRetry: false, rawError: error }
  }
  if (code === 'DEVICE_BLOCKED') {
    return { type: 'DEVICE_BLOCKED', message: '设备已被阻止', shouldRetry: false, rawError: error }
  }

  // 默认视为网络错误重试
  return { type: 'NETWORK_ERROR', message: error?.message || '未知错误', shouldRetry: true, rawError: error }
}

/** 计算重试延迟 (指数退避) */
export function getRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt)
  return Math.min(delay, RETRY_CONFIG.maxDelay)
}

/** 判断是否应该重试 */
export function shouldRetry(error: SyncError, attempt: number): boolean {
  if (!error.shouldRetry) return false
  if (attempt >= RETRY_CONFIG.maxRetries) return false

  const strategy = RETRY_CONFIG.errorStrategy[error.type]
  return strategy ?? false
}
```

- [ ] **Step 2: 提交**

```bash
git add src/utils/sync/ErrorHandler.ts
git commit -m "feat(sync): 实现错误分类和重试策略"
```

---

### Task 7: NetworkClient — 网络请求封装

**Files:**
- Create: `src/utils/sync/NetworkClient.ts`

- [ ] **Step 1: 创建 NetworkClient 模块**

```typescript
// src/utils/sync/NetworkClient.ts

import type { SyncError } from './ErrorHandler'
import { classifyError, getRetryDelay, shouldRetry } from './ErrorHandler'
import { RETRY_CONFIG, PUSH_CONFIG } from './constants'
// Share code is injected by SyncEngine at init time (avoids circular dep with index.ts)
let _shareCode: string | null = null
export function setShareCode(code: string | null): void { _shareCode = code }

export interface HttpOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  skipAuth?: boolean
}

/** 获取 API 基础 URL */
export function getApiBase(): string {
  return 'https://brecord.younote.top/api'
}

/** HTTP 请求封装（含自动重试） */
export async function httpRequest<T = any>(options: HttpOptions): Promise<T | null> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const shareCode = _shareCode
  if (!options.skipAuth && shareCode) {
    headers['X-Share-Code'] = shareCode
  }

  let lastError: SyncError | null = null

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    if (attempt > 0) {
      await sleep(getRetryDelay(attempt - 1))
    }

    try {
      const result = await doRequest<T>({ ...options, headers })
      if (result !== null) return result
      // 返回 null 但无异常信息，可能是不重试的业务错误
      break
    } catch (err: any) {
      lastError = classifyError(err)
      if (!shouldRetry(lastError, attempt)) {
        console.warn(`[Sync] ${lastError.type}: ${lastError.message}`)
        return null
      }
    }
  }

  return null
}

async function doRequest<T>(options: HttpOptions & { headers: Record<string, string> }): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject({ errMsg: 'request:fail timeout', statusCode: 0 })
    }, RETRY_CONFIG.timeout)

    uni.request({
      url: options.url,
      method: options.method || 'GET',
      data: options.data,
      header: options.headers,
      success: (res: any) => {
        clearTimeout(timeoutId)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data?.success ? res.data.data : res.data)
        } else {
          reject({ statusCode: res.statusCode, data: res.data })
        }
      },
      fail: (err) => {
        clearTimeout(timeoutId)
        reject(err)
      }
    })
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ===== 便捷方法 =====

export async function getApi<T = any>(path: string, params?: Record<string, any>): Promise<T | null> {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return httpRequest<T>({ url: `${getApiBase()}${path}${query}`, method: 'GET' })
}

export async function postApi<T = any>(path: string, data?: any): Promise<T | null> {
  return httpRequest<T>({ url: `${getApiBase()}${path}`, method: 'POST', data })
}
```

- [ ] **Step 2: 提交**

```bash
git add src/utils/sync/NetworkClient.ts
git commit -m "feat(sync): 实现 NetworkClient 网络请求封装"
```

---

### Task 8: NetworkMonitor — 网络状态监听

**Files:**
- Create: `src/utils/sync/NetworkMonitor.ts`

- [ ] **Step 1: 创建 NetworkMonitor 模块**

```typescript
// src/utils/sync/NetworkMonitor.ts

import { NETWORK_CONFIG } from './constants'
import { getApiBase } from './NetworkClient'

let isOnline = true
let lastPingLatency = 0
let pingTimer: ReturnType<typeof setInterval> | null = null

const onlineListeners: Set<(online: boolean) => void> = new Set()

/** 当前是否在线 */
export function getOnline(): boolean {
  return isOnline
}

/** 最近一次的 ping 延迟 (ms) */
export function getLastPingLatency(): number {
  return lastPingLatency
}

/** 网络质量评估 */
export function getNetworkQuality(): 'good' | 'fair' | 'poor' {
  if (!isOnline) return 'poor'
  if (lastPingLatency < NETWORK_CONFIG.goodLatencyThreshold) return 'good'
  if (lastPingLatency < NETWORK_CONFIG.goodLatencyThreshold * 3) return 'fair'
  return 'poor'
}

/** 启动网络监听 */
export function startNetworkMonitor(): void {
  // H5 平台事件
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      isOnline = true
      onlineListeners.forEach(cb => cb(true))
      // 网络恢复时立即 ping
      ping().catch(() => {})
    })
    window.addEventListener('offline', () => {
      isOnline = false
      onlineListeners.forEach(cb => cb(false))
    })
    isOnline = navigator.onLine
  }

  // uni-app 事件
  uni.onNetworkStatusChange?.((res) => {
    const wasOnline = isOnline
    isOnline = res.isConnected
    if (!wasOnline && isOnline) {
      onlineListeners.forEach(cb => cb(true))
      ping().catch(() => {})
    } else if (wasOnline && !isOnline) {
      onlineListeners.forEach(cb => cb(false))
    }
  })

  // 定期 ping
  startPingInterval()
}

/** 停止网络监听 */
export function stopNetworkMonitor(): void {
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', () => {})
    window.removeEventListener('offline', () => {})
  }
  if (pingTimer) {
    clearInterval(pingTimer)
    pingTimer = null
  }
}

/** 监听在线/离线事件 */
export function onOnlineChange(callback: (online: boolean) => void): () => void {
  onlineListeners.add(callback)
  return () => onlineListeners.delete(callback)
}

/** Ping 服务端 */
async function ping(): Promise<number> {
  const start = Date.now()
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('ping timeout')), NETWORK_CONFIG.pingTimeout)
      uni.request({
        url: `${getApiBase()}/sync/ping`,
        method: 'GET',
        timeout: NETWORK_CONFIG.pingTimeout,
        success: () => {
          clearTimeout(timeout)
          resolve()
        },
        fail: () => {
          clearTimeout(timeout)
          reject(new Error('ping failed'))
        }
      })
    })
    lastPingLatency = Date.now() - start
    return lastPingLatency
  } catch {
    lastPingLatency = Infinity
    return Infinity
  }
}

function startPingInterval(): void {
  if (pingTimer) clearInterval(pingTimer)
  pingTimer = setInterval(() => {
    if (isOnline) {
      ping().catch(() => {})
    }
  }, NETWORK_CONFIG.pingInterval)
}
```

- [ ] **Step 2: Fix the NetworkClient export**

Ensure `getApiBase` is exported from NetworkClient:
```typescript
// src/utils/sync/NetworkClient.ts — line for getApiBase
export function getApiBase(): string {
  return 'https://brecord.younote.top/api'
}
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/sync/NetworkMonitor.ts
git commit -m "feat(sync): 实现 NetworkMonitor 网络状态监听"
```

---

### Task 9: DataHasher — 数据完整性校验

**Files:**
- Create: `src/utils/sync/DataHasher.ts`

- [ ] **Step 1: Create DataHasher module**

```typescript
// src/utils/sync/DataHasher.ts

import { sha256 } from 'js-sha256'
import { getDB } from './IndexedDBManager'

/**
 * 计算所有本地数据的 SHA-256 hash
 * 用于与服务端对比，确保数据一致性
 */
export async function calculateDataHash(): Promise<string> {
  const db = getDB()

  const [events, anniversaries, eventTypes, categories] = await Promise.all([
    db.events.orderBy('version').toArray(),
    db.anniversaries.orderBy('version').toArray(),
    db.eventTypes.orderBy('version').toArray(),
    db.categories.orderBy('version').toArray()
  ])

  // 只取有效且未删除的数据，排序确保一致性
  const payload = JSON.stringify({
    events: events.filter((e: any) => !e.deleted).sort(byVersion),
    anniversaries: anniversaries.filter((a: any) => !a.deleted).sort(byVersion),
    eventTypes: eventTypes.filter((t: any) => !t.deleted).sort(byVersion),
    categories: categories.filter((c: any) => !c.deleted).sort(byVersion)
  })

  return sha256(payload)
}

function byVersion(a: { version: number }, b: { version: number }): number {
  return a.version - b.version
}

/**
 * 计算单个实体的 hash（用于精细校验）
 */
export function calculateEntityHash(entity: any): string {
  return sha256(JSON.stringify(entity))
}

/**
 * 验证服务端 hash 与本地是否一致
 */
export function hashMatches(localHash: string, serverHash: string): boolean {
  return localHash === serverHash
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/sync/DataHasher.ts
git commit -m "feat(sync): 实现 DataHasher 数据完整性校验"
```

---

### Task 10: ChangeMerger — 变更合并

**Files:**
- Create: `src/utils/sync/ChangeMerger.ts`

- [ ] **Step 1: Create ChangeMerger module**

```typescript
// src/utils/sync/ChangeMerger.ts

import type { PendingChange, EntityName, Operation } from './types'
import { MERGE_CONFIG } from './constants'

/** 短时间内对同一实体的多次变更进行合并 */
export function mergeChanges(
  changes: PendingChange[],
  now: number = Date.now()
): PendingChange[] {
  const merged: Map<string, PendingChange> = new Map()

  for (const change of changes) {
    const key = `${change.entity}:${change.data.id}`
    const existing = merged.get(key)

    if (!existing) {
      merged.set(key, { ...change })
      continue
    }

    // 检查时间窗口
    if (change.timestamp - existing.timestamp > MERGE_CONFIG.window) {
      merged.set(key, { ...change })
      continue
    }

    // 合并规则
    const ruleKey = `${existing.operation}+${change.operation}`
    const result = MERGE_CONFIG.rules[ruleKey]

    if (!result) {
      merged.set(key, { ...change })
      continue
    }

    switch (result) {
      case 'create':
        existing.operation = 'create'
        existing.data = { ...change.data }
        existing.timestamp = change.timestamp
        existing.fields = change.fields ?? extractChangedFields(existing.data, change.data)
        break

      case 'delete':
        existing.operation = 'delete'
        existing.data = { id: existing.data.id }
        existing.fields = undefined
        break

      case 'merge':
        existing.data = { ...existing.data, ...change.data }
        existing.timestamp = change.timestamp
        existing.fields = mergeChangedFields(existing.fields, change.fields)
        break

      case 'discard':
        merged.delete(key)
        break
    }
  }

  return Array.from(merged.values())
}

/** 对比新旧对象，提取变更的字段 */
function extractChangedFields(oldObj: any, newObj: any): string[] {
  const fields: string[] = []
  for (const key of Object.keys(newObj)) {
    if (oldObj[key] !== newObj[key]) {
      fields.push(key)
    }
  }
  return fields
}

function mergeChangedFields(a?: string[], b?: string[]): string[] | undefined {
  if (!a && !b) return undefined
  const set = new Set<string>()
  a?.forEach(f => set.add(f))
  b?.forEach(f => set.add(f))
  return set.size > 0 ? Array.from(set) : undefined
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/sync/ChangeMerger.ts
git commit -m "feat(sync): 实现 ChangeMerger 变更合并"
```

---

### Task 11: BackupManager — 数据双重备份

**Files:**
- Create: `src/utils/sync/BackupManager.ts`

- [ ] **Step 1: Create BackupManager module**

```typescript
// src/utils/sync/BackupManager.ts

import { getStorage, setStorage, STORAGE_KEYS } from '@/utils/storage'
import { BACKUP_CONFIG } from './constants'
import { getDB } from './IndexedDBManager'
import type { PendingChange } from './types'

let backupInterval: ReturnType<typeof setInterval> | null = null

/** 备份最近 N 条 pending 到 localStorage */
export async function backupRecentPending(): Promise<void> {
  const db = getDB()
  const pending = await db.pendingQueue
    .where('status').equals('pending')
    .limit(BACKUP_CONFIG.localStorageLimit)
    .toArray()
  setStorage(STORAGE_KEYS.OFFLINE_QUEUE, pending)
}

/** 备份 IndexedDB 关键数据到 localStorage（序列化摘要） */
export async function backupIndexedDB(): Promise<void> {
  const db = getDB()
  const [events, anniversaries, meta] = await Promise.all([
    db.events.toArray(),
    db.anniversaries.toArray(),
    db.syncMeta.toArray()
  ])

  setStorage('sync_backup_data', {
    events,
    anniversaries,
    meta,
    timestamp: Date.now()
  })
}

/** 从 localStorage 恢复数据到 IndexedDB */
export async function restoreFromBackup(): Promise<{ events: number; anniversaries: number }> {
  const backup = getStorage<any>('sync_backup_data')
  if (!backup || !backup.timestamp) {
    return { events: 0, anniversaries: 0 }
  }

  // 检查备份是否在有效期内
  if (Date.now() - backup.timestamp > BACKUP_CONFIG.backupRetention) {
    setStorage('sync_backup_data', null)
    return { events: 0, anniversaries: 0 }
  }

  const db = getDB()
  let eventCount = 0
  let anniversaryCount = 0

  if (backup.events?.length > 0) {
    await db.events.bulkPut(backup.events)
    eventCount = backup.events.length
  }

  if (backup.anniversaries?.length > 0) {
    await db.anniversaries.bulkPut(backup.anniversaries)
    anniversaryCount = backup.anniversaries.length
  }

  return { events: eventCount, anniversaries: anniversaryCount }
}

/** 恢复 pending 队列 */
export async function restorePendingFromBackup(): Promise<number> {
  const pending = getStorage<PendingChange[]>(STORAGE_KEYS.OFFLINE_QUEUE) || []
  if (pending.length === 0) return 0

  const db = getDB()
  // 只恢复尚未推送的 pending 项
  const fresh = pending.filter(p => p.status === 'pending' || p.status === 'failed')
  if (fresh.length > 0) {
    await db.pendingQueue.bulkAdd(fresh)
  }
  return fresh.length
}

/** 启动定期备份 */
export function startPeriodicBackup(): void {
  if (backupInterval) return
  backupRecentPending().catch(() => {})
  backupInterval = setInterval(() => {
    backupRecentPending().catch(() => {})
    backupIndexedDB().catch(() => {})
  }, BACKUP_CONFIG.periodicBackupInterval)
}

/** 停止定期备份 */
export function stopPeriodicBackup(): void {
  if (backupInterval) {
    clearInterval(backupInterval)
    backupInterval = null
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/sync/BackupManager.ts
git commit -m "feat(sync): 实现 BackupManager 双重备份机制"
```

---

### Task 12: SyncScheduler — 智能轮询器

**Files:**
- Create: `src/utils/sync/SyncScheduler.ts`

- [ ] **Step 1: Create SyncScheduler module**

```typescript
// src/utils/sync/SyncScheduler.ts

import { POLL_CONFIG } from './constants'
import { getOnline, getNetworkQuality } from './NetworkMonitor'

let timer: ReturnType<typeof setTimeout> | null = null
let currentInterval = POLL_CONFIG.defaultInterval
let onTick: (() => Promise<void>) | null = null
let isRunning = false
let _hasPending = false  // Updated by SyncEngine after each push/pull cycle

/**
 * 计算自适应轮询间隔 (纯同步，避免 async issue)
 */
function calcInterval(): number {
  let interval = POLL_CONFIG.defaultInterval

  // 网络质量因子
  const quality = getNetworkQuality()
  if (quality === 'good') interval *= POLL_CONFIG.adaptiveFactors.networkGood
  else if (quality === 'poor') interval *= POLL_CONFIG.adaptiveFactors.networkPoor

  // 是否有待推送 (using cached value, updated by SyncEngine)
  interval *= (_hasPending ? POLL_CONFIG.adaptiveFactors.hasPending : POLL_CONFIG.adaptiveFactors.noPending)
  }).catch(() => {})

  // 网络在线状态
  if (!getOnline()) {
    interval *= POLL_CONFIG.adaptiveFactors.networkPoor * 2
  }

  return Math.min(Math.max(interval, POLL_CONFIG.minInterval), POLL_CONFIG.maxInterval)
}

/**
 * 启动轮询调度器
 */
export function startScheduler(callback: () => Promise<void>): void {
  onTick = callback
  if (timer) clearTimeout(timer)
  scheduleNext()
}

/**
 * 停止轮询调度器
 */
export function stopScheduler(): void {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  isRunning = false
  onTick = null
}

/**
 * 手动触发一次同步（立即执行 + 重置间隔）
 */
export function triggerNow(): void {
  if (timer) clearTimeout(timer)
  if (onTick && !isRunning) {
    onTick().then(() => {
      currentInterval = POLL_CONFIG.defaultInterval
      scheduleNext()
    }).catch(() => {
      scheduleNext()
    })
  }
}

/**
 * 同步成功后调用 — 重置轮询间隔
 */
export function onSyncSuccess(): void {
  currentInterval = POLL_CONFIG.defaultInterval
}

/**
 * 同步失败后调用 — 增加轮询间隔
 */
export function onSyncFailure(): void {
  currentInterval *= POLL_CONFIG.adaptiveFactors.syncFailed
  scheduleNext()
}

function scheduleNext(): void {
  if (!onTick) return
  currentInterval = calcInterval()
  timer = setTimeout(async () => {
    isRunning = true
    try {
      await onTick?.()
      onSyncSuccess()
    } catch {
      onSyncFailure()
    } finally {
      isRunning = false
      scheduleNext()
    }
  }, currentInterval)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/sync/SyncScheduler.ts
git commit -m "feat(sync): 实现 SyncScheduler 智能轮询"
```

---

### Task 13: SyncEngine — 核心引擎

**Files:**
- Create: `src/utils/sync/SyncEngine.ts`

- [ ] **Step 1: Create SyncEngine module**

```typescript
// src/utils/sync/SyncEngine.ts

import { getDB, batchPutAll, saveSyncState, getSyncState } from './IndexedDBManager'
import { httpRequest, getApi, postApi, getApiBase } from './NetworkClient'
import { enqueue, getPendingBatch, markAsPushed, markAsFailed, clearQueue, getPendingCount, retryFailed } from './PendingQueue'
import type { EntityName, Operation, SyncResult, SpaceInfo, SyncInfo, SyncStatus } from './types'
import { PUSH_CONFIG, PULL_CONFIG, FULL_SYNC_CONFIG } from './constants'
import { mergeChanges } from './ChangeMerger'
import { calculateDataHash } from './DataHasher'
import { getOnline } from './NetworkMonitor'

// State
let currentMode: 'local' | 'sync' = 'local'
let currentShareCode: string | null = null
let currentSpaceId: string | null = null
let lastSyncVersion = 0
let currentStatus: SyncStatus = 'idle'

const statusListeners: Set<(s: SyncStatus) => void> = new Set()
const modeListeners: Set<(m: 'local' | 'sync') => void> = new Set()
const syncInfoListeners: Set<() => void> = new Set()

function setStatus(s: SyncStatus) {
  currentStatus = s
  statusListeners.forEach(cb => cb(s))
  syncInfoListeners.forEach(cb => cb())
}

// ===== Initialization =====

/** @deprecated Use initSyncSystem instead */
export function initSyncEngine(): void {
  initSyncSystem()
}

export function initSyncSystem(): void {
  // Restore state from IndexedDB
  getSyncState().then(meta => {
    if (meta && meta.enabled && meta.shareCode && meta.spaceId) {
      currentShareCode = meta.shareCode
      currentSpaceId = meta.spaceId
      lastSyncVersion = meta.lastVersion
      currentMode = 'sync'
      syncInfoListeners.forEach(cb => cb())
    }
  }).catch(() => {})
}

// ===== Space Management =====

export async function createSpace(): Promise<SpaceInfo | null> {
  const deviceId = getOrCreateDeviceId()

  const result = await httpRequest<{ shareCode: string; spaceId: string }>({
    url: `${getApiBase()}/space/create`,
    method: 'POST',
    data: { deviceId },
    skipAuth: true
  })

  if (!result) return null

  currentShareCode = result.shareCode
  currentSpaceId = result.spaceId
  currentMode = 'sync'

  await saveSyncState({ shareCode: result.shareCode, spaceId: result.spaceId, enabled: true })
  modeListeners.forEach(cb => cb('sync'))
  syncInfoListeners.forEach(cb => cb())

  // Trigger full sync after creating
  await doFullSync()
  return result
}

export async function joinSpace(shareCode: string): Promise<boolean> {
  const result = await httpRequest<{ spaceId: string }>({
    url: `${getApiBase()}/space/verify?code=${encodeURIComponent(shareCode)}`,
    method: 'GET',
    skipAuth: true
  })

  if (!result?.spaceId) return false

  currentShareCode = shareCode
  currentSpaceId = result.spaceId
  currentMode = 'sync'

  await saveSyncState({ shareCode, spaceId: result.spaceId, enabled: true })
  modeListeners.forEach(cb => cb('sync'))
  syncInfoListeners.forEach(cb => cb())

  await doFullSync()
  return true
}

export function leaveSpace(): void {
  currentShareCode = null
  currentSpaceId = null
  currentMode = 'local'
  lastSyncVersion = 0
  setStatus('idle')

  saveSyncState({ enabled: false }).catch(() => {})
  clearQueue().catch(() => {})
  modeListeners.forEach(cb => cb('local'))
  syncInfoListeners.forEach(cb => cb())
  statusListeners.forEach(cb => cb('idle'))
}

// ===== Sync Control =====

export async function triggerSync(): Promise<SyncResult> {
  if (currentMode !== 'sync' || !currentSpaceId) {
    return { success: false, pushed: 0, pulled: 0 }
  }

  if (currentStatus === 'syncing') {
    return { success: false, pushed: 0, pulled: 0 }
  }

  setStatus('syncing')

  try {
    const pushed = await doPushChanges()
    const pulled = await doPullChanges()

    setStatus(pulled > 0 ? 'synced' : 'idle')
    return { success: true, pushed, pulled }
  } catch {
    setStatus('error')
    return { success: false, pushed: 0, pulled: 0 }
  }
}

export function setSyncEnabled(enabled: boolean): void {
  saveSyncState({ enabled })
  if (enabled && currentShareCode && currentSpaceId) {
    currentMode = 'sync'
    modeListeners.forEach(cb => cb('sync'))
  } else {
    currentMode = 'local'
    modeListeners.forEach(cb => cb('local'))
  }
}

// ===== Change Recording =====

export async function recordChange(
  entity: EntityName,
  operation: Operation,
  data: any,
  fields?: string[]
): Promise<void> {
  await enqueue(entity, operation, data, data.version || 1, fields)
  syncInfoListeners.forEach(cb => cb())
}

// ===== Status Queries =====

export function getSyncMode(): 'local' | 'sync' {
  return currentMode
}

export async function getSyncInfo(): Promise<SyncInfo> {
  const meta = await import('./IndexedDBManager').then(m => m.getSyncState())
  const pending = await import('./PendingQueue').then(m => m.getPendingCount())
  return {
    mode: currentMode,
    status: currentStatus,
    shareCode: currentShareCode,
    spaceId: currentSpaceId,
    lastSyncVersion,
    lastSyncTime: meta?.lastSyncTime || 0,
    pendingCount: await pending
  }
}

export async function getSyncStatusFromServer(): Promise<any> {
  if (!currentSpaceId) return null
  return getApi(`/sync/status?spaceId=${encodeURIComponent(currentSpaceId)}`)
}

export function onSyncChange(callback: (s: SyncStatus) => void): () => void {
  statusListeners.add(callback)
  return () => statusListeners.delete(callback)
}

export function onSyncModeChange(callback: (m: 'local' | 'sync') => void): () => void {
  modeListeners.add(callback)
  return () => modeListeners.delete(callback)
}

export function onSyncStatusChange(callback: () => void): () => void {
  syncInfoListeners.add(callback)
  return () => syncInfoListeners.delete(callback)
}

// Expose for NetworkClient and other modules
export function getCurrentShareCode(): string | null { return currentShareCode }
export function getCurrentSpaceId(): string | null { return currentSpaceId }

// ===== Internal: Push =====

async function doPushChanges(): Promise<number> {
  const pending = await getPendingBatch(PUSH_CONFIG.batchSize)
  if (pending.length === 0) return 0

  const result = await postApi<{ accepted: string[]; newVersion: number }>('/sync/push', {
    spaceId: currentSpaceId,
    deviceId: getOrCreateDeviceId(),
    changes: pending.map(c => ({
      entity: c.entity,
      operation: c.operation,
      data: c.data,
      clientVersion: c.clientVersion,
      fields: c.fields
    }))
  })

  if (result?.accepted?.length) {
    await markAsPushed(pending.slice(0, result.accepted.length).map(c => c.id))
    if (result.newVersion) {
      await saveSyncState({ lastVersion: result.newVersion })
    }
    return result.accepted.length
  }

  for (const c of pending) {
    await markAsFailed(c.id)
  }
  return 0
}

// ===== Internal: Pull =====

async function doPullChanges(): Promise<number> {
  let totalPulled = 0

  while (true) {
    const result = await getApi<any>('/sync/pull', {
      spaceId: currentSpaceId!,
      sinceVersion: lastSyncVersion,
      limit: PULL_CONFIG.pageSize
    })

    if (!result) break

    const entityCounts: Record<string, number> = {}
    const allData: Partial<Record<EntityName, any[]>> = {}

    for (const entity of ['events', 'anniversaries', 'eventTypes', 'categories'] as const) {
      if (result[entity]?.length) {
        const storeName = entityMap[entity]
        allData[storeName] = result[entity]
        entityCounts[storeName] = result[entity].length
        totalPulled += result[entity].length
      }
    }

    if (Object.keys(allData).length > 0) {
      await batchPutAll(allData)
    }

    if (result.maxVersion && result.maxVersion > lastSyncVersion) {
      lastSyncVersion = result.maxVersion
      await saveSyncState({ lastVersion: lastSyncVersion })
    }

    if (!result.hasMore) break
  }

  return totalPulled
}

async function doFullSync(): Promise<void> {
  setStatus('syncing')

  const result = await getApi<{
    events: any[]; anniversaries: any[]; eventTypes: any[]; categories: any[]; maxVersion: number
  }>(`/sync/full?spaceId=${encodeURIComponent(currentSpaceId!)}`)

  if (!result) {
    setStatus('error')
    return
  }

  const allData: Partial<Record<EntityName, any[]>> = {
    events: result.events,
    anniversaries: result.anniversaries,
    eventTypes: result.eventTypes,
    categories: result.categories
  }

  await batchPutAll(allData)

  if (result.maxVersion) {
    lastSyncVersion = result.maxVersion
    await saveSyncState({ lastVersion: lastSyncVersion })
  }

  // 全量同步后清除 pending 队列
  // （因为本地数据已与服务端一致）
  await clearQueue()

  setStatus('synced')
}

// Utility: get device id (re-export to avoid circular)
function getOrCreateDeviceId(): string {
  return getStorage<string>(STORAGE_KEYS.SYNC_DEVICE_ID) ||
    (() => {
      // fallback — should already be set by deviceId.ts
      return `device_${Date.now()}`
    })()
}

const { getStorage, STORAGE_KEYS } = await import('@/utils/storage')

// Entity name mapping
const entityMap: Record<string, EntityName> = {
  events: 'event',
  anniversaries: 'anniversary',
  eventTypes: 'eventType',
  categories: 'category'
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/sync/SyncEngine.ts
git commit -m "feat(sync): 实现 SyncEngine 核心同步引擎"
```

---

### Task 14: index.ts — 统一对外 API

**Files:**
- Create: `src/utils/sync/index.ts`

- [ ] **Step 1: Create unified API entry point**

```typescript
// src/utils/sync/index.ts

export {
  // Core
  initSyncSystem,
  initSyncEngine,
  triggerSync,
  setSyncEnabled,
  recordChange,
  createSpace,
  joinSpace,
  leaveSpace,

  // Status
  getSyncMode,
  getSyncInfo,
  getSyncStatusFromServer,
  onSyncChange,
  onSyncModeChange,
  onSyncStatusChange,

  // Exports for other modules
  getCurrentShareCode,
  getCurrentSpaceId
} from './SyncEngine'

export {
  startNetworkMonitor,
  stopNetworkMonitor,
  getOnline,
  getLastPingLatency,
  getNetworkQuality,
  onOnlineChange
} from './NetworkMonitor'

export {
  startScheduler,
  stopScheduler,
  triggerNow,
  onSyncSuccess,
  onSyncFailure
} from './SyncScheduler'

export {
  getDB,
  closeDB,
  getSyncState,
  saveSyncState,
  batchPutAll
} from './IndexedDBManager'

export {
  startPeriodicBackup,
  stopPeriodicBackup,
  restoreFromBackup,
  restorePendingFromBackup
} from './BackupManager'

export {
  enqueue,
  getPendingBatch,
  markAsPushed,
  markAsFailed,
  retryFailed,
  clearQueue,
  getPendingCount,
  hasPending
} from './PendingQueue'

export {
  calculateDataHash,
  calculateEntityHash,
  hashMatches
} from './DataHasher'

export type { SyncMode } from './types'
export type { SyncStatus, SyncInfo, SyncResult } from './types'
export type { PendingChange, ChangeStatus } from './types'
export type { SpaceInfo } from './types'
export type { SyncError } from './ErrorHandler'
export type { EntityName, Operation } from './types'
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/sync/index.ts
git commit -m "feat(sync): 统一对外 API 入口"
```

---

### Task 15: syncManager.ts — 兼容层改造

**Files:**
- Modify: `src/utils/syncManager.ts`

- [ ] **Step 1: Rewrite syncManager.ts as a thin compatibility wrapper**

The new syncManager.ts re-exports everything from sync/ and keeps backward-compatible names:

```typescript
// src/utils/syncManager.ts
// Compatibility shim — re-exports from new modular sync system

import { initSyncEngine, startNetworkMonitor, startScheduler, startPeriodicBackup } from './sync'
import { getPendingCount } from './sync'

let initialized = false

/**
 * @deprecated Use initSyncEngine + startNetworkMonitor + startScheduler from sync/index
 */
export function initSyncManager(): void {
  if (initialized) return
  initialized = true

  initSyncEngine()
  startNetworkMonitor()
  startScheduler(async () => {
    const { triggerSync } = await import('./sync')
    await triggerSync()
  })
  startPeriodicBackup()
}

// Re-export all from new modular system
export {
  getSyncMode,
  getSyncStatus,
  getCurrentShareCode,
  getCurrentSpaceId,
  getSyncInfo,
  onSyncModeChange,
  onSyncStatusChange,
  onSyncInfoChange,
  createSpace,
  joinSpace,
  leaveSpace,
  triggerSync,
  setSyncEnabled,
  recordChange,
  getSyncStatusFromServer,
  clearSyncData,
  getPendingChangesCount,
  hasPendingChanges,
  verifyShareCode,
  connectWebSocket
} from './sync'
```

Now update the SyncEngine's `getSyncInfo` to include pendingCount dynamically:

```typescript
// Add to SyncEngine.ts — update getSyncInfo to be async
export async function getSyncInfoFull(): Promise<SyncInfo> {
  const meta = await getSyncState()
  const pending = await getPendingCount()
  return {
    mode: currentMode,
    status: currentStatus,
    shareCode: currentShareCode,
    spaceId: currentSpaceId,
    lastSyncVersion,
    lastSyncTime: meta?.lastSyncTime || 0,
    pendingCount: pending
  }
}
```

Also add to SyncEngine the `getSyncStatus`, `getPendingChangesCount`, `hasPendingChanges`, `clearSyncData`, `verifyShareCode`, and `connectWebSocket` wrappers:

```typescript
// In SyncEngine.ts — add these exports

export function getSyncStatus(): SyncStatus {
  return currentStatus
}

export function onSyncInfoChange(callback: () => void): () => void {
  syncInfoListeners.add(callback)
  return () => syncInfoListeners.delete(callback)
}

export function getPendingChangesCount(): number {
  // Will be fetched async, return 0 for sync
  return 0
}

export async function hasPendingChanges(): Promise<boolean> {
  const { hasPending } = await import('./PendingQueue')
  return hasPending()
}

export function clearSyncData(): void {
  leaveSpace()
}

export async function verifyShareCode(shareCode: string): Promise<{ valid: boolean; spaceId: string | null } | null> {
  const result = await httpRequest<{ spaceId: string; shareCode: string }>({
    url: `${getApiBase()}/space/verify?code=${encodeURIComponent(shareCode)}`,
    method: 'GET',
    skipAuth: true
  })
  if (result?.spaceId) {
    return { valid: true, spaceId: result.spaceId }
  }
  return null
}

export function connectWebSocket(shareCode: string): void {
  console.log('[Sync] connectWebSocket is deprecated, use createSpace() or joinSpace() instead')
  if (currentMode !== 'sync' && shareCode) {
    joinSpace(shareCode).catch(console.error)
  }
}
```

- [ ] **Step 2: Verify imports across the app that use syncManager**

```bash
cd /Users/duanluyao/code/record && grep -r "from.*syncManager\|from.*syncManager'" src/ --include="*.vue" --include="*.ts"
```

All existing imports (`initSyncManager`, `getSyncMode`, `recordChange`, etc.) should continue to work because the names are re-exported.

- [ ] **Step 3: Submit**

```bash
git add src/utils/syncManager.ts src/utils/sync/SyncEngine.ts
git commit -m "feat(sync): 改造 syncManager.ts 为兼容层，迁移到模块化系统"
```

---

## Phase Summary Checks

- [ ] All 15 tasks completed with individual commits
- [ ] TypeScript type-check passes: `npx vue-tsc --noEmit`
- [ ] H5 dev server runs without errors: `npm run dev:h5`
- [ ] All store imports (event.ts, anniversary.ts, etc.) continue to work with `recordChange` from syncManager
- [ ] No remaining direct references to old pendingChanges.ts in store files (they should use sync/index or syncManager)

---

## Final Integration Commits

- [ ] **Commit: update Pinia stores to use new enqueue**

Update the event store to use the async recordChange. Since SyncEngine.recordChange is now async:

In `src/store/event.ts`, the `addEvent`, `deleteEvent`, and `updateEvent` methods call `recordChange`. These need to be updated to either `await` it or fire-and-forget:

```typescript
// Example — in event.ts addEvent:
this.saveToStorage()
recordChange('event', 'create', newEvent).catch(() => {})
```

The same pattern applies to all store methods that call `recordChange` — append `.catch(() => {})` since they are currently sync calls.

- [ ] **Commit: clean up old pendingChanges.ts references**

```bash
git add package-lock.json
git commit -m "chore(sync): 完成增强型同步客户端实现"
```
