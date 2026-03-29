<template>
  <view class="type-picker">
    <!-- Current selection display + picker -->
    <view class="picker-trigger" @click="openPicker">
      <view v-if="selectedTypeData" class="selected-type">
        <view class="type-color-dot" :style="{ backgroundColor: selectedTypeData.color }"></view>
        <text class="type-name">{{ selectedTypeData.name }}</text>
      </view>
      <text v-else class="placeholder">请选择类型</text>
      <u-icon name="arrow-down" size="14" color="#999999"></u-icon>
    </view>

    <!-- New type button -->
    <view class="new-type-btn" @click="openNewTypePopup">
      <u-icon name="plus" size="14"></u-icon>
      <text>新建类型</text>
    </view>

    <!-- Type picker popup -->
    <u-popup :show="showPicker" mode="bottom" round="12" @close="closePicker">
      <view class="picker-popup">
        <view class="picker-header">
          <text class="picker-title">选择类型</text>
          <u-icon name="close" size="18" color="#999999" @click="closePicker"></u-icon>
        </view>
        <scroll-view class="picker-content" scroll-y>
          <view
            v-for="type in eventTypeStore.types"
            :key="type.id"
            class="type-option"
            :class="{ selected: modelValue === type.id }"
            @click="selectType(type.id)"
          >
            <view class="type-color-dot" :style="{ backgroundColor: type.color }"></view>
            <text class="type-name">{{ type.name }}</text>
            <u-icon v-if="modelValue === type.id" name="checkmark" size="16" color="#2979ff"></u-icon>
          </view>
          <view v-if="eventTypeStore.types.length === 0" class="empty-tip">
            <text>暂无类型，请新建</text>
          </view>
        </scroll-view>
      </view>
    </u-popup>

    <!-- New type popup -->
    <u-popup :show="showNewTypePopup" mode="bottom" round="12" @close="closeNewTypePopup">
      <view class="new-type-popup">
        <view class="popup-header">
          <text class="popup-title">新建类型</text>
          <u-icon name="close" size="18" color="#999999" @click="closeNewTypePopup"></u-icon>
        </view>
        <view class="popup-content">
          <view class="input-wrapper">
            <u-input
              v-model="newTypeName"
              placeholder="请输入类型名称"
              border="surround"
              clearable
            ></u-input>
          </view>
          <view class="color-picker">
            <text class="color-label">选择颜色</text>
            <view class="color-options">
              <view
                v-for="color in colorOptions"
                :key="color.value"
                class="color-option"
                :class="{ selected: newTypeColor === color.value }"
                :style="{ backgroundColor: color.value }"
                @click="selectColor(color.value)"
              >
                <u-icon v-if="newTypeColor === color.value" name="checkmark" size="14" color="#ffffff"></u-icon>
              </view>
            </view>
          </view>
          <view class="popup-preview">
            <text class="preview-label">预览</text>
            <view class="preview-item">
              <view class="type-color-dot" :style="{ backgroundColor: newTypeColor }"></view>
              <text class="type-name">{{ newTypeName || '类型名称' }}</text>
            </view>
          </view>
        </view>
        <view class="popup-footer">
          <u-button type="primary" text="保存" :disabled="!newTypeName.trim()" @click="saveNewType"></u-button>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEventTypeStore } from '@/store/eventType'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const eventTypeStore = useEventTypeStore()

// Color options
const colorOptions = [
  { value: '#ff4d4f', label: '红' },
  { value: '#2979ff', label: '蓝' },
  { value: '#52c41a', label: '绿' },
  { value: '#722ed1', label: '紫' },
  { value: '#fa8c16', label: '橙' },
  { value: '#13c2c2', label: '青' }
]

// Picker state
const showPicker = ref(false)
const showNewTypePopup = ref(false)

// New type form
const newTypeName = ref('')
const newTypeColor = ref('#2979ff')

// Get selected type data
const selectedTypeData = computed(() => {
  if (!props.modelValue) return null
  return eventTypeStore.getTypeById(props.modelValue)
})

// Open/close picker
function openPicker() {
  showPicker.value = true
}

function closePicker() {
  showPicker.value = false
}

// Select type
function selectType(typeId: string) {
  emit('update:modelValue', typeId)
  emit('change', typeId)
  closePicker()
}

// Open new type popup
function openNewTypePopup() {
  newTypeName.value = ''
  newTypeColor.value = '#2979ff'
  showNewTypePopup.value = true
  closePicker()
}

function closeNewTypePopup() {
  showNewTypePopup.value = false
}

// Select color
function selectColor(color: string) {
  newTypeColor.value = color
}

// Save new type
function saveNewType() {
  if (!newTypeName.value.trim()) return

  eventTypeStore.addType({
    name: newTypeName.value.trim(),
    color: newTypeColor.value
  })

  // Get the newly added type (last one in the array)
  const newTypes = eventTypeStore.types
  const addedType = newTypes[newTypes.length - 1]

  if (addedType) {
    emit('update:modelValue', addedType.id)
    emit('change', addedType.id)
  }

  closeNewTypePopup()
}
</script>

<style lang="scss" scoped>
.type-picker {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.picker-trigger {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  min-height: 72rpx;

  .selected-type {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  .type-color-dot {
    width: 20rpx;
    height: 20rpx;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .type-name {
    font-size: 28rpx;
    color: #333333;
  }

  .placeholder {
    font-size: 28rpx;
    color: #999999;
  }
}

.new-type-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 20rpx;
  background-color: #2979ff;
  border-radius: 8rpx;
  white-space: nowrap;

  text {
    font-size: 26rpx;
    color: #ffffff;
  }
}

.picker-popup {
  padding: 24rpx;

  .picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;

    .picker-title {
      font-size: 32rpx;
      font-weight: 500;
      color: #333333;
    }
  }

  .picker-content {
    max-height: 600rpx;
  }

  .type-option {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 20rpx 16rpx;
    border-radius: 8rpx;

    &.selected {
      background-color: #e6f4ff;
    }

    .type-color-dot {
      width: 24rpx;
      height: 24rpx;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .type-name {
      flex: 1;
      font-size: 28rpx;
      color: #333333;
    }
  }

  .empty-tip {
    text-align: center;
    padding: 40rpx;
    color: #999999;
    font-size: 28rpx;
  }
}

.new-type-popup {
  padding: 24rpx;

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;

    .popup-title {
      font-size: 32rpx;
      font-weight: 500;
      color: #333333;
    }
  }

  .popup-content {
    .input-wrapper {
      margin-bottom: 32rpx;
    }

    .color-picker {
      margin-bottom: 32rpx;

      .color-label {
        display: block;
        font-size: 28rpx;
        color: #333333;
        margin-bottom: 16rpx;
      }

      .color-options {
        display: flex;
        gap: 24rpx;
        flex-wrap: wrap;

        .color-option {
          width: 64rpx;
          height: 64rpx;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;

          &.selected {
            transform: scale(1.15);
            box-shadow: 0 0 0 4rpx rgba(0, 0, 0, 0.1);
          }
        }
      }
    }

    .popup-preview {
      .preview-label {
        display: block;
        font-size: 28rpx;
        color: #333333;
        margin-bottom: 16rpx;
      }

      .preview-item {
        display: flex;
        align-items: center;
        gap: 12rpx;
        padding: 16rpx 20rpx;
        background-color: #f5f5f5;
        border-radius: 8rpx;
        width: fit-content;

        .type-color-dot {
          width: 20rpx;
          height: 20rpx;
          border-radius: 50%;
        }

        .type-name {
          font-size: 28rpx;
          color: #333333;
        }
      }
    }
  }

  .popup-footer {
    margin-top: 32rpx;
  }
}
</style>