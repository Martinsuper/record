<template>
  <u-popup :show="visible" mode="bottom" round="24" @close="onClose">
    <view class="event-form">
      <!-- Header -->
      <view class="form-header">
        <view class="header-icon">
          <u-icon name="plus-circle" size="32" color="#0D9488" />
        </view>
        <text class="form-title">添加事件</text>
        <view class="close-btn" @click="onClose">
          <u-icon name="close" size="20" color="#5EEAD4" />
        </view>
      </view>

      <!-- Form body -->
      <view class="form-body">
        <!-- Event name -->
        <view class="form-item">
          <view class="form-label">
            <u-icon name="edit-pen" size="16" color="#0D9488" />
            <text>事件名称</text>
          </view>
          <view class="input-wrapper">
            <u-input
              v-model="eventName"
              placeholder="请输入事件名称"
              border="none"
              :customStyle="{ fontSize: '32rpx', color: '#134E4A' }"
              :placeholderStyle="{ color: '#99F6E4' }"
            />
          </view>
        </view>

        <!-- Type picker -->
        <view class="form-item">
          <view class="form-label">
            <u-icon name="tags" size="16" color="#0D9488" />
            <text>事件类型</text>
          </view>
          <TypePicker v-model="eventTypeId" />
        </view>

        <!-- Time picker -->
        <view class="form-item">
          <view class="form-label">
            <u-icon name="clock" size="16" color="#0D9488" />
            <text>事件时间</text>
          </view>
          <view class="time-picker-row">
            <u-datetime-picker
              :show="showTimePicker"
              v-model="eventTime"
              mode="datetime"
              title="选择时间"
              @confirm="onTimeConfirm"
              @cancel="showTimePicker = false"
              @close="showTimePicker = false"
            />
            <view class="time-display" @click="showTimePicker = true">
              <u-icon name="calendar" size="20" color="#0D9488" />
              <text class="time-text">{{ formattedTime }}</text>
              <u-icon name="arrow-right" size="16" color="#5EEAD4" />
            </view>
          </view>
        </view>
      </view>

      <!-- Footer -->
      <view class="form-footer">
        <view class="btn-cancel" @click="onClose">
          <text>取消</text>
        </view>
        <view class="btn-save" @click="onSave">
          <u-icon name="checkmark" size="20" color="#ffffff" />
          <text>保存</text>
        </view>
      </view>
    </view>
  </u-popup>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useEventStore } from '@/store/event'
import TypePicker from './TypePicker.vue'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['close', 'save'])

const eventStore = useEventStore()

const eventName = ref('')
const eventTypeId = ref<string | null>(null)
const eventTime = ref(Date.now())
const showTimePicker = ref(false)

const formattedTime = computed(() => {
  const date = new Date(eventTime.value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
})

// Reset form when visible changes
watch(() => props.visible, (val) => {
  if (val) {
    eventName.value = ''
    eventTypeId.value = null
    eventTime.value = Date.now()
  }
})

function onTimeConfirm(e: { value: number }) {
  eventTime.value = e.value
  showTimePicker.value = false
}

function onSave() {
  // Validate
  if (!eventName.value.trim()) {
    uni.showToast({ title: '请输入事件名称', icon: 'none' })
    return
  }
  if (!eventTypeId.value) {
    uni.showToast({ title: '请选择事件类型', icon: 'none' })
    return
  }

  eventStore.addEvent({
    name: eventName.value.trim(),
    typeId: eventTypeId.value,
    time: eventTime.value
  })

  emit('save')
  emit('close')
  uni.showToast({ title: '事件已添加', icon: 'success' })
}

function onClose() {
  emit('close')
}
</script>

<style lang="scss" scoped>
.event-form {
  background: #ffffff;
  border-radius: 48rpx 48rpx 0 0;
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));

  .form-header {
    display: flex;
    align-items: center;
    margin-bottom: 32rpx;

    .header-icon {
      width: 64rpx;
      height: 64rpx;
      border-radius: 16rpx;
      background: #E6FFFA;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16rpx;
    }

    .form-title {
      flex: 1;
      font-size: 36rpx;
      font-weight: 700;
      color: #134E4A;
    }

    .close-btn {
      width: 64rpx;
      height: 64rpx;
      border-radius: 50%;
      background: #F0FDFA;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .form-body {
    .form-item {
      margin-bottom: 32rpx;

      .form-label {
        display: flex;
        align-items: center;
        gap: 8rpx;
        margin-bottom: 16rpx;

        text {
          font-size: 28rpx;
          font-weight: 600;
          color: #134E4A;
        }
      }

      .input-wrapper {
        background: #F0FDFA;
        border-radius: 16rpx;
        padding: 24rpx;
        border: 2rpx solid #D1E7E4;
        transition: border-color 0.2s ease;

        &:focus-within {
          border-color: #0D9488;
        }
      }

      .time-picker-row {
        .time-display {
          display: flex;
          align-items: center;
          background: #F0FDFA;
          border-radius: 16rpx;
          padding: 24rpx;
          border: 2rpx solid #D1E7E4;
          gap: 16rpx;

          .time-text {
            flex: 1;
            font-size: 32rpx;
            color: #134E4A;
            font-weight: 500;
          }
        }
      }
    }
  }

  .form-footer {
    display: flex;
    gap: 20rpx;
    margin-top: 40rpx;

    .btn-cancel {
      flex: 1;
      height: 96rpx;
      border-radius: 16rpx;
      background: #F0FDFA;
      display: flex;
      align-items: center;
      justify-content: center;

      text {
        font-size: 32rpx;
        font-weight: 600;
        color: #5EEAD4;
      }
    }

    .btn-save {
      flex: 2;
      height: 96rpx;
      border-radius: 16rpx;
      background: linear-gradient(135deg, #0D9488 0%, #14B8A6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8rpx;
      box-shadow: 0 8rpx 24rpx rgba(13, 148, 136, 0.3);

      text {
        font-size: 32rpx;
        font-weight: 600;
        color: #ffffff;
      }
    }
  }
}
</style>