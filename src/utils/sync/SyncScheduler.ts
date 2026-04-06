// src/utils/sync/SyncScheduler.ts
// 手动同步模式 — 调度器不再自动运行，仅保留手动触发能力

import { POLL_CONFIG } from './constants'
import { getNetworkQuality, getOnline } from './NetworkMonitor'

let timer: ReturnType<typeof setTimeout> | null = null
let _currentInterval = POLL_CONFIG.defaultInterval
let _onTick: (() => Promise<void>) | null = null
let _isRunning = false
let _hasPending = false  // Updated by SyncEngine after each push/pull cycle

/** 计算自适应轮询间隔 (纯同步) */
function calcInterval(): number {
  let interval = POLL_CONFIG.defaultInterval

  const quality = getNetworkQuality()
  if (quality === 'good') interval *= POLL_CONFIG.adaptiveFactors.networkGood
  else if (quality === 'poor') interval *= POLL_CONFIG.adaptiveFactors.networkPoor

  interval *= (_hasPending ? POLL_CONFIG.adaptiveFactors.hasPending : POLL_CONFIG.adaptiveFactors.noPending)

  if (!_getOnline()) interval *= POLL_CONFIG.adaptiveFactors.networkPoor * 2

  return Math.min(Math.max(interval, POLL_CONFIG.minInterval), POLL_CONFIG.maxInterval)
}

function _getOnline(): boolean { return getOnline() }

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
  // timer 不再启动
}

/** 停止轮询调度器 */
export function stopScheduler(): void {
  if (timer) { clearTimeout(timer); timer = null }
  _isRunning = false
  _onTick = null
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
      onSyncSuccess()
    } catch (e) {
      onSyncFailure()
      throw e
    } finally {
      _isRunning = false
    }
  }
}

/** 同步成功后调用 */
export function onSyncSuccess(): void {
  _currentInterval = POLL_CONFIG.defaultInterval
}

/** 同步失败后调用 */
export function onSyncFailure(): void {
  _currentInterval *= POLL_CONFIG.adaptiveFactors.syncFailed
}

// _scheduleNext 已禁用，不再自动调度
function _scheduleNext(): void {
  // 自动调度已移除
}