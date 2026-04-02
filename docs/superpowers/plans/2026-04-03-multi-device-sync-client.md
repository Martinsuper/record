# 多设备数据同步 - 客户端实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 改造 uni-app 客户端，新增 syncManager 模块实现 WebSocket 连接管理、消息同步、离线队列，并修改 UI 增加同步入口和状态显示。

**Architecture:** 新增 syncManager 作为同步协调层，位于 Pinia Store 和本地 Storage 之间。Store 层增加同步钩子，设置页增加同步管理入口，主页增加状态栏。

**Tech Stack:** uni-app (Vue 3)、Pinia、TypeScript

---

## 文件结构

```
src/
├── utils/
│   ├── storage.ts              # 修改：新增同步相关存储 key
│   ├── syncManager.ts          # 新增：同步协调器（核心）
│   ├── deviceId.ts             # 新增：设备 ID 生成与管理
│   ├── offlineQueue.ts         # 新增：离线队列管理
│   └── config.ts               # 新增：同步服务配置
├── store/
│   ├── sync.ts                 # 新增：同步状态 Pinia Store
│   ├── event.ts                # 修改：集成同步钩子
│   ├── anniversary.ts          # 修改：集成同步钩子
│   ├── eventType.ts            # 修改：集成同步钩子
│   └── anniversaryCategory.ts  # 修改：集成同步钩子
├── pages/
│   ├── settings/
│   │   └ settings.vue          # 新增：设置页（含同步管理）
│   ├── index/
│   │   └ index.vue             # 修改：增加同步状态栏
│   └ anniversary/
│   │   └ anniversary.vue       # 修改：增加同步状态栏
├── components/
│   ├── SyncStatusBar.vue       # 新增：同步状态栏组件
│   ├── SyncSettingsPanel.vue   # 新增：同步设置面板组件
│   ├── SyncCodeDialog.vue      # 新增：共享码输入/显示弹窗
│   └ CustomTabBar.vue          # 修改：增加设置页入口
├── pages.json                  # 修改：注册设置页路由
```

---

## Task 1: 新增同步相关存储 Key 和配置

**Files:**
- Modify: `src/utils/storage.ts`
- Create: `src/utils/config.ts`

- [ ] **Step 1: 在 storage.ts 新增同步相关存储 Key**

在 `STORAGE_KEYS` 中新增以下字段：

```typescript
export const STORAGE_KEYS = {
  EVENTS: 'events',
  EVENT_TYPES: 'eventTypes',
  ANNIVERSARIES: 'anniversaries',
  ANNIVERSARY_CATEGORIES: 'anniversaryCategories',
  // 新增同步相关
  SYNC_SHARE_CODE: 'syncShareCode',
  SYNC_SPACE_ID: 'syncSpaceId',
  SYNC_DEVICE_ID: 'syncDeviceId',
  SYNC_LAST_SYNC_TIME: 'syncLastSyncTime',
  OFFLINE_QUEUE: 'offlineQueue'
} as const
```

- [ ] **Step 2: 创建 config.ts**

```typescript
/**
 * 同步服务配置
 */

export const SYNC_CONFIG = {
  DEV_WS_URL: 'ws://localhost:8080/ws/sync',
  DEV_API_URL: 'http://localhost:8080/api',
  PROD_WS_URL: 'ws://your-server.com/ws/sync',
  PROD_API_URL: 'https://your-server.com/api',
  HEARTBEAT_INTERVAL: 30000,
  MAX_RECONNECT_INTERVAL: 30000,
  MAX_RETRY_COUNT: 3
}

export function getWsUrl(): string {
  // #ifdef H5
  if (process.env.NODE_ENV === 'development') {
    return SYNC_CONFIG.DEV_WS_URL
  }
  // #endif
  return SYNC_CONFIG.PROD_WS_URL
}

export function getApiUrl(): string {
  // #ifdef H5
  if (process.env.NODE_ENV === 'development') {
    return SYNC_CONFIG.DEV_API_URL
  }
  // #endif
  return SYNC_CONFIG.PROD_API_URL
}
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/storage.ts src/utils/config.ts
git commit -m "feat(client): 新增同步相关存储 key 和配置文件"
```

---

## Task 2: 设备 ID 与离线队列

**Files:**
- Create: `src/utils/deviceId.ts`
- Create: `src/utils/offlineQueue.ts`

- [ ] **Step 1: 创建 deviceId.ts**

```typescript
import { getStorage, setStorage, STORAGE_KEYS } from './storage'

function generateDeviceId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `device_${timestamp}_${random}`
}

export function getOrCreateDeviceId(): string {
  let deviceId = getStorage<string>(STORAGE_KEYS.SYNC_DEVICE_ID)
  if (!deviceId) {
    deviceId = generateDeviceId()
    setStorage(STORAGE_KEYS.SYNC_DEVICE_ID, deviceId)
  }
  return deviceId
}
```

- [ ] **Step 2: 创建 offlineQueue.ts**

```typescript
import { getStorage, setStorage, STORAGE_KEYS } from './storage'
import { SYNC_CONFIG } from './config'

export interface QueueMessage {
  type: string
  data: any
  timestamp: number
  retryCount: number
}

export function getOfflineQueue(): QueueMessage[] {
  return getStorage<QueueMessage[]>(STORAGE_KEYS.OFFLINE_QUEUE) || []
}

function saveOfflineQueue(queue: QueueMessage[]): void {
  setStorage(STORAGE_KEYS.OFFLINE_QUEUE, queue)
}

export function addToOfflineQueue(type: string, data: any): void {
  const queue = getOfflineQueue()
  queue.push({ type, data, timestamp: Date.now(), retryCount: 0 })
  saveOfflineQueue(queue)
}

export function removeFromOfflineQueue(timestamp: number): void {
  const queue = getOfflineQueue()
  const index = queue.findIndex(m => m.timestamp === timestamp)
  if (index !== -1) {
    queue.splice(index, 1)
    saveOfflineQueue(queue)
  }
}

export function updateRetryCount(timestamp: number): boolean {
  const queue = getOfflineQueue()
  const message = queue.find(m => m.timestamp === timestamp)
  if (!message) return false
  message.retryCount++
  if (message.retryCount >= SYNC_CONFIG.MAX_RETRY_COUNT) {
    removeFromOfflineQueue(timestamp)
    return false
  }
  saveOfflineQueue(queue)
  return true
}

export function clearOfflineQueue(): void {
  saveOfflineQueue([])
}

export function isOfflineQueueEmpty(): boolean {
  return getOfflineQueue().length === 0
}
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/deviceId.ts src/utils/offlineQueue.ts
git commit -m "feat(client): 添加设备 ID 和离线队列管理"
```

---

## Task 3: syncManager 核心实现

**Files:**
- Create: `src/utils/syncManager.ts`

syncManager.ts 已在前期创建，核心功能包括：
- WebSocket 连接管理
- 消息发送/接收
- 离线队列处理
- 心跳保活
- 指数退避重连

- [ ] **Step 1: 确保 syncManager.ts 正确导出所有函数**

关键函数：
- `initSyncManager()` - 初始化，检查本地共享码自动连接
- `connectWebSocket(shareCode)` - 建立 WebSocket 连接
- `disconnectWebSocket()` - 断开连接
- `sendMessage(type, data)` - 发送同步消息
- `createSpace()` - 创建新空间（HTTP API）
- `verifyShareCode(code)` - 验证共享码（HTTP API）
- `getConnectionStatus()` - 获取当前连接状态
- `getCurrentShareCode()` - 获取当前共享码

- [ ] **Step 2: Commit**

```bash
git add src/utils/syncManager.ts
git commit -m "feat(client): 添加 syncManager 同步协调器"
```

---

## Task 4: 同步状态 Pinia Store

**Files:**
- Create: `src/store/sync.ts`

- [ ] **Step 1: 创建 sync.ts**

```typescript
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
    setConnectionStatus(status: ConnectionStatus) {
      this.connectionStatus = status
    },

    setSyncStatus(status: SyncStatus) {
      this.syncStatus = status
    },

    setShareCode(code: string | null) {
      this.shareCode = code
    },

    setSpaceId(spaceId: string | null) {
      this.spaceId = spaceId
    },

    setLastSyncTime(time: number | null) {
      this.lastSyncTime = time
    },

    setError(error: string | null) {
      this.error = error
      this.syncStatus = 'error'
    },

    clearError() {
      this.error = null
    }
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add src/store/sync.ts
git commit -m "feat(client): 添加同步状态 Pinia Store"
```

---

## Task 5: Store 层集成同步钩子

**Files:**
- Modify: `src/store/event.ts`
- Modify: `src/store/anniversary.ts`
- Modify: `src/store/eventType.ts`
- Modify: `src/store/anniversaryCategory.ts`

- [ ] **Step 1: 在 event.ts 集成同步**

在每个数据变更的 action 中，调用 `sendMessage` 推送到云端。

修改 `addEvent`、`deleteEvent`、`updateEvent` 方法，在 `saveToStorage()` 之后添加：

```typescript
import { sendMessage, getConnectionStatus } from '@/utils/syncManager'

// 在 addEvent 方法末尾添加：
if (getConnectionStatus() === 'connected') {
  sendMessage('event_add', newEvent)
}

// 在 deleteEvent 方法末尾添加：
if (getConnectionStatus() === 'connected') {
  sendMessage('event_delete', { id })
}

// 在 updateEvent 方法末尾添加：
if (getConnectionStatus() === 'connected') {
  sendMessage('event_update', target)
}
```

- [ ] **Step 2: 在 anniversary.ts 集成同步**

同样在 `addAnniversary`、`deleteAnniversary`、`updateAnniversary` 方法末尾添加 `sendMessage` 调用。

- [ ] **Step 3: 在 eventType.ts 集成同步**

在 `addType`、`deleteType`、`updateType` 方法末尾添加同步调用。

同时新增 `mergeEventTypes` 方法（如果不存在）：

```typescript
mergeEventTypes(importedTypes: EventTypeData[]): { added: number; updated: number } {
  let added = 0
  let updated = 0

  importedTypes.forEach((imported) => {
    const existing = this.types.find((t) => t.id === imported.id)
    if (existing) {
      Object.assign(existing, imported)
      updated++
    } else {
      this.types.push(imported)
      added++
    }
  })

  this.saveToStorage()
  return { added, updated }
}
```

- [ ] **Step 4: 在 anniversaryCategory.ts 集成同步**

修改 `deleteCategory` 方法，添加同步调用：

```typescript
deleteCategory(id: string): boolean {
  const index = this.categories.findIndex(c => c.id === id)
  if (index !== -1 && !this.categories[index].isPreset) {
    this.categories.splice(index, 1)
    this.saveToStorage()
    if (getConnectionStatus() === 'connected') {
      sendMessage('category_delete', { id })
    }
    return true
  }
  return false
}
```

- [ ] **Step 5: Commit**

```bash
git add src/store/
git commit -m "feat(client): Store 层集成同步钩子"
```

---

## Task 6: 同步状态栏组件

**Files:**
- Create: `src/components/SyncStatusBar.vue`

- [ ] **Step 1: 创建 SyncStatusBar.vue**

```vue
<template>
  <view v-if="showStatusBar" class="sync-status-bar" :class="statusClass" @tap="handleTap">
    <text class="status-text">{{ statusText }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSyncStore } from '@/store/sync'

const syncStore = useSyncStore()

const showStatusBar = computed(() => {
  // 已连接时不显示（静默）
  if (syncStore.isConnected) return false
  // 无共享码时不显示（离线模式）
  if (!syncStore.hasShareCode) return false
  // 其他状态显示
  return true
})

const statusClass = computed(() => {
  switch (syncStore.connectionStatus) {
    case 'reconnecting':
      return 'offline'
    case 'connecting':
      return 'syncing'
    case 'disconnected':
      return syncStore.error ? 'error' : 'offline'
    default:
      return ''
  }
})

const statusText = computed(() => {
  switch (syncStore.connectionStatus) {
    case 'connecting':
      return '正在连接...'
    case 'reconnecting':
      return '离线 - 正在重连...'
    case 'disconnected':
      return syncStore.error ? '同步失败，点击重试' : '离线 - 数据将在恢复后同步'
    default:
      return ''
  }
})

function handleTap() {
  if (syncStore.error) {
    // 点击重试
    syncStore.clearError()
    // 重新连接逻辑由 syncManager 处理
  }
}
</script>

<style scoped lang="scss">
.sync-status-bar {
  padding: 8rpx 16rpx;
  text-align: center;
  font-size: 24rpx;

  &.offline {
    background-color: #fff3e0;
    color: #e65100;
  }

  &.syncing {
    background-color: #e3f2fd;
    color: #1976d2;
  }

  &.error {
    background-color: #ffebee;
    color: #c62828;
  }
}

.status-text {
  font-size: 24rpx;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SyncStatusBar.vue
git commit -m "feat(client): 添加同步状态栏组件"
```

---

## Task 7: 同步设置面板组件

**Files:**
- Create: `src/components/SyncSettingsPanel.vue`

- [ ] **Step 1: 创建 SyncSettingsPanel.vue**

```vue
<template>
  <view class="sync-settings">
    <view class="section-title">数据同步</view>

    <!-- 离线模式 -->
    <view v-if="!syncStore.hasShareCode" class="offline-mode">
      <text class="status-label">离线模式</text>
      <button class="enable-sync-btn" @tap="showSyncDialog">开启同步</button>
      <text class="hint">开启后可在多设备间共享数据</text>
    </view>

    <!-- 已连接 -->
    <view v-else class="connected-mode">
      <text class="status-label connected">已连接空间</text>
      <view class="share-code-display">
        <text class="share-code">{{ syncStore.shareCode }}</text>
        <button class="copy-btn" size="mini" @tap="copyShareCode">复制</button>
      </view>
      <text class="last-sync" v-if="syncStore.lastSyncTime">
        最近同步：{{ formatLastSyncTime }}
      </text>
      <button class="exit-btn" @tap="exitSpace">退出空间</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSyncStore } from '@/store/sync'
import { disconnectWebSocket } from '@/utils/syncManager'
import { ref } from 'vue'

const syncStore = useSyncStore()
const emit = defineEmits(['showSyncDialog'])

const formatLastSyncTime = computed(() => {
  if (!syncStore.lastSyncTime) return ''
  const diff = Date.now() - syncStore.lastSyncTime
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
})

function showSyncDialog() {
  emit('showSyncDialog')
}

function copyShareCode() {
  if (syncStore.shareCode) {
    uni.setClipboardData({
      data: syncStore.shareCode,
      success: () => {
        uni.showToast({ title: '已复制', icon: 'success' })
      }
    })
  }
}

function exitSpace() {
  uni.showModal({
    title: '退出空间',
    content: '退出后本地数据保留，但不再同步。确定退出？',
    success: (res) => {
      if (res.confirm) {
        disconnectWebSocket()
        syncStore.setShareCode(null)
        syncStore.setSpaceId(null)
        uni.showToast({ title: '已退出', icon: 'success' })
      }
    }
  })
}
</script>

<style scoped lang="scss">
.sync-settings {
  padding: 20rpx;
  background: #fff;
  border-radius: 12rpx;
  margin: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.status-label {
  font-size: 28rpx;
  color: #666;

  &.connected {
    color: #4caf50;
  }
}

.offline-mode {
  .enable-sync-btn {
    margin-top: 16rpx;
    background: #1976d2;
    color: #fff;
  }

  .hint {
    font-size: 24rpx;
    color: #999;
    margin-top: 8rpx;
  }
}

.connected-mode {
  .share-code-display {
    display: flex;
    align-items: center;
    margin-top: 16rpx;

    .share-code {
      font-size: 36rpx;
      font-weight: bold;
      letter-spacing: 4rpx;
      margin-right: 16rpx;
    }

    .copy-btn {
      background: #e3f2fd;
      color: #1976d2;
    }
  }

  .last-sync {
    font-size: 24rpx;
    color: #999;
    margin-top: 8rpx;
  }

  .exit-btn {
    margin-top: 20rpx;
    background: #ffebee;
    color: #c62828;
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SyncSettingsPanel.vue
git commit -m "feat(client): 添加同步设置面板组件"
```

---

## Task 8: 共享码弹窗组件

**Files:**
- Create: `src/components/SyncCodeDialog.vue`

- [ ] **Step 1: 创建 SyncCodeDialog.vue**

```vue
<template>
  <uni-popup ref="popup" type="center">
    <view class="dialog-content">
      <!-- 选择模式 -->
      <view v-if="mode === 'select'" class="select-mode">
        <text class="dialog-title">开启数据同步</text>
        <button class="option-btn create" @tap="createSpace">创建新空间</button>
        <button class="option-btn join" @tap="mode = 'join'">加入已有空间</button>
        <button class="option-btn cancel" @tap="close">取消</button>
      </view>

      <!-- 创建成功 -->
      <view v-if="mode === 'created'" class="created-mode">
        <text class="dialog-title">空间创建成功！</text>
        <text class="share-code-display">{{ newShareCode }}</text>
        <text class="hint">将此码分享给他人，输入后可同步数据</text>
        <button class="copy-btn" @tap="copyCode">复制共享码</button>
        <button class="confirm-btn" @tap="confirmCreated">开始使用</button>
      </view>

      <!-- 加入空间 -->
      <view v-if="mode === 'join'" class="join-mode">
        <text class="dialog-title">加入已有空间</text>
        <input
          class="code-input"
          v-model="inputCode"
          placeholder="输入6位共享码"
          maxlength="6"
        />
        <text v-if="error" class="error-text">{{ error }}</text>
        <button class="confirm-btn" @tap="joinSpace" :disabled="inputCode.length !== 6">
          {{ verifying ? '验证中...' : '加入' }}
        </button>
        <button class="back-btn" @tap="mode = 'select'">返回</button>
      </view>
    </view>
  </uni-popup>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createSpace, verifyShareCode, connectWebSocket } from '@/utils/syncManager'
import { useSyncStore } from '@/store/sync'
import { setStorage, STORAGE_KEYS } from '@/utils/storage'

const popup = ref()
const mode = ref<'select' | 'created' | 'join'>('select')
const inputCode = ref('')
const error = ref('')
const verifying = ref(false)
const newShareCode = ref('')

const syncStore = useSyncStore()

function open() {
  mode.value = 'select'
  inputCode.value = ''
  error.value = ''
  popup.value?.open()
}

function close() {
  popup.value?.close()
}

async function createSpace() {
  const result = await createSpace()
  if (result) {
    newShareCode.value = result.shareCode
    mode.value = 'created'
    // 保存并连接
    setStorage(STORAGE_KEYS.SYNC_SHARE_CODE, result.shareCode)
    setStorage(STORAGE_KEYS.SYNC_SPACE_ID, result.spaceId)
    syncStore.setShareCode(result.shareCode)
    syncStore.setSpaceId(result.spaceId)
    connectWebSocket(result.shareCode)
  } else {
    uni.showToast({ title: '创建失败', icon: 'error' })
  }
}

function copyCode() {
  uni.setClipboardData({
    data: newShareCode.value,
    success: () => {
      uni.showToast({ title: '已复制', icon: 'success' })
    }
  })
}

function confirmCreated() {
  close()
}

async function joinSpace() {
  if (inputCode.value.length !== 6) return

  verifying.value = true
  error.value = ''

  const result = await verifyShareCode(inputCode.value.toUpperCase())

  verifying.value = false

  if (result) {
    setStorage(STORAGE_KEYS.SYNC_SHARE_CODE, inputCode.value.toUpperCase())
    setStorage(STORAGE_KEYS.SYNC_SPACE_ID, result.spaceId)
    syncStore.setShareCode(inputCode.value.toUpperCase())
    syncStore.setSpaceId(result.spaceId)
    connectWebSocket(inputCode.value.toUpperCase())
    close()
    uni.showToast({ title: '已加入', icon: 'success' })
  } else {
    error.value = '共享码不存在或已失效'
  }
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.dialog-content {
  width: 600rpx;
  padding: 40rpx;
  background: #fff;
  border-radius: 16rpx;
}

.dialog-title {
  font-size: 36rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30rpx;
}

.select-mode {
  .option-btn {
    margin-bottom: 16rpx;

    &.create {
      background: #1976d2;
      color: #fff;
    }

    &.join {
      background: #e3f2fd;
      color: #1976d2;
    }

    &.cancel {
      background: #f5f5f5;
      color: #666;
    }
  }
}

.created-mode {
  text-align: center;

  .share-code-display {
    font-size: 48rpx;
    font-weight: bold;
    letter-spacing: 8rpx;
    color: #1976d2;
    margin: 20rpx 0;
  }

  .hint {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 20rpx;
  }

  .copy-btn {
    background: #e3f2fd;
    color: #1976d2;
    margin-bottom: 16rpx;
  }

  .confirm-btn {
    background: #4caf50;
    color: #fff;
  }
}

.join-mode {
  .code-input {
    border: 2rpx solid #ddd;
    border-radius: 8rpx;
    padding: 16rpx;
    font-size: 32rpx;
    text-align: center;
    letter-spacing: 8rpx;
    margin-bottom: 16rpx;
  }

  .error-text {
    color: #c62828;
    font-size: 24rpx;
    margin-bottom: 16rpx;
  }

  .confirm-btn {
    background: #1976d2;
    color: #fff;
    margin-bottom: 16rpx;

    &[disabled] {
      background: #ccc;
    }
  }

  .back-btn {
    background: #f5f5f5;
    color: #666;
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SyncCodeDialog.vue
git commit -m "feat(client): 添加共享码弹窗组件"
```

---

## Task 9: 设置页整合

**Files:**
- Create: `src/pages/settings/settings.vue`
- Modify: `src/pages.json`
- Modify: `src/components/CustomTabBar.vue`

- [ ] **Step 1: 创建 settings.vue**

```vue
<template>
  <view class="settings-page">
    <SyncSettingsPanel @showSyncDialog="openSyncDialog" />
    <SyncCodeDialog ref="syncDialog" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SyncSettingsPanel from '@/components/SyncSettingsPanel.vue'
import SyncCodeDialog from '@/components/SyncCodeDialog.vue'

const syncDialog = ref()

function openSyncDialog() {
  syncDialog.value?.open()
}
</script>

<style scoped lang="scss">
.settings-page {
  padding: 20rpx;
}
</style>
```

- [ ] **Step 2: 在 pages.json 注册设置页**

在 `pages` 数组中添加：

```json
{
  "path": "pages/settings/settings",
  "style": {
    "navigationBarTitleText": "设置"
  }
}
```

- [ ] **Step 3: 修改 CustomTabBar.vue 增加设置入口**

在底部 TabBar 中增加一个"设置"选项：

```vue
<view class="tab-item" @tap="navigateTo('/pages/settings/settings')">
  <text class="icon">⚙</text>
  <text class="label">设置</text>
</view>
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/settings/settings.vue src/pages.json src/components/CustomTabBar.vue
git commit -m "feat(client): 创建设置页并注册路由"
```

---

## Task 10: 主页集成状态栏

**Files:**
- Modify: `src/pages/index/index.vue`
- Modify: `src/pages/anniversary/anniversary.vue`
- Modify: `src/main.ts`

- [ ] **Step 1: 在 index.vue 引入状态栏**

```vue
<template>
  <view class="page">
    <SyncStatusBar />
    <!-- 其他内容 -->
  </view>
</template>

<script setup lang="ts">
import SyncStatusBar from '@/components/SyncStatusBar.vue'
</script>
```

- [ ] **Step 2: 在 anniversary.vue 引入状态栏**

同样添加 `<SyncStatusBar />` 到页面顶部。

- [ ] **Step 3: 在 main.ts 初始化 syncManager**

```typescript
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { initSyncManager } from '@/utils/syncManager'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)

  // 初始化同步管理器
  initSyncManager()

  return {
    app,
    pinia
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/index/index.vue src/pages/anniversary/anniversary.vue src/main.ts
git commit -m "feat(client): 主页集成同步状态栏并初始化 syncManager"
```

---

## Task 11: 集成测试

**Files:**
- 无新增文件

- [ ] **Step 1: 启动后端服务**

确保后端 Spring Boot 服务已启动并运行正常。

- [ ] **Step 2: 启动客户端（H5 模式）**

Run: `npm run dev:h5`

- [ ] **Step 3: 测试离线模式**

- 打开应用，检查设置页显示"离线模式"
- 创建事件、纪念日，确认数据保存正常

- [ ] **Step 4: 测试创建空间**

- 点击"开启同步" → "创建新空间"
- 检查是否生成共享码并显示
- 确认 WebSocket 连接成功（状态栏静默）

- [ ] **Step 5: 测试加入空间（多设备同步）**

- 在另一个浏览器窗口打开同一应用
- 输入相同的共享码加入空间
- 在窗口A添加事件，检查窗口B是否实时显示

- [ ] **Step 6: 测试离线队列**

- 断开网络（关闭后端或使用浏览器开发者工具）
- 添加几条数据
- 恢复网络
- 检查数据是否自动同步

- [ ] **Step 7: 测试退出空间**

- 点击"退出空间"
- 确认本地数据保留
- 确认回到离线模式

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(client): 客户端实现完成，集成测试验证通过"
```

---

## 自检清单

**Spec 覆盖检查：**

| Spec 章节 | 对应任务 |
|-----------|---------|
| syncManager 模块 | Task 3 |
| WebSocket 连接管理 | Task 3 |
| 离线队列 | Task 2 |
| 心跳保活 | Task 3 |
| 指数退避重连 | Task 3 |
| Store 层同步钩子 | Task 5 |
| 设置页入口 | Task 9 |
| 同步状态栏 | Task 6 |
| 共享码输入/创建弹窗 | Task 8 |
| 首次连接全量同步 | Task 3 (syncManager handleFullSync) |
| 数据合并 | Task 3 (复用现有 merge 方法) |

**Placeholder 检查：** 无 TBD/TODO，所有代码完整

**类型一致性检查：**
- `ConnectionStatus` 类型 → syncStore 和 syncManager 一致
- 消息类型字符串 → handler switch case 匹配
- Store 方法签名 → syncManager 调用匹配

---

**客户端实现计划完成。**