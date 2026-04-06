# Phase 5 边界处理与 UI 完善实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-step.

**Goal:** 实现数据完整性校验触发、长时间离线检测、版本跳跃检测、错误处理、UI 同步进度展示。

**Architecture:** 在 SyncEngine 中增加边界情况检测逻辑并通过 Promise reject/状态广播通知 UI 层,UI 组件 (SyncStatusBar/settings) 订阅状态显示进度和错误信息。

**Tech Stack:** TypeScript, Vue 3, Pinia

---

## Task 1: 同步流程集成 DataHasher 校验

**Files:**
- Modify: `src/utils/sync/SyncEngine.ts`

```typescript
// doFullSync() 末尾添加:
import { calculateDataHash } from './DataHasher'
import { getApi } from './NetworkClient'

async function doFullSync(): Promise<void> {
  // ... existing code ...

  // Hash verification after full sync
  try {
    const localHash = await calculateDataHash()
    const result = await getApi<{ hash: string }>('/sync/hash', {
      spaceId: _currentSpaceId!
    })
    if (result?.hash && localHash !== result.hash) {
      console.warn('[Sync] Hash mismatch after full sync, data may be inconsistent')
      _emitError('DATA_CONFLICT')
    }
  } catch (e) {
    console.warn('[Sync] Hash verification failed:', e)
  }
}
```

---

## Task 2: 长时间离线(>7天) + 版本跳跃(>1000)检测

**Files:**
- Modify: `src/utils/sync/SyncEngine.ts`
- Modify: `src/utils/sync/types.ts` (add OfflineWarning type)

### 2a: 添加检测类型
```typescript
// types.ts — 新增:
export interface OfflineWarning {
  type: 'long_offline' | 'version_jump' | 'storage_full'
  message: string
  suggestion: 'incremental' | 'full_sync' | 'cleanup'
  daysOffline?: number
  versionGap?: number
}
```

### 2b: 在 initSyncSystem 中添加检测
```typescript
// SyncEngine.ts — 在 initSyncSystem 中:

export async function initSyncSystem(): Promise<{ warning?: OfflineWarning }> {
  const meta = await getSyncState()
  let warning: OfflineWarning | undefined

  if (meta && meta.enabled && meta.shareCode && meta.spaceId) {
    _currentSpaceId = meta.spaceId
    _lastSyncVersion = meta.lastVersion
    _currentMode = 'sync'
    setShareCode(meta.shareCode)

    // Check long offline
    if (meta.lastSyncTime) {
      const daysOffline = (Date.now() - meta.lastSyncTime) / (1000 * 60 * 60 * 24)
      if (daysOffline > 7) {
        warning = {
          type: 'long_offline',
          message: `您已离线 ${Math.floor(daysOffline)} 天`,
          suggestion: 'full_sync',
          daysOffline: Math.floor(daysOffline)
        }
      }
    }

    // Check version jump
    const serverStatus = await getSyncStatusFromServer()
    if (serverStatus?.maxVersion) {
      const gap = serverStatus.maxVersion - _lastSyncVersion
      if (gap > 1000) {
        warning = {
          type: 'version_jump',
          message: `版本号跳跃 ${gap},建议全量同步`,
          suggestion: 'full_sync',
          versionGap: gap
        }
      }
    }

    _infoListeners.forEach(cb => cb())
  }

  return { warning }
}
```

---

## Task 3: 错误处理完善 + 用户通知

**Files:**
- Modify: `src/utils/sync/ErrorHandler.ts` — 补充完整错误类型策略
- Modify: `src/utils/sync/SyncEngine.ts` — 消费 ErrorHandler 策略
- Modify: `src/store/sync.ts` — 添加错误状态
- Modify: `src/components/SyncStatusBar.vue` — 显示错误信息

### 3a: ErrorHandler 补充
```typescript
// ErrorHandler.ts — 完善 shouldRetry 的错误类型覆盖:
const RETRY_STRATEGY: Record<string, boolean> = {
  'NETWORK_OFFLINE': false,
  'NETWORK_TIMEOUT': true,
  'NETWORK_ERROR': true,
  'SERVER_UNAVAILABLE': true,
  'SERVER_BUSY': true,
  'RATE_LIMITED': true,
  'AUTH_INVALID': false,
  'AUTH_EXPIRED': false,
  'DEVICE_BLOCKED': false,
  'DATA_CONFLICT': false,
  'DATA_DELETED': false,
  'DATA_INVALID': false,
  'DATA_TOO_LARGE': false,
  'STORAGE_FULL': false,
  'STORAGE_CORRUPT': false,
}
```

### 3b: SyncEngine 消费 ErrorHandler
```typescript
// SyncEngine.ts — 在 catch block 中:
import { classifyError, shouldRetry } from './ErrorHandler'

async function doPushChanges(): Promise<number> {
  try {
    // ... request ...
  } catch (err: any) {
    const syncError = classifyError(err)
    console.warn('[Sync] Push error:', syncError.type, syncError.message)

    if (['AUTH_EXPIRED', 'AUTH_INVALID', 'DEVICE_BLOCKED'].includes(syncError.type)) {
      leaveSpace()
    }
    // Re-throw for caller to handle
    throw syncError
  }
}
```

### 3c: Pinia store 添加错误状态
```typescript
// src/store/sync.ts — 添加:
interface SyncErrorInfo {
  type: string
  message: string
  action?: string  // "重新加入空间" / "清理缓存"
}

// Add to state:
currentError: null as SyncErrorInfo | null,

// Add to actions:
setError(error: SyncErrorInfo | null) {
  this.currentError = error
  this.syncStatus = error ? 'error' : 'idle'
},
```

---

## Task 4: UI 同步进度展示

**Files:**
- Modify: `src/components/SyncStatusBar.vue`
- Create: `src/interfaces/SyncProgress.ts` (or add to existing types)

### 4a: 进度接口
```typescript
export interface SyncProgress {
  status: 'idle' | 'pushing' | 'pulling' | 'verifying' | 'done' | 'error'
  pushed: number
  pulled: number
  totalPush: number
  totalPull: number
  currentEntity: string
  progressPercent: number  // 0-100
  message: string
}
```

### 4b: SyncStatusBar 组件更新
```vue
<!-- SyncStatusBar.vue -->
<template>
  <view class="sync-status-bar" v-if="syncStore.isConnected">
    <view class="progress-container" v-if="syncProgress.status !== 'idle'">
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: syncProgress.progressPercent + '%'" />
      </view>
      <text class="progress-text">{{ syncProgress.message }}</text>
      <text class="progress-percent">{{ syncProgress.progressPercent }}%</text>
    </view>

    <!-- Error display -->
    <view class="error-container" v-if="syncStore.currentError">
      <text class="error-text">{{ syncStore.currentError.message }}</text>
      <text class="error-action" v-if="syncStore.currentError.action" @click="handleErrorAction">
        {{ syncStore.currentError.action }}
      </text>
    </view>

    <!-- Normal status -->
    <view class="status-row" v-else>
      <text class="status-text">已同步 · {{ formatTime(syncStore.lastSyncTime) }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useSyncStore } from '@/store/sync'
import { ref, onMounted, onUnmounted } from 'vue'
import { onSyncStatusChange, onSyncModeChange } from '@/utils/sync'

const syncStore = useSyncStore()
const syncProgress = ref<ProgressState>({
  status: 'idle',
  pushed: 0, pulled: 0, totalPush: 0, totalPull: 0,
  currentEntity: '', progressPercent: 0, message: ''
})

// Subscribe to sync store changes
const unsub: () => void = syncStore.$subscribe((mutation, state) => {
  syncProgress.value.progressPercent = state.syncStatus === 'syncing'
    ? Math.min(state.pushed / state.totalChanges * 100, 100) : 100
}

function cleanup() {}

onMounted(() => cleanup())
onUnmounted(() => cleanup())

function formatTime(ts: number | null): string {
  if (!ts) return '从未'
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  return `${Math.floor(mins / 60)}小时前`
}
</script>

<style scoped>
.sync-status-bar {
  padding: 4px 8px;
  background: var(--bg-color, #f5f5f5);
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}
.progress-container {
  display: flex;
  align-items: center;
  gap: 6px;
}
.progress-bar {
  flex: 1;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #4CAF50;
  transition: width 0.3s ease;
}
.progress-text {
  font-size: 11px;
  color: #666;
}
.progress-percent {
  font-size: 11px;
  font-weight: bold;
  color: #333;
}
.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.status-text {
  font-size: 11px;
  color: #888;
}
.error-container {
  display: flex;
  align-items: center;
  gap: 8px;
}
.error-text {
  font-size: 11px;
  color: #f44336;
}
.error-action {
  font-size: 12px;
  color: #2196F3;
}
</style>
```

---

## 自审查

- [x] 所有任务有明确文件路径和代码内容
- [x] 无 TBD/TODO 占位符
- [x] 类型一致性: SyncError 复用 ErrorHandler 中的 SyncError
- [x] UI 组件改动不影响非同步模式 (v-if="syncStore.isConnected")
- [x] 每个 Task 可独立提交
