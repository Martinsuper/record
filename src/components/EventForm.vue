<template>
  <u-popup :show="visible" mode="bottom" round="24" @close="onClose">
    <view class="event-form glass-card">
      <!-- Header -->
      <view class="form-header">
        <view class="header-icon">
          <text class="fa-solid fa-plus"></text>
        </view>
        <text class="form-title gradient-text">添加事件</text>
        <view class="close-btn" @click="onClose">
          <text class="fa-solid fa-times"></text>
        </view>
      </view>

      <!-- Form body -->
      <view class="form-body">
        <!-- Event name -->
        <view class="form-item">
          <view class="form-label">
            <text class="fa-solid fa-pen"></text>
            <text>事件名称</text>
          </view>
          <view class="input-wrapper">
            <u-input
              v-model="eventName"
              placeholder="请输入事件名称"
              border="none"
              :customStyle="{ fontSize: '32rpx', color: '#1E1B4B' }"
              :placeholderStyle="{ color: '#9CA3AF' }"
            />
          </view>
        </view>

        <!-- Type picker -->
        <view class="form-item">
          <view class="form-label">
            <text class="fa-solid fa-tags"></text>
            <text>事件类型</text>
          </view>
          <TypePicker v-model="eventTypeId" />
        </view>

        <!-- Time picker -->
        <view class="form-item">
          <view class="form-label">
            <text class="fa-solid fa-clock"></text>
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
              <text class="fa-solid fa-calendar"></text>
              <text class="time-text">{{ formattedTime }}</text>
              <text class="fa-solid fa-chevron-right"></text>
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
          <text class="fa-solid fa-check"></text>
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
  border-radius: $radius-xl $radius-xl 0 0;
  padding: $spacing-lg;
  padding-bottom: calc($spacing-lg + env(safe-area-inset-bottom));

  .form-header {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-xl;

    .header-icon {
      width: 64rpx;
      height: 64rpx;
      border-radius: $radius-lg;
      background: $gradient-aurora;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: $spacing-md;

      .fa-solid {
        font-size: 28rpx;
        color: #ffffff;
      }
    }

    .form-title {
      flex: 1;
      font-size: 36rpx;
      font-weight: 700;
    }

    .close-btn {
      width: 56rpx;
      height: 56rpx;
      border-radius: $radius-full;
      background: rgba(99, 102, 241, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;

      .fa-solid {
        font-size: 18rpx;
        color: $text-secondary;
      }
    }
  }

  .form-body {
    .form-item {
      margin-bottom: $spacing-xl;

      .form-label {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        margin-bottom: $spacing-md;

        .fa-solid {
          font-size: 16rpx;
          color: $accent-indigo;
        }

        text {
          font-size: 28rpx;
          font-weight: 600;
          color: $text-primary;
        }
      }

      .input-wrapper {
        background: rgba(99, 102, 241, 0.05);
        border-radius: $radius-lg;
        padding: $spacing-md;
        border: 1px solid rgba(99, 102, 241, 0.1);
        transition: all $transition-fast;

        &:focus-within {
          border-color: $accent-indigo;
          background: rgba(99, 102, 241, 0.08);
        }
      }

      .time-picker-row {
        .time-display {
          display: flex;
          align-items: center;
          background: rgba(99, 102, 241, 0.05);
          border-radius: $radius-lg;
          padding: $spacing-md;
          border: 1px solid rgba(99, 102, 241, 0.1);
          gap: $spacing-md;

          .fa-solid {
            font-size: 20rpx;
            color: $accent-indigo;
          }

          .time-text {
            flex: 1;
            font-size: 32rpx;
            color: $text-primary;
            font-weight: 500;
          }
        }
      }
    }
  }

  .form-footer {
    display: flex;
    gap: $spacing-md;
    margin-top: $spacing-xl;

    .btn-cancel {
      flex: 1;
      height: 88rpx;
      border-radius: $radius-lg;
      background: rgba(99, 102, 241, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;

      text {
        font-size: 32rpx;
        font-weight: 600;
        color: $text-secondary;
      }
    }

    .btn-save {
      flex: 2;
      height: 88rpx;
      border-radius: $radius-lg;
      background: $gradient-primary;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-sm;
      box-shadow: $shadow-glow;

      .fa-solid {
        font-size: 20rpx;
        color: #ffffff;
      }

      text {
        font-size: 32rpx;
        font-weight: 600;
        color: #ffffff;
      }
    }
  }
}
</style>