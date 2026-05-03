// src/utils/sync/SyncScheduler.ts
// 手动同步模式 — 调度器不再自动运行，仅保留手动触发能力

let _onTick: (() => Promise<void>) | null = null
let _isRunning = false
let _hasPending = false  // Updated by SyncEngine after each push/pull cycle

/** 更新 pending 状态 (由 SyncEngine 调用) */
export function setHasPending(val: boolean): void {
  _hasPending = val
}

/**
 * 启动轮询调度器（手动同步模式下已禁用）
 * @deprecated 自动同步已移除，请使用 triggerSync() 手动触发
 */
export function startScheduler(callback: () => Promise<void>): void {
  // 手动同步模式下不启动自动调度器
  // 仅保存回调以便手动触发时使用
  _onTick = callback
}

/**
 * 手动触发一次同步
 * 在手动同步模式下，这是唯一的触发方式
 */
export async function triggerNow(): Promise<void> {
  if (_onTick && !_isRunning) {
    _isRunning = true
    try {
      await _onTick()
    } finally {
      _isRunning = false
    }
  }
}