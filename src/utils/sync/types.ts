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
