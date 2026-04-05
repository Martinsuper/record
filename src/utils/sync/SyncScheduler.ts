// src/utils/sync/SyncScheduler.ts

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

/** 启动轮询调度器 */
export function startScheduler(callback: () => Promise<void>): void {
  _onTick = callback
  if (timer) clearTimeout(timer)
  _scheduleNext()
}

/** 停止轮询调度器 */
export function stopScheduler(): void {
  if (timer) { clearTimeout(timer); timer = null }
  _isRunning = false
  _onTick = null
}

/** 手动触发一次同步 */
export function triggerNow(): void {
  if (timer) clearTimeout(timer)
  if (_onTick && !_isRunning) {
    _onTick().then(() => { _currentInterval = POLL_CONFIG.defaultInterval; _scheduleNext() }).catch(() => _scheduleNext())
  }
}

/** 同步成功后调用 */
export function onSyncSuccess(): void {
  _currentInterval = POLL_CONFIG.defaultInterval
}

/** 同步失败后调用 */
export function onSyncFailure(): void {
  _currentInterval *= POLL_CONFIG.adaptiveFactors.syncFailed
  _scheduleNext()
}

function _scheduleNext(): void {
  if (!_onTick) return
  _currentInterval = calcInterval()
  timer = setTimeout(async () => {
    _isRunning = true
    try { await _onTick?.(); onSyncSuccess() } catch { onSyncFailure() }
    finally { _isRunning = false; _scheduleNext() }
  }, _currentInterval)
}