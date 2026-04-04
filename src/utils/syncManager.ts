/**
 * HTTP REST + 定时轮询同步管理器
 * 替换 WebSocket 方案为 HTTP REST API + 8秒轮询
 */

import { getStorage, setStorage, removeStorage, STORAGE_KEYS } from './storage'
import { getApiUrl, SYNC_CONFIG } from './config'
import { getOrCreateDeviceId } from './deviceId'
import {
  getPendingChanges,
  addPendingChange,
  clearPendingChanges,
  getBatchChanges,
  removeBatchChanges,
  isPendingEmpty,
  getPendingCount,
  type PendingChange
} from './pendingChanges'
import { useEventStore } from '@/store/event'
import { useAnniversaryStore } from '@/store/anniversary'
import { useEventTypeStore } from '@/store/eventType'
import { useAnniversaryCategoryStore } from '@/store/anniversaryCategory'

// 同步模式
export type SyncMode = 'local' | 'sync'

// 同步状态
type SyncStatus = 'idle' | 'syncing' | 'error'

// 轮询定时器
let pollTimer: ReturnType<typeof setInterval> | null = null
let currentMode: SyncMode = 'local'
let currentStatus: SyncStatus = 'idle'
let currentShareCode: string | null = null
let currentSpaceId: string | null = null
let lastSyncVersion: number = 0

// 状态回调
const modeListeners: Set<(mode: SyncMode) => void> = new Set()
const statusListeners: Set<(status: SyncStatus) => void> = new Set()
const syncInfoListeners: Set<(info: SyncInfo) => void> = new Set()

// 同步信息接口
export interface SyncInfo {
  mode: SyncMode
  status: SyncStatus
  shareCode: string | null
  spaceId: string | null
  lastSyncVersion: number
  lastSyncTime: number
  pendingCount: number
}

// ==================== 基础工具函数 ====================

function getApiBase(): string {
  return getApiUrl()
}

function getDeviceId(): string {
  return getOrCreateDeviceId()
}

// HTTP 请求封装
function httpRequest<T = any>(options: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  skipAuth?: boolean
}): Promise<T | null> {
  return new Promise((resolve) => {
    const header: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (!options.skipAuth && currentShareCode) {
      header['X-Share-Code'] = currentShareCode
    }

    uni.request({
      url: options.url,
      method: options.method || 'GET',
      data: options.data,
      header,
      success: (res: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.data?.success) {
          resolve(res.data.data)
        } else {
          console.error('[Sync] HTTP error:', res.statusCode, res.data)
          resolve(null)
        }
      },
      fail: (err) => {
        console.error('[Sync] HTTP request failed:', err)
        resolve(null)
      }
    })
  })
}

// ==================== 状态管理 ====================

/**
 * 获取当前同步模式
 */
export function getSyncMode(): SyncMode {
  return currentMode
}

/**
 * 获取同步状态
 */
export function getSyncStatus(): SyncStatus {
  return currentStatus
}

/**
 * 获取当前 Share Code
 */
export function getCurrentShareCode(): string | null {
  return currentShareCode
}

/**
 * 获取当前 Space ID
 */
export function getCurrentSpaceId(): string | null {
  return currentSpaceId
}

/**
 * 获取同步信息
 */
export function getSyncInfo(): SyncInfo {
  return {
    mode: currentMode,
    status: currentStatus,
    shareCode: currentShareCode,
    spaceId: currentSpaceId,
    lastSyncVersion,
    lastSyncTime: getStorage<number>(STORAGE_KEYS.SYNC_LAST_SYNC_TIME) || 0,
    pendingCount: getPendingCount()
  }
}

// 监听模式变化
export function onSyncModeChange(callback: (mode: SyncMode) => void): () => void {
  modeListeners.add(callback)
  return () => modeListeners.delete(callback)
}

// 监听状态变化
export function onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
  statusListeners.add(callback)
  return () => statusListeners.delete(callback)
}

// 监听同步信息变化
export function onSyncInfoChange(callback: (info: SyncInfo) => void): () => void {
  syncInfoListeners.add(callback)
  return () => syncInfoListeners.delete(callback)
}

// 触发状态更新
function notifyStatusChange(status: SyncStatus): void {
  currentStatus = status
  statusListeners.forEach(cb => cb(status))
  notifySyncInfoChange()
}

// 触发模式更新
function notifyModeChange(mode: SyncMode): void {
  currentMode = mode
  modeListeners.forEach(cb => cb(mode))
  notifySyncInfoChange()
}

// 触发同步信息更新
function notifySyncInfoChange(): void {
  syncInfoListeners.forEach(cb => cb(getSyncInfo()))
}

// ==================== 轮询控制 ====================

/**
 * 启动轮询
 */
function startPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer)
  }

  // 每 8 秒轮询一次
  pollTimer = setInterval(() => {
    if (currentMode === 'sync' && currentShareCode) {
      triggerSync().catch(console.error)
    }
  }, 8000)

  console.log('[Sync] Polling started (8s interval)')
}

/**
 * 停止轮询
 */
function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
    console.log('[Sync] Polling stopped')
  }
}

// ==================== 同步核心功能 ====================

/**
 * 初始化同步管理器
 */
export function initSyncManager(): void {
  console.log('[Sync] Initializing sync manager...')

  // 从本地存储恢复状态
  const savedShareCode = getStorage<string>(STORAGE_KEYS.SYNC_SHARE_CODE)
  const savedSpaceId = getStorage<string>(STORAGE_KEYS.SYNC_SPACE_ID)
  const savedEnabled = getStorage<boolean>(STORAGE_KEYS.SYNC_ENABLED)
  lastSyncVersion = getStorage<number>(STORAGE_KEYS.SYNC_LAST_VERSION) || 0

  if (savedShareCode && savedSpaceId && savedEnabled) {
    currentShareCode = savedShareCode
    currentSpaceId = savedSpaceId
    currentMode = 'sync'
    notifyModeChange('sync')
    startPolling()

    // 立即执行一次全量同步
    triggerSync().catch(console.error)
  } else {
    currentMode = 'local'
    notifyModeChange('local')
  }

  console.log('[Sync] Initialized, mode:', currentMode)
}

/**
 * 设置同步是否启用
 * @param enabled 是否启用同步
 */
export function setSyncEnabled(enabled: boolean): void {
  setStorage(STORAGE_KEYS.SYNC_ENABLED, enabled)

  if (enabled) {
    if (currentShareCode && currentSpaceId) {
      currentMode = 'sync'
      notifyModeChange('sync')
      startPolling()
      triggerSync().catch(console.error)
    }
  } else {
    currentMode = 'local'
    notifyModeChange('local')
    stopPolling()
  }
}

/**
 * 记录本地变更
 * @param entity 实体类型
 * @param operation 操作类型
 * @param data 变更数据
 */
export function recordChange(
  entity: 'event' | 'anniversary' | 'eventType' | 'category',
  operation: 'create' | 'update' | 'delete',
  data: any
): void {
  // 获取当前客户端版本号
  const clientVersion = data.version || 1

  // 添加到待推送队列
  addPendingChange(entity, operation, data, clientVersion)

  console.log('[Sync] Change recorded:', entity, operation, data.id)

  // 如果是同步模式，立即触发一次同步
  if (currentMode === 'sync' && currentShareCode) {
    triggerSync().catch(console.error)
  }
}

/**
 * 创建新空间
 */
export function createSpace(): Promise<{ shareCode: string; spaceId: string } | null> {
  return new Promise((resolve) => {
    const apiBase = getApiBase()
    const deviceId = getDeviceId()

    httpRequest({
      url: `${apiBase}/space/create`,
      method: 'POST',
      data: { deviceId },
      skipAuth: true
    }).then((data: any) => {
      if (data) {
        const { shareCode, spaceId } = data
        currentShareCode = shareCode
        currentSpaceId = spaceId

        // 保存到本地存储
        setStorage(STORAGE_KEYS.SYNC_SHARE_CODE, shareCode)
        setStorage(STORAGE_KEYS.SYNC_SPACE_ID, spaceId)
        setStorage(STORAGE_KEYS.SYNC_ENABLED, true)

        // 切换到同步模式
        currentMode = 'sync'
        notifyModeChange('sync')
        startPolling()

        // 执行全量同步
        triggerFullSync().then(() => {
          resolve({ shareCode, spaceId })
        }).catch(() => {
          resolve({ shareCode, spaceId })
        })
      } else {
        resolve(null)
      }
    })
  })
}

/**
 * 加入空间
 * @param shareCode 分享码
 */
export function joinSpace(shareCode: string): Promise<boolean> {
  return new Promise((resolve) => {
    const apiBase = getApiBase()

    // 先验证分享码
    httpRequest({
      url: `${apiBase}/space/verify?code=${encodeURIComponent(shareCode)}`,
      method: 'GET',
      skipAuth: true
    }).then((data: any) => {
      if (data && data.valid && data.spaceId) {
        currentShareCode = shareCode
        currentSpaceId = data.spaceId

        // 保存到本地存储
        setStorage(STORAGE_KEYS.SYNC_SHARE_CODE, shareCode)
        setStorage(STORAGE_KEYS.SYNC_SPACE_ID, data.spaceId)
        setStorage(STORAGE_KEYS.SYNC_ENABLED, true)

        // 切换到同步模式
        currentMode = 'sync'
        notifyModeChange('sync')
        startPolling()

        // 执行全量同步
        triggerFullSync().then(() => {
          resolve(true)
        }).catch(() => {
          resolve(true)
        })
      } else {
        resolve(false)
      }
    })
  })
}

/**
 * 离开空间
 */
export function leaveSpace(): void {
  // 停止轮询
  stopPolling()

  // 清除状态
  currentShareCode = null
  currentSpaceId = null
  currentMode = 'local'

  // 清除本地存储
  removeStorage(STORAGE_KEYS.SYNC_SHARE_CODE)
  removeStorage(STORAGE_KEYS.SYNC_SPACE_ID)
  removeStorage(STORAGE_KEYS.SYNC_ENABLED)
  removeStorage(STORAGE_KEYS.SYNC_LAST_VERSION)
  removeStorage(STORAGE_KEYS.SYNC_LAST_SYNC_TIME)

  // 清除待推送队列
  clearPendingChanges()

  // 重置版本号
  lastSyncVersion = 0

  // 通知状态变化
  notifyModeChange('local')
  notifyStatusChange('idle')

  console.log('[Sync] Left space, switched to local mode')
}

/**
 * 触发同步
 * 先推送本地变更，再拉取远程变更
 */
export async function triggerSync(): Promise<boolean> {
  if (currentMode !== 'sync' || !currentShareCode) {
    return false
  }

  if (currentStatus === 'syncing') {
    console.log('[Sync] Sync already in progress, skipping...')
    return false
  }

  notifyStatusChange('syncing')

  try {
    // 1. 推送本地变更
    await pushChanges()

    // 2. 拉取远程变更
    await pullChanges()

    notifyStatusChange('idle')
    return true
  } catch (error) {
    console.error('[Sync] Sync failed:', error)
    notifyStatusChange('error')
    return false
  }
}

/**
 * 执行全量同步
 */
async function triggerFullSync(): Promise<boolean> {
  if (!currentShareCode || !currentSpaceId) {
    return false
  }

  notifyStatusChange('syncing')

  try {
    const apiBase = getApiBase()

    const result = await httpRequest<{
      events: any[]
      anniversaries: any[]
      eventTypes: any[]
      categories: any[]
      version: number
    }>({
      url: `${apiBase}/sync/full?spaceId=${encodeURIComponent(currentSpaceId)}`,
      method: 'GET'
    })

    if (result) {
      // 应用全量数据
      applyFullData(result)

      // 更新版本号
      lastSyncVersion = result.version || 0
      setStorage(STORAGE_KEYS.SYNC_LAST_VERSION, lastSyncVersion)
      setStorage(STORAGE_KEYS.SYNC_LAST_SYNC_TIME, Date.now())

      // 清除待推送队列（全量同步后本地数据已与服务端一致）
      clearPendingChanges()

      notifyStatusChange('idle')
      notifySyncInfoChange()

      console.log('[Sync] Full sync completed, version:', lastSyncVersion)
      return true
    }

    notifyStatusChange('error')
    return false
  } catch (error) {
    console.error('[Sync] Full sync failed:', error)
    notifyStatusChange('error')
    return false
  }
}

/**
 * 推送本地变更到服务端
 */
async function pushChanges(): Promise<boolean> {
  if (!currentShareCode) {
    return false
  }

  const pending = getBatchChanges(50)

  if (pending.length === 0) {
    return true
  }

  const apiBase = getApiBase()

  const result = await httpRequest<{
    success: boolean
    processedCount: number
    conflicts: any[]
  }>({
    url: `${apiBase}/sync/push`,
    method: 'POST',
    data: {
      changes: pending,
      deviceId: getDeviceId()
    }
  })

  if (result && result.success) {
    // 移除已处理的变更
    removeBatchChanges(result.processedCount || pending.length)
    console.log('[Sync] Pushed', result.processedCount || pending.length, 'changes')
    return true
  }

  return false
}

/**
 * 从服务端拉取变更
 */
async function pullChanges(): Promise<boolean> {
  if (!currentShareCode || !currentSpaceId) {
    return false
  }

  const apiBase = getApiBase()

  const result = await httpRequest<{
    events: any[]
    anniversaries: any[]
    eventTypes: any[]
    categories: any[]
    version: number
    hasMore: boolean
  }>({
    url: `${apiBase}/sync/pull?spaceId=${encodeURIComponent(currentSpaceId)}&sinceVersion=${lastSyncVersion}`,
    method: 'GET'
  })

  if (result) {
    // 应用增量数据
    applyIncrementalData(result)

    // 更新版本号
    if (result.version && result.version > lastSyncVersion) {
      lastSyncVersion = result.version
      setStorage(STORAGE_KEYS.SYNC_LAST_VERSION, lastSyncVersion)
      setStorage(STORAGE_KEYS.SYNC_LAST_SYNC_TIME, Date.now())
    }

    notifySyncInfoChange()

    // 如果还有更多数据，继续拉取
    if (result.hasMore) {
      return pullChanges()
    }

    return true
  }

  return false
}

/**
 * 获取同步状态
 */
export async function getSyncStatusFromServer(): Promise<{
  connected: boolean
  spaceId: string
  memberCount: number
  lastUpdate: number
} | null> {
  if (!currentShareCode) {
    return null
  }

  const apiBase = getApiBase()

  return httpRequest({
    url: `${apiBase}/sync/status`,
    method: 'GET'
  })
}

// ==================== 数据应用 ====================

/**
 * 应用全量数据
 */
function applyFullData(data: {
  events: any[]
  anniversaries: any[]
  eventTypes: any[]
  categories: any[]
}): void {
  const eventStore = useEventStore()
  const anniversaryStore = useAnniversaryStore()
  const eventTypeStore = useEventTypeStore()
  const categoryStore = useAnniversaryCategoryStore()

  // 应用事件
  if (data.events && data.events.length > 0) {
    eventStore.events = data.events
    eventStore.saveToStorage()
  }

  // 应用纪念日
  if (data.anniversaries && data.anniversaries.length > 0) {
    anniversaryStore.anniversaries = data.anniversaries
    anniversaryStore.saveToStorage()
  }

  // 应用事件类型
  if (data.eventTypes && data.eventTypes.length > 0) {
    eventTypeStore.types = data.eventTypes
    eventTypeStore.saveToStorage()
  }

  // 应用分类
  if (data.categories && data.categories.length > 0) {
    categoryStore.categories = data.categories
    categoryStore.saveToStorage()
  }

  console.log('[Sync] Applied full data')
}

/**
 * 应用增量数据（Last-Write-Wins 策略）
 */
function applyIncrementalData(data: {
  events: any[]
  anniversaries: any[]
  eventTypes: any[]
  categories: any[]
}): void {
  const eventStore = useEventStore()
  const anniversaryStore = useAnniversaryStore()
  const eventTypeStore = useEventTypeStore()
  const categoryStore = useAnniversaryCategoryStore()

  // 处理事件
  if (data.events) {
    data.events.forEach((remoteEvent: any) => {
      if (remoteEvent.deleted) {
        // 删除操作
        const index = eventStore.events.findIndex((e: any) => e.id === remoteEvent.id)
        if (index !== -1) {
          eventStore.events.splice(index, 1)
        }
      } else {
        // 新增或更新 - Last-Write-Wins
        const localEvent = eventStore.events.find((e: any) => e.id === remoteEvent.id)
        if (!localEvent) {
          // 新增
          eventStore.events.push(remoteEvent)
        } else if (remoteEvent.version > localEvent.version) {
          // 远程版本更新，覆盖本地
          const index = eventStore.events.findIndex((e: any) => e.id === remoteEvent.id)
          eventStore.events[index] = remoteEvent
        }
      }
    })
    eventStore.saveToStorage()
  }

  // 处理纪念日
  if (data.anniversaries) {
    data.anniversaries.forEach((remoteAnniversary: any) => {
      if (remoteAnniversary.deleted) {
        const index = anniversaryStore.anniversaries.findIndex((a: any) => a.id === remoteAnniversary.id)
        if (index !== -1) {
          anniversaryStore.anniversaries.splice(index, 1)
        }
      } else {
        const localAnniversary = anniversaryStore.anniversaries.find((a: any) => a.id === remoteAnniversary.id)
        if (!localAnniversary) {
          anniversaryStore.anniversaries.push(remoteAnniversary)
        } else if (remoteAnniversary.version > localAnniversary.version) {
          const index = anniversaryStore.anniversaries.findIndex((a: any) => a.id === remoteAnniversary.id)
          anniversaryStore.anniversaries[index] = remoteAnniversary
        }
      }
    })
    anniversaryStore.saveToStorage()
  }

  // 处理事件类型
  if (data.eventTypes) {
    data.eventTypes.forEach((remoteType: any) => {
      if (remoteType.deleted) {
        const index = eventTypeStore.types.findIndex((t: any) => t.id === remoteType.id)
        if (index !== -1) {
          eventTypeStore.types.splice(index, 1)
        }
      } else {
        const localType = eventTypeStore.types.find((t: any) => t.id === remoteType.id)
        if (!localType) {
          eventTypeStore.types.push(remoteType)
        } else if (remoteType.version > localType.version) {
          const index = eventTypeStore.types.findIndex((t: any) => t.id === remoteType.id)
          eventTypeStore.types[index] = remoteType
        }
      }
    })
    eventTypeStore.saveToStorage()
  }

  // 处理分类
  if (data.categories) {
    data.categories.forEach((remoteCategory: any) => {
      if (remoteCategory.deleted) {
        const index = categoryStore.categories.findIndex((c: any) => c.id === remoteCategory.id)
        if (index !== -1) {
          categoryStore.categories.splice(index, 1)
        }
      } else {
        const localCategory = categoryStore.categories.find((c: any) => c.id === remoteCategory.id)
        if (!localCategory) {
          categoryStore.categories.push(remoteCategory)
        } else if (remoteCategory.version > localCategory.version) {
          const index = categoryStore.categories.findIndex((c: any) => c.id === remoteCategory.id)
          categoryStore.categories[index] = remoteCategory
        }
      }
    })
    categoryStore.saveToStorage()
  }

  console.log('[Sync] Applied incremental data')
}

// ==================== 清除同步数据 ====================

/**
 * 清除所有同步数据
 */
export function clearSyncData(): void {
  leaveSpace()
}

/**
 * 导出待推送变更数量
 */
export function getPendingChangesCount(): number {
  return getPendingCount()
}

/**
 * 检查是否有待推送的变更
 */
export function hasPendingChanges(): boolean {
  return !isPendingEmpty()
}

/**
 * 验证分享码（验证并返回结果，不自动加入）
 * @param shareCode 分享码
 */
export async function verifyShareCode(shareCode: string): Promise<{ valid: boolean; spaceId: string | null } | null> {
  const apiBase = getApiBase()
  return httpRequest({
    url: `${apiBase}/space/verify?code=${encodeURIComponent(shareCode)}`,
    method: 'GET',
    skipAuth: true
  })
}

/**
 * 连接WebSocket（已废弃，使用 createSpace/joinSpace 代替）
 * 保留此函数以兼容旧代码调用
 * @param shareCode 分享码（已废弃参数）
 * @deprecated 使用 createSpace() 或 joinSpace() 代替
 */
export function connectWebSocket(shareCode: string): void {
  console.log('[Sync] connectWebSocket is deprecated, use createSpace() or joinSpace() instead')
  // 如果当前没有同步模式但有shareCode，尝试加入空间
  if (currentMode !== 'sync' && shareCode) {
    joinSpace(shareCode).catch(console.error)
  }
}