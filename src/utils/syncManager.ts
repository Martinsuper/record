// src/utils/syncManager.ts
// 手动同步模式 — 所有同步操作均由用户主动触发

import {
  initSyncSystem,
  triggerSync,
  getSyncMode,
  getSyncStatus,
  getCurrentShareCode,
  getCurrentSpaceId,
  getSyncInfo,
  getSyncStatusFromServer,
  createSpace,
  joinSpace,
  leaveSpace,
  setSyncEnabled,
  recordChange,
  clearSyncData,
  hasPendingChanges,
  verifyShareCode,
  connectWebSocket,
  onSyncModeChange,
  onSyncChange,
  onSyncInfoChange
} from './sync'

let _initialized = false

/**
 * 初始化同步管理器（仅初始化系统，不启动自动同步）
 */
export function initSyncManager(): void {
  if (_initialized) return
  _initialized = true
  initSyncSystem()
  // 不启动任何自动同步定时器
  // startNetworkMonitor() 已移除
  // startScheduler() 已移除
  // startPeriodicBackup() 已移除
}

/**
 * 手动触发同步（用户点击同步按钮时调用）
 */
export async function manualSync(): Promise<{ success: boolean; pushed: number; pulled: number }> {
  return triggerSync()
}

// Direct re-exports
export {
  getSyncMode, getSyncStatus, getCurrentShareCode, getCurrentSpaceId,
  getSyncInfo, getSyncStatusFromServer, createSpace, joinSpace, leaveSpace,
  triggerSync, setSyncEnabled, recordChange, clearSyncData,
  hasPendingChanges, verifyShareCode, connectWebSocket,
  onSyncModeChange, onSyncChange as onSyncStatusChange, onSyncInfoChange as onSyncInfoChange
}