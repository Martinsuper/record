// src/utils/sync/ChangeMerger.ts

import type { PendingChange, EntityName, Operation } from './types'
import { MERGE_CONFIG } from './constants'

/** 短时间内对同一实体的多次变更进行合并 */
export function mergeChanges(
  changes: PendingChange[],
  now: number = Date.now()
): PendingChange[] {
  const merged: Map<string, PendingChange> = new Map()

  for (const change of changes) {
    const key = `${change.entity}:${change.data?.id}`
    const existing = merged.get(key)

    if (!existing) {
      merged.set(key, { ...change })
      continue
    }

    // 检查时间窗口
    if (change.timestamp - existing.timestamp > MERGE_CONFIG.window) {
      merged.set(key, { ...change })
      continue
    }

    // 合并规则
    const ruleKey = `${existing.operation}+${change.operation}`
    const result = MERGE_CONFIG.rules[ruleKey]

    if (!result) {
      merged.set(key, { ...change })
      continue
    }

    switch (result) {
      case 'create':
        existing.operation = 'create'
        existing.data = { ...change.data }
        existing.timestamp = change.timestamp
        existing.fields = change.fields ?? extractChangedFields(existing.data, change.data)
        break

      case 'delete':
        existing.operation = 'delete'
        existing.data = { id: existing.data.id }
        existing.fields = undefined
        break

      case 'merge':
        existing.data = { ...existing.data, ...change.data }
        existing.timestamp = change.timestamp
        existing.fields = mergeChangedFields(existing.fields, change.fields)
        break

      case 'discard':
        merged.delete(key)
        break
    }
  }

  return Array.from(merged.values())
}

/** 对比新旧对象，提取变更的字段 */
function extractChangedFields(oldObj: any, newObj: any): string[] {
  const fields: string[] = []
  for (const key of Object.keys(newObj)) {
    if (oldObj[key] !== newObj[key]) {
      fields.push(key)
    }
  }
  return fields
}

function mergeChangedFields(a?: string[], b?: string[]): string[] | undefined {
  if (!a && !b) return undefined
  const set = new Set<string>()
  a?.forEach(f => set.add(f))
  b?.forEach(f => set.add(f))
  return set.size > 0 ? Array.from(set) : undefined
}
