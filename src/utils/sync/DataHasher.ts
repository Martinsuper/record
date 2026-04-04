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
