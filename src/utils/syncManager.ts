// src/utils/syncManager.ts
// Compatibility shim — wraps the new modular sync system

let _initialized = false
let _initPromise: Promise<void> | null = null

async function _init() {
  if (_initPromise) return _initPromise
  _initPromise = (async () => {
    if (_initialized) return
    _initialized = true
    const { initSyncSystem, startNetworkMonitor, startScheduler, startPeriodicBackup } = await import('./sync')
    initSyncSystem()
    startNetworkMonitor()
    startScheduler(async () => {
      const { triggerSync } = await import('./sync')
      await triggerSync()
    })
    startPeriodicBackup()
  })()
  return _initPromise
}

export function initSyncManager(): void { _init().catch(console.error) }

// Direct re-exports
export {
  getSyncMode, getSyncStatus, getCurrentShareCode, getCurrentSpaceId,
  getSyncInfo, getSyncStatusFromServer, createSpace, joinSpace, leaveSpace,
  triggerSync, setSyncEnabled, recordChange, clearSyncData,
  getPendingChangesCount, hasPendingChanges, verifyShareCode, connectWebSocket,
  onSyncModeChange, onSyncChange as onSyncStatusChange, onSyncInfoChange as onSyncInfoChange
} from './sync'
