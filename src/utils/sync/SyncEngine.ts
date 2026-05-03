// src/utils/sync/SyncEngine.ts

import { batchPutAll, saveSyncState, getSyncState, getDB } from './IndexedDBManager'
import { httpRequest, getApi, postApi, getApiBase, setShareCode, getShareCode } from './NetworkClient'
import { clearQueue, getPendingCount, hasPending } from './PendingQueue'
import type { EntityName, Operation, SyncResult, SpaceInfo, SyncStatus } from './types'
import { PUSH_CONFIG, PULL_CONFIG } from './constants'
import { setHasPending } from './SyncScheduler'

// ===== State =====
let _currentMode: 'local' | 'sync' = 'local'
let _currentSpaceId: string | null = null
let _lastSyncVersion = 0
let _currentStatus: SyncStatus = 'idle'

const _statusListeners: Set<(s: SyncStatus) => void> = new Set()
const _modeListeners: Set<(m: 'local' | 'sync') => void> = new Set()
const _infoListeners: Set<() => void> = new Set()

function _setStatus(s: SyncStatus) { _currentStatus = s; _statusListeners.forEach(cb => cb(s)); _infoListeners.forEach(cb => cb()) }

// ===== Init =====

export function initSyncSystem(): void {
  getSyncState().then(meta => {
    if (meta && meta.enabled && meta.shareCode && meta.spaceId) {
      _currentSpaceId = meta.spaceId
      _lastSyncVersion = meta.lastVersion
      _currentMode = 'sync'
      setShareCode(meta.shareCode)
      _infoListeners.forEach(cb => cb())
    }
  }).catch(() => {})
}

export function initSyncEngine(): void { initSyncSystem() } // deprecated alias

// ===== Space =====

export async function createSpace(): Promise<SpaceInfo | null> {
  const { getOrCreateDeviceId } = await import('@/utils/deviceId')
  const deviceId = getOrCreateDeviceId()
  const result = await httpRequest<{ shareCode: string; spaceId: string }>({
    url: getApiBase() + '/space/create', method: 'POST',
    data: { deviceId }, skipAuth: true
  })
  if (!result) return null

  _currentSpaceId = result.spaceId
  _currentMode = 'sync'
  setShareCode(result.shareCode)
  await saveSyncState({ shareCode: result.shareCode, spaceId: result.spaceId, enabled: true })
  _modeListeners.forEach(cb => cb('sync'))
  _infoListeners.forEach(cb => cb())
  await doFullSync()
  return result
}

export async function joinSpace(shareCode: string): Promise<boolean> {
  const result = await httpRequest<{ spaceId: string }>({
    url: getApiBase() + '/space/verify?code=' + encodeURIComponent(shareCode),
    method: 'GET', skipAuth: true
  })
  if (!result?.spaceId) return false

  _currentSpaceId = result.spaceId
  _currentMode = 'sync'
  setShareCode(shareCode)
  await saveSyncState({ shareCode, spaceId: result.spaceId, enabled: true })
  _modeListeners.forEach(cb => cb('sync'))
  _infoListeners.forEach(cb => cb())
  await doFullSync()
  return true
}

export function leaveSpace(): void {
  _currentSpaceId = null
  _currentMode = 'local'
  _lastSyncVersion = 0
  _setStatus('idle')
  saveSyncState({ enabled: false }).catch(() => {})
  clearQueue().catch(() => {})
  setShareCode(null)
  _modeListeners.forEach(cb => cb('local'))
  _infoListeners.forEach(cb => cb())
}

// ===== Control =====

export async function triggerSync(): Promise<SyncResult> {
  if (_currentMode !== 'sync' || !_currentSpaceId) return { success: false, pushed: 0, pulled: 0 }
  if (_currentStatus === 'syncing') return { success: false, pushed: 0, pulled: 0 }

  _setStatus('syncing')
  try {
    const pushed = await doPushChanges()
    const pulled = await doPullChanges()
    _updatePendingState()
    _setStatus(pulled > 0 ? 'synced' : 'idle')
    return { success: true, pushed, pulled }
  } catch {
    _setStatus('error')
    return { success: false, pushed: 0, pulled: 0 }
  }
}

export function setSyncEnabled(enabled: boolean): void {
  saveSyncState({ enabled })
  if (enabled && getShareCode() && _currentSpaceId) {
    _currentMode = 'sync'
    _modeListeners.forEach(cb => cb('sync'))
  } else {
    _currentMode = 'local'
    _modeListeners.forEach(cb => cb('local'))
  }
}

// ===== Record Change =====

export async function recordChange(entity: EntityName, operation: Operation, data: any, fields?: string[]): Promise<void> {
  const db = getDB()
  const id = `change_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  await db.pendingQueue.add({
    id, entity, operation, data, fields,
    timestamp: Date.now(), clientVersion: data.version || 1,
    retryCount: 0, status: 'pending'
  } as any)
  _infoListeners.forEach(cb => cb())
  _updatePendingState()
}

// ===== Queries =====

export function getSyncMode(): 'local' | 'sync' { return _currentMode }

export function getSyncStatus(): SyncStatus { return _currentStatus }

export function getCurrentShareCode(): string | null { return getShareCode() }
export function getCurrentSpaceId(): string | null { return _currentSpaceId }

export async function getSyncInfo(): Promise<SyncStatus> {
  const meta = await getSyncState()
  const pending = await getPendingCount()
  return {
    mode: _currentMode, status: _currentStatus,
    shareCode: getShareCode(), spaceId: _currentSpaceId,
    lastSyncVersion: _lastSyncVersion,
    lastSyncTime: meta?.lastSyncTime || 0,
    pendingCount: pending
  } as any
}

export async function getSyncStatusFromServer(): Promise<any> {
  if (!_currentSpaceId) return null
  return getApi('/sync/status?spaceId=' + encodeURIComponent(_currentSpaceId))
}

export function onSyncChange(cb: (s: SyncStatus) => void): () => void { _statusListeners.add(cb); return () => _statusListeners.delete(cb) }
export function onSyncModeChange(cb: (m: 'local' | 'sync') => void): () => void { _modeListeners.add(cb); return () => _modeListeners.delete(cb) }
export function onSyncInfoChange(cb: () => void): () => void { _infoListeners.add(cb); return () => _infoListeners.delete(cb) }

export async function hasPendingChanges(): Promise<boolean> { return hasPending() }
export function clearSyncData(): void { leaveSpace() }

export async function verifyShareCode(shareCode: string): Promise<{ valid: boolean; spaceId: string | null } | null> {
  const result = await httpRequest<{ spaceId: string }>({
    url: getApiBase() + '/space/verify?code=' + encodeURIComponent(shareCode), method: 'GET', skipAuth: true
  })
  return result?.spaceId ? { valid: true, spaceId: result.spaceId } : null
}

export function connectWebSocket(shareCode: string): void {
  console.log('[Sync] connectWebSocket is deprecated, use joinSpace() instead')
  if (_currentMode !== 'sync' && shareCode) joinSpace(shareCode).catch(() => {})
}

// ===== Internal: Push =====

async function doPushChanges(): Promise<number> {
  const db = getDB()
  const { getOrCreateDeviceId } = await import('@/utils/deviceId')
  const pending = await db.pendingQueue.where('status').equals('pending').limit(PUSH_CONFIG.batchSize).sortBy('timestamp') as any[]
  if (!pending.length) return 0

  const result = await postApi<{ accepted: string[]; newVersion: number }>('/sync/push', {
    spaceId: _currentSpaceId, deviceId: getOrCreateDeviceId(),
    changes: pending.map((c: any) => ({ entity: c.entity, operation: c.operation, data: c.data, clientVersion: c.clientVersion, fields: c.fields }))
  })

  if (result?.accepted?.length) {
    for (let i = 0; i < result.accepted.length && i < pending.length; i++) {
      await db.pendingQueue.update(pending[i].id, { status: 'pushed' })
    }
    if (result.newVersion) await saveSyncState({ lastVersion: result.newVersion })
    _updatePendingState()
    return result.accepted.length
  }

  for (const c of pending) {
    await db.pendingQueue.update(c.id, { retryCount: (c.retryCount || 0) + 1, status: 'failed' })
  }
  _updatePendingState()
  return 0
}

// ===== Internal: Pull =====

async function doPullChanges(): Promise<number> {
  let total = 0
  while (true) {
    const result = await getApi<any>('/sync/pull', { spaceId: _currentSpaceId!, sinceVersion: _lastSyncVersion, limit: PULL_CONFIG.pageSize })
    if (!result) break

    const allData: Partial<Record<EntityName, any[]>> = {}
    const entityMap: Record<string, EntityName> = { events: 'event', anniversaries: 'anniversary', eventTypes: 'eventType', categories: 'category' }
    for (const key of ['events', 'anniversaries', 'eventTypes', 'categories'] as const) {
      if (result[key]?.length) allData[entityMap[key]] = result[key]
    }

    if (Object.keys(allData).length) await batchPutAll(allData as Record<string, any[]>)
    if (result.maxVersion && result.maxVersion > _lastSyncVersion) {
      _lastSyncVersion = result.maxVersion
      await saveSyncState({ lastVersion: _lastSyncVersion })
    }
    total += (result.events?.length || 0) + (result.anniversaries?.length || 0) + (result.eventTypes?.length || 0) + (result.categories?.length || 0)
    if (!result.hasMore) break
  }
  return total
}

async function doFullSync(): Promise<void> {
  _setStatus('syncing')
  const result = await getApi<{ events: any[]; anniversaries: any[]; eventTypes: any[]; categories: any[]; maxVersion: number }>(
    '/sync/full?spaceId=' + encodeURIComponent(_currentSpaceId!)
  )
  if (!result) { _setStatus('error'); return }

  const allData: Record<string, any[]> = { events: result.events || [], anniversaries: result.anniversaries || [], eventTypes: result.eventTypes || [], categories: result.categories || [] }
  await batchPutAll(allData)
  if (result.maxVersion) { _lastSyncVersion = result.maxVersion; await saveSyncState({ lastVersion: _lastSyncVersion }) }
  await clearQueue()
  _updatePendingState()
  _setStatus('synced')
}

async function _updatePendingState(): Promise<void> { setHasPending(await hasPending()) }
