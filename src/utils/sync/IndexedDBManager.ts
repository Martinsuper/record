// src/utils/sync/IndexedDBManager.ts

import Dexie from 'dexie'
import type { Table } from 'dexie'
import type { PendingChange, SyncMeta, OperationLog } from './types'
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

// Table name mapping
const STORE_MAP: Record<string, keyof RecordSyncDatabase> = {
  event: 'events',
  anniversary: 'anniversaries',
  eventType: 'eventTypes',
  category: 'categories'
} as const

export async function bulkPut(
  store: 'event' | 'anniversary' | 'eventType' | 'category',
  items: any[]
): Promise<void> {
  const table = getDB()[STORE_MAP[store]] as Table<any, string>
  await table.bulkPut(items)
}

export async function getAll(
  store: 'event' | 'anniversary' | 'eventType' | 'category'
): Promise<any[]> {
  const table = getDB()[STORE_MAP[store]] as Table<any, string>
  return table.toArray()
}

export async function deleteById(
  store: 'event' | 'anniversary' | 'eventType' | 'category',
  id: string
): Promise<void> {
  const table = getDB()[STORE_MAP[store]] as Table<any, string>
  await table.delete(id)
}

export async function clearStore(
  store: 'event' | 'anniversary' | 'eventType' | 'category'
): Promise<void> {
  const table = getDB()[STORE_MAP[store]] as Table<any, string>
  await table.clear()
}

// ===== SyncMeta helpers =====

export async function getSyncState(): Promise<SyncMeta | null> {
  const result = await getDB().syncMeta.get('sync_state')
  return result ?? null
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

const ENTITY_STORES: Record<string, string> = {
  events: 'event',
  anniversaries: 'anniversary',
  eventTypes: 'eventType',
  categories: 'category'
}

export async function batchPutAll(
  data: Record<string, any[]>
): Promise<void> {
  const store = getDB()
  for (const [key, items] of Object.entries(data)) {
    if (items && items.length > 0) {
      const storeName = ENTITY_STORES[key]
      if (storeName) {
        const table = store[STORE_MAP[storeName]] as Table<any, string>
        await table.bulkPut(items)
      }
    }
  }
}
