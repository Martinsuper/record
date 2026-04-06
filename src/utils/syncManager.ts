// src/utils/syncManager.ts
// Compatibility shim — wraps the new modular sync system

import {
  initSyncSystem,
  startNetworkMonitor,
  startScheduler,
  startPeriodicBackup,
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
  getPendingChangesCount,
  hasPendingChanges,
  verifyShareCode,
  connectWebSocket,
  onSyncModeChange,
  onSyncChange,
  onSyncInfoChange
} from './sync'

let _initialized = false

export function initSyncManager(): void {
  if (_initialized) return
  _initialized = true
  initSyncSystem()
  startNetworkMonitor()
  startScheduler(async () => {
    await triggerSync()
  })
  startPeriodicBackup()
}

// Direct re-exports
export {
  getSyncMode, getSyncStatus, getCurrentShareCode, getCurrentSpaceId,
  getSyncInfo, getSyncStatusFromServer, createSpace, joinSpace, leaveSpace,
  triggerSync, setSyncEnabled, recordChange, clearSyncData,
  getPendingChangesCount, hasPendingChanges, verifyShareCode, connectWebSocket,
  onSyncModeChange, onSyncChange as onSyncStatusChange, onSyncInfoChange as onSyncInfoChange
}