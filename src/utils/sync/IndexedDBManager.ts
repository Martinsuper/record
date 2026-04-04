// src/utils/sync/IndexedDBManager.ts

import Dexie, { Table } from 'dexie'
import type { PendingChange, SyncMeta, OperationLog, EntityName } from './types'
import type { ChangeStatus } from './types'
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

export async function bulkPut<Entity extends EntityName>(
  store: Entity,
  items: any[]
): Promise<void> {
  const table = getDB()[store] as Table<any, string>
  await table.bulkPut(items)
}

export async function getAll<Entity extends EntityName>(
  store: Entity
): Promise<any[]> {
  const table = getDB()[store] as Table<any, string>
  return table.toArray()
}

export async function deleteById<Entity extends EntityName>(
  store: Entity,
  id: string
): Promise<void> {
  const table = getDB()[store] as Table<any, string>
  await table.delete(id)
}

export async function clearStore<Entity extends EntityName>(
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
