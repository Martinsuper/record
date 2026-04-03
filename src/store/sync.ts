import { defineStore } from 'pinia'
import { getStorage, STORAGE_KEYS } from '@/utils/storage'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

export const useSyncStore = defineStore('sync', {
  state: () => ({
    connectionStatus: 'disconnected' as ConnectionStatus,
    syncStatus: 'idle' as SyncStatus,
    shareCode: getStorage<string>(STORAGE_KEYS.SYNC_SHARE_CODE) || null,
    spaceId: getStorage<string>(STORAGE_KEYS.SYNC_SPACE_ID) || null,
    lastSyncTime: getStorage<number>(STORAGE_KEYS.SYNC_LAST_SYNC_TIME) || null,
    error: null as string | null
  }),

  getters: {
    isConnected: (state): boolean => state.connectionStatus === 'connected',
    isOffline: (state): boolean => state.connectionStatus === 'disconnected' || state.connectionStatus === 'reconnecting',
    hasShareCode: (state): boolean => !!state.shareCode
  },

  actions: {
    setConnectionStatus(status: ConnectionStatus) { this.connectionStatus = status },
    setSyncStatus(status: SyncStatus) { this.syncStatus = status },
    setShareCode(code: string | null) { this.shareCode = code },
    setSpaceId(spaceId: string | null) { this.spaceId = spaceId },
    setLastSyncTime(time: number | null) { this.lastSyncTime = time },
    setError(error: string | null) { this.error = error; this.syncStatus = 'error' },
    clearError() { this.error = null }
  }
})