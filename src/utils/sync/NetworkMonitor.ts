// src/utils/sync/NetworkMonitor.ts

import { NETWORK_CONFIG } from './constants'
import { getApiBase } from './NetworkClient'

let _isOnline = true
let _lastPingLatency = 0
let _onlineListeners: Set<(online: boolean) => void> = new Set()
let pingTimer: ReturnType<typeof setInterval> | null = null

/** 当前是否在线 */
export function getOnline(): boolean {
  return _isOnline
}

/** 最近一次 ping 延迟 (ms) */
export function getLastPingLatency(): number {
  return _lastPingLatency
}

/** 网络质量评估 */
export function getNetworkQuality(): 'good' | 'fair' | 'poor' {
  if (!_isOnline) return 'poor'
  if (_lastPingLatency < NETWORK_CONFIG.goodLatencyThreshold) return 'good'
  if (_lastPingLatency < NETWORK_CONFIG.goodLatencyThreshold * 3) return 'fair'
  return 'poor'
}

/** 启动网络监听 */
export function startNetworkMonitor(): void {
  // H5 平台事件
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => { _isOnline = true; _onlineListeners.forEach(cb => cb(true)); _ping() })
    window.addEventListener('offline', () => { _isOnline = false; _onlineListeners.forEach(cb => cb(false)) })
    _isOnline = navigator.onLine
  }

  // uni-app 事件
  try {
    uni.onNetworkStatusChange((res: any) => {
      const wasOnline = _isOnline
      _isOnline = res.isConnected
      if (!wasOnline && _isOnline) { _onlineListeners.forEach(cb => cb(true)); _ping() }
      else if (wasOnline && !_isOnline) { _onlineListeners.forEach(cb => cb(false)) }
    })
  } catch {}

  _startPingInterval()
}

/** 停止网络监听 */
export function stopNetworkMonitor(): void {
  if (pingTimer) { clearInterval(pingTimer); pingTimer = null }
}

/** 监听在线/离线事件 */
export function onOnlineChange(callback: (online: boolean) => void): () => void {
  _onlineListeners.add(callback)
  return () => _onlineListeners.delete(callback)
}

function _ping(): Promise<number> {
  const start = Date.now()
  return new Promise((resolve) => {
    try {
      const url = getApiBase() + '/sync/ping'
      const done = (ms: number) => { _lastPingLatency = ms; resolve(ms) }
      uni.request({
        url, method: 'GET', timeout: NETWORK_CONFIG.pingTimeout,
        success: () => done(Date.now() - start),
        fail: () => { _lastPingLatency = Infinity; resolve(Infinity) }
      })
    } catch { _lastPingLatency = Infinity; resolve(Infinity) }
  })
}

function _startPingInterval(): void {
  if (pingTimer) clearTimeout(pingTimer)
  pingTimer = setInterval(() => { if (_isOnline) _ping() }, NETWORK_CONFIG.pingInterval)
}
