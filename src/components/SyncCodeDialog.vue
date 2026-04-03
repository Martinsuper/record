<template>
  <view v-if="visible" class="dialog-overlay" @tap="handleOverlayClick">
    <view class="dialog-content" @tap.stop>
      <!-- 选择模式 -->
      <view v-if="mode === 'select'" class="select-mode">
        <text class="dialog-title">开启数据同步</text>
        <button class="option-btn create" @tap="handleCreateSpace">创建新空间</button>
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
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createSpace as apiCreateSpace, verifyShareCode, connectWebSocket } from '@/utils/syncManager'
import { useSyncStore } from '@/store/sync'
import { setStorage, STORAGE_KEYS } from '@/utils/storage'

const visible = ref(false)
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
  visible.value = true
}

function close() {
  visible.value = false
  mode.value = 'select'
}

function handleOverlayClick() {
  // 点击遮罩层不关闭，避免误操作
}

async function handleCreateSpace() {
  const result = await apiCreateSpace()
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

  if (result && result.valid) {
    setStorage(STORAGE_KEYS.SYNC_SHARE_CODE, inputCode.value.toUpperCase())
    if (result.spaceId) {
      setStorage(STORAGE_KEYS.SYNC_SPACE_ID, result.spaceId)
      syncStore.setSpaceId(result.spaceId)
    }
    syncStore.setShareCode(inputCode.value.toUpperCase())
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
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

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
  display: block;
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
    display: block;
  }

  .hint {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 20rpx;
    display: block;
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
    display: block;
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