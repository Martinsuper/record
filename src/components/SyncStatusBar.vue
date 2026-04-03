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