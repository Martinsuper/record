import { getStorage, setStorage, STORAGE_KEYS } from './storage'

export interface PendingChange {
  entity: 'event' | 'anniversary' | 'eventType' | 'category'
  operation: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
  clientVersion: number
}

export function getPendingChanges(): PendingChange[] {
  return getStorage<PendingChange[]>(STORAGE_KEYS.PENDING_CHANGES) || []
}

function savePendingChanges(queue: PendingChange[]): void {
  setStorage(STORAGE_KEYS.PENDING_CHANGES, queue)
}

export function addPendingChange(
  entity: 'event' | 'anniversary' | 'eventType' | 'category',
  operation: 'create' | 'update' | 'delete',
  data: any,
  clientVersion: number
): void {
  const queue = getPendingChanges()
  queue.push({
    entity,
    operation,
    data,
    timestamp: Date.now(),
    clientVersion
  })
  savePendingChanges(queue)
  console.log('[PendingChanges] Added:', entity, operation, data.id)
}

export function removePendingChange(timestamp: number): void {
  const queue = getPendingChanges()
  const index = queue.findIndex(c => c.timestamp === timestamp)
  if (index !== -1) {
    queue.splice(index, 1)
    savePendingChanges(queue)
    console.log('[PendingChanges] Removed:', timestamp)
  }
}

export function clearPendingChanges(): void {
  savePendingChanges([])
  console.log('[PendingChanges] Cleared')
}

export function getBatchChanges(maxCount: number = 50): PendingChange[] {
  const queue = getPendingChanges()
  return queue.slice(0, maxCount)
}

export function removeBatchChanges(count: number): void {
  const queue = getPendingChanges()
  queue.splice(0, count)
  savePendingChanges(queue)
}

export function isPendingEmpty(): boolean {
  return getPendingChanges().length === 0
}

export function getPendingCount(): number {
  return getPendingChanges().length
}
