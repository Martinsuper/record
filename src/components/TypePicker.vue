<template>
  <view class="type-picker">
    <!-- Current selection display + picker -->
    <view class="picker-trigger" @click="openPicker">
      <view v-if="selectedTypeData" class="selected-type">
        <view class="type-badge" :style="{ backgroundColor: selectedTypeData.color }">
          <u-icon name="star-fill" size="12" color="#ffffff" />
        </view>
        <text class="type-name">{{ selectedTypeData.name }}</text>
      </view>
      <text v-else class="placeholder">请选择类型</text>
      <u-icon name="arrow-down" size="16" color="#5EEAD4"></u-icon>
    </view>

    <!-- New type button -->
    <view class="new-type-btn" @click="openNewTypePopup">
      <u-icon name="plus" size="16" color="#ffffff"></u-icon>
    </view>

    <!-- Type picker popup -->
    <u-popup :show="showPicker" mode="bottom" round="24" @close="closePicker">
      <view class="picker-popup">
        <view class="picker-header">
          <text class="picker-title">选择类型</text>
          <view class="close-btn" @click="closePicker">
            <u-icon name="close" size="20" color="#5EEAD4"></u-icon>
          </view>
        </view>
        <scroll-view class="picker-content" scroll-y>
          <view
            v-for="type in eventTypeStore.types"
            :key="type.id"
            class="type-option"
            :class="{ selected: modelValue === type.id }"
            @click="selectType(type.id)"
          >
            <view class="type-badge" :style="{ backgroundColor: type.color }">
              <u-icon name="star-fill" size="12" color="#ffffff" />
            </view>
            <text class="type-name">{{ type.name }}</text>
            <u-icon v-if="modelValue === type.id" name="checkmark" size="20" color="#0D9488"></u-icon>
          </view>
          <view v-if="eventTypeStore.types.length === 0" class="empty-tip">
            <u-icon name="info-circle" size="24" color="#99F6E4" />
            <text>暂无类型，请新建</text>
          </view>
        </scroll-view>
        <view class="picker-footer">
          <view class="add-new-btn" @click="openNewTypePopup">
            <u-icon name="plus-circle" size="20" color="#0D9488" />
            <text>新建类型</text>
          </view>
        </view>
      </view>
    </u-popup>

    <!-- New type popup -->
    <u-popup :show="showNewTypePopup" mode="bottom" round="24" @close="closeNewTypePopup">
      <view class="new-type-popup">
        <view class="popup-header">
          <view class="header-icon">
            <u-icon name="plus-circle" size="28" color="#0D9488" />
          </view>
          <text class="popup-title">新建类型</text>
          <view class="close-btn" @click="closeNewTypePopup">
            <u-icon name="close" size="20" color="#5EEAD4"></u-icon>
          </view>
        </view>

        <view class="popup-content">
          <!-- Type name input -->
          <view class="form-item">
            <text class="form-label">类型名称</text>
            <view class="input-wrapper">
              <u-input
                v-model="newTypeName"
                placeholder="请输入类型名称"
                border="none"
                :customStyle="{ fontSize: '32rpx', color: '#134E4A' }"
              />
            </view>
          </view>

          <!-- Color picker -->
          <view class="form-item">
            <text class="form-label">选择颜色</text>
            <view class="color-grid">
              <view
                v-for="color in colorOptions"
                :key="color.value"
                class="color-option"
                :class="{ selected: newTypeColor === color.value }"
                :style="{ backgroundColor: color.value }"
                @click="selectColor(color.value)"
              >
                <u-icon v-if="newTypeColor === color.value" name="checkmark" size="20" color="#ffffff"></u-icon>
              </view>
            </view>
          </view>

          <!-- Preview -->
          <view class="form-item">
            <text class="form-label">预览效果</text>
            <view class="preview-card">
              <view class="type-tag" :style="{ backgroundColor: newTypeColor }">
                <u-icon name="star-fill" size="12" color="#ffffff" />
                <text class="tag-name">{{ newTypeName || '类型名称' }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="popup-footer">
          <view class="btn-cancel" @click="closeNewTypePopup">
            <text>取消</text>
          </view>
          <view class="btn-save" :class="{ disabled: !newTypeName.trim() }" @click="saveNewType">
            <u-icon name="checkmark" size="20" color="#ffffff" />
            <text>保存</text>
          </view>
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

// Color options - vibrant and distinct colors
const colorOptions = [
  { value: '#EF4444', label: '红色' },
  { value: '#F97316', label: '橙色' },
  { value: '#F59E0B', label: '黄色' },
  { value: '#10B981', label: '绿色' },
  { value: '#0D9488', label: '青色' },
  { value: '#3B82F6', label: '蓝色' },
  { value: '#6366F1', label: '靛蓝' },
  { value: '#8B5CF6', label: '紫色' },
  { value: '#EC4899', label: '粉色' },
  { value: '#64748B', label: '灰色' }
]

// Picker state
const showPicker = ref(false)
const showNewTypePopup = ref(false)

// New type form
const newTypeName = ref('')
const newTypeColor = ref('#0D9488')

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
  newTypeColor.value = '#0D9488'
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
  uni.showToast({ title: '类型已创建', icon: 'success' })
}
</script>

<style lang="scss" scoped>
.type-picker {
  display: flex;
  align-items: center;
  gap: 12rpx;

  .picker-trigger {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 24rpx;
    background: #F0FDFA;
    border-radius: 16rpx;
    border: 2rpx solid #D1E7E4;
    min-height: 80rpx;

    .selected-type {
      display: flex;
      align-items: center;
      gap: 12rpx;

      .type-badge {
        width: 36rpx;
        height: 36rpx;
        border-radius: 10rpx;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .type-name {
        font-size: 30rpx;
        font-weight: 500;
        color: #134E4A;
      }
    }

    .placeholder {
      font-size: 30rpx;
      color: #99F6E4;
    }
  }

  .new-type-btn {
    width: 80rpx;
    height: 80rpx;
    border-radius: 16rpx;
    background: linear-gradient(135deg, #0D9488 0%, #14B8A6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4rpx 12rpx rgba(13, 148, 136, 0.3);
  }
}

.picker-popup {
  background: #ffffff;
  border-radius: 48rpx 48rpx 0 0;
  padding: 32rpx;

  .picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;

    .picker-title {
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

  .picker-content {
    max-height: 600rpx;

    .type-option {
      display: flex;
      align-items: center;
      gap: 16rpx;
      padding: 24rpx 16rpx;
      border-radius: 12rpx;
      transition: background 0.2s ease;

      &:active {
        background: #F0FDFA;
      }

      &.selected {
        background: #E6FFFA;
      }

      .type-badge {
        width: 40rpx;
        height: 40rpx;
        border-radius: 12rpx;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .type-name {
        flex: 1;
        font-size: 30rpx;
        font-weight: 500;
        color: #134E4A;
      }
    }

    .empty-tip {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16rpx;
      padding: 60rpx;
      color: #5EEAD4;
      font-size: 28rpx;
    }
  }

  .picker-footer {
    margin-top: 24rpx;
    padding-top: 24rpx;
    border-top: 2rpx solid #E6FFFA;

    .add-new-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12rpx;
      padding: 24rpx;
      background: #F0FDFA;
      border-radius: 16rpx;
      border: 2rpx dashed #0D9488;

      text {
        font-size: 30rpx;
        font-weight: 600;
        color: #0D9488;
      }
    }
  }
}

.new-type-popup {
  background: #ffffff;
  border-radius: 48rpx 48rpx 0 0;
  padding: 32rpx;

  .popup-header {
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

    .popup-title {
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

  .popup-content {
    .form-item {
      margin-bottom: 32rpx;

      .form-label {
        display: block;
        font-size: 28rpx;
        font-weight: 600;
        color: #134E4A;
        margin-bottom: 16rpx;
      }

      .input-wrapper {
        background: #F0FDFA;
        border-radius: 16rpx;
        padding: 24rpx;
        border: 2rpx solid #D1E7E4;
      }

      .color-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 20rpx;

        .color-option {
          width: 72rpx;
          height: 72rpx;
          border-radius: 16rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;

          &.selected {
            transform: scale(1.1);
            box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.2);
          }
        }
      }

      .preview-card {
        background: #F0FDFA;
        border-radius: 16rpx;
        padding: 24rpx;

        .type-tag {
          display: inline-flex;
          align-items: center;
          gap: 8rpx;
          padding: 10rpx 20rpx;
          border-radius: 20rpx;

          .tag-name {
            font-size: 26rpx;
            font-weight: 500;
            color: #ffffff;
          }
        }
      }
    }
  }

  .popup-footer {
    display: flex;
    gap: 20rpx;
    margin-top: 16rpx;

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

      &.disabled {
        opacity: 0.5;
      }
    }
  }
}
</style>