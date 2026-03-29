<template>
  <u-popup :show="visible" mode="bottom" @close="onClose">
    <view class="event-form">
      <view class="form-header">
        <text class="form-title">添加事件</text>
        <u-icon name="close" @click="onClose" />
      </view>

      <view class="form-body">
        <!-- Event name -->
        <view class="form-item">
          <text class="form-label">事件名称</text>
          <u-input v-model="eventName" placeholder="请输入事件名称" />
        </view>

        <!-- Type picker -->
        <view class="form-item">
          <text class="form-label">事件类型</text>
          <TypePicker v-model="eventTypeId" />
        </view>

        <!-- Time picker -->
        <view class="form-item">
          <text class="form-label">时间</text>
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
            <text>{{ formattedTime }}</text>
            <u-icon name="arrow-right" />
          </view>
        </view>
      </view>

      <view class="form-footer">
        <u-button text="取消" @click="onClose" />
        <u-button text="保存" type="primary" @click="onSave" />
      </view>
    </view>
  </u-popup>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useEventStore } from '@/store/event'
import TypePicker from './TypePicker.vue'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['close', 'save'])

const eventStore = useEventStore()

const eventName = ref('')
const eventTypeId = ref(null)
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

function onTimeConfirm(e) {
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

<style scoped>
.event-form {
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  background-color: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.form-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #323233;
}

.form-body {
  margin-bottom: 32rpx;
}

.form-item {
  margin-bottom: 32rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #646566;
  margin-bottom: 16rpx;
}

.time-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  background-color: #f7f8fa;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #323233;
}

.form-footer {
  display: flex;
  gap: 24rpx;
}

.form-footer :deep(.u-button) {
  flex: 1;
}
</style>