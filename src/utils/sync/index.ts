// src/utils/sync/index.ts

// Core
export {
  initSyncSystem,
  initSyncEngine,
  createSpace,
  joinSpace,
  leaveSpace,
  triggerSync,
  setSyncEnabled,
  recordChange,
  getSyncMode,
  getSyncStatus,
  getCurrentShareCode,
  getCurrentSpaceId,
  getSyncInfo,
  getSyncStatusFromServer,
  onSyncChange,
  onSyncModeChange,
  onSyncInfoChange,
  getPendingChangesCount,
  hasPendingChanges,
  clearSyncData,
  verifyShareCode,
  connectWebSocket
} from './SyncEngine'

// Network
export { startNetworkMonitor, stopNetworkMonitor, getOnline, getLastPingLatency, getNetworkQuality, onOnlineChange } from './NetworkMonitor'

// Scheduler
export { startScheduler, stopScheduler, triggerNow, onSyncSuccess, onSyncFailure } from './SyncScheduler'

// IndexedDB
export { getDB, closeDB, getSyncState, saveSyncState, batchPutAll } from './IndexedDBManager'

// Backup
export { startPeriodicBackup, stopPeriodicBackup, restoreFromBackup, restorePendingFromBackup } from './BackupManager'

// Queue
export { enqueue, getPendingBatch, markAsPushed, markAsFailed, retryFailed, clearQueue, getPendingCount, hasPending } from './PendingQueue'

// Hash
export { calculateDataHash, calculateEntityHash, hashMatches } from './DataHasher'

// Types
export type { SyncMode, SyncStatus, SyncInfo, SyncResult, PendingChange, ChangeStatus, SpaceInfo, EntityName, Operation } from './types'
export type { SyncError } from './ErrorHandler'
