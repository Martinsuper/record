// src/utils/sync/BackupManager.ts

import { getStorage, setStorage } from '@/utils/storage'
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
  setStorage('sync_offline_queue', pending)
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
  const pending = getStorage<PendingChange[]>('sync_offline_queue') || []
  if (pending.length === 0) return 0

  const db = getDB()
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