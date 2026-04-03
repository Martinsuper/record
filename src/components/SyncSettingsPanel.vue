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
import { clearSyncData } from '@/utils/syncManager'

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
        clearSyncData()
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