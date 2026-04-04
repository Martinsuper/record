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
