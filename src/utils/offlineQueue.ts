import { getStorage, setStorage, STORAGE_KEYS } from './storage'
import { SYNC_CONFIG } from './config'

export interface QueueMessage {
  type: string
  data: any
  timestamp: number
  retryCount: number
}

export function getOfflineQueue(): QueueMessage[] {
  return getStorage<QueueMessage[]>(STORAGE_KEYS.OFFLINE_QUEUE) || []
}

function saveOfflineQueue(queue: QueueMessage[]): void {
  setStorage(STORAGE_KEYS.OFFLINE_QUEUE, queue)
}

export function addToOfflineQueue(type: string, data: any): void {
  const queue = getOfflineQueue()
  queue.push({ type, data, timestamp: Date.now(), retryCount: 0 })
  saveOfflineQueue(queue)
}

export function removeFromOfflineQueue(timestamp: number): void {
  const queue = getOfflineQueue()
  const index = queue.findIndex(m => m.timestamp === timestamp)
  if (index !== -1) {
    queue.splice(index, 1)
    saveOfflineQueue(queue)
  }
}

export function updateRetryCount(timestamp: number): boolean {
  const queue = getOfflineQueue()
  const message = queue.find(m => m.timestamp === timestamp)
  if (!message) return false
  message.retryCount++
  if (message.retryCount >= SYNC_CONFIG.MAX_RETRY_COUNT) {
    removeFromOfflineQueue(timestamp)
    return false
  }
  saveOfflineQueue(queue)
  return true
}

export function clearOfflineQueue(): void {
  saveOfflineQueue([])
}

export function isOfflineQueueEmpty(): boolean {
  return getOfflineQueue().length === 0
}