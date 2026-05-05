<template>
  <view class="type-picker">
    <!-- Current selection display + picker -->
    <view class="picker-trigger glass-card" @click="openPicker">
      <view v-if="selectedTypeData" class="selected-type">
        <view class="type-badge" :style="{ backgroundColor: selectedTypeData.color }">
          <text class="fa-solid">&#xf005;</text>
        </view>
        <text class="type-name">{{ selectedTypeData.name }}</text>
      </view>
      <text v-else class="placeholder">请选择类型</text>
      <view v-if="showClear && modelValue" class="clear-btn" @click.stop="clearSelection">
        <text class="fa-solid">&#xf00d;</text>
      </view>
      <text v-else class="fa-solid arrow-icon">&#xf078;</text>
    </view>

    <!-- New type button -->
    <view class="new-type-btn" @click="openNewTypePopup">
      <text class="fa-solid">&#xf067;</text>
    </view>

    <!-- Type picker popup -->
    <u-popup :show="showPicker" mode="bottom" round="24" @close="closePicker">
      <view class="picker-popup glass-card">
        <view class="picker-header">
          <text class="picker-title gradient-text">选择类型</text>
          <view class="close-btn" @click="closePicker">
            <text class="fa-solid">&#xf00d;</text>
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
              <text class="fa-solid">&#xf005;</text>
            </view>
            <text class="type-name">{{ type.name }}</text>
            <text v-if="modelValue === type.id" class="fa-solid">&#xf00c;</text>
          </view>
          <view v-if="eventTypeStore.types.length === 0" class="empty-tip">
            <text class="fa-solid">&#xf01c;</text>
            <text>暂无类型，请新建</text>
          </view>
        </scroll-view>
        <view class="picker-footer">
          <view class="add-new-btn" @click="openNewTypePopup">
            <text class="fa-solid">&#xf067;</text>
            <text>新建类型</text>
          </view>
        </view>
      </view>
    </u-popup>

    <!-- New type popup -->
    <u-popup :show="showNewTypePopup" mode="bottom" round="24" @close="closeNewTypePopup">
      <view class="new-type-popup glass-card">
        <view class="popup-header">
          <view class="header-icon">
            <text class="fa-solid">&#xf067;</text>
          </view>
          <text class="popup-title gradient-text">新建类型</text>
          <view class="close-btn" @click="closeNewTypePopup">
            <text class="fa-solid">&#xf00d;</text>
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
                :customStyle="{ fontSize: '32rpx', color: '#1E1B4B' }"
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
                <text v-if="newTypeColor === color.value" class="fa-solid">&#xf00c;</text>
              </view>
            </view>
          </view>

          <!-- Preview -->
          <view class="form-item">
            <text class="form-label">预览效果</text>
            <view class="preview-card">
              <view class="type-tag" :style="{ backgroundColor: newTypeColor }">
                <text class="fa-solid">&#xf005;</text>
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
            <text class="fa-solid">&#xf00c;</text>
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
    type: String as () => string | null,
    default: null
  },
  showClear: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const eventTypeStore = useEventTypeStore()

// Color options - vibrant and distinct colors
const colorOptions = [
  { value: '#EF4444', label: '红色' },
  { value: '#F97316', label: '橙色' },
  { value: '#FBBF24', label: '黄色' },
  { value: '#10B981', label: '绿色' },
  { value: '#06B6D4', label: '青色' },
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
const newTypeColor = ref('#3B82F6')

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
  newTypeColor.value = '#3B82F6'
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

// Clear selection
function clearSelection() {
  emit('update:modelValue', null)
  emit('change', null)
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

  // 关闭新建弹窗，保持选择弹窗打开以便用户确认选择
  showNewTypePopup.value = false
  showPicker.value = true
  uni.showToast({ title: '类型已创建', icon: 'success' })
}
</script>

<style lang="scss" scoped>
.type-picker {
  display: flex;
  align-items: center;
  gap: $spacing-md;

  .picker-trigger {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-md $spacing-lg;
    min-height: 88rpx;
    border-radius: $radius-lg;
    background: rgba(99, 102, 241, 0.05);
    border: 1px solid rgba(99, 102, 241, 0.1);
    transition: all $transition-fast;

    &:active {
      background: rgba(99, 102, 241, 0.08);
      border-color: rgba(99, 102, 241, 0.2);
    }

    .selected-type {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      flex: 1;
      overflow: hidden;

      .type-badge {
        width: 40rpx;
        height: 40rpx;
        border-radius: $radius-sm;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .fa-solid {
          font-size: 18rpx;
          color: #ffffff;
        }
      }

      .type-name {
        font-size: 30rpx;
        font-weight: 500;
        color: $text-primary;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .placeholder {
      font-size: 30rpx;
      color: $text-muted;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .arrow-icon {
      font-size: 16rpx;
      color: $text-secondary;
      flex-shrink: 0;
      margin-left: $spacing-xs;
    }

    .clear-btn {
      width: 40rpx;
      height: 40rpx;
      border-radius: $radius-full;
      background: rgba($uni-color-error, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-left: $spacing-xs;

      .fa-solid {
        font-size: 14rpx;
        color: $uni-color-error;
      }

      &:active {
        background: rgba($uni-color-error, 0.25);
      }
    }
  }

  .new-type-btn {
    width: 80rpx;
    height: 80rpx;
    border-radius: $radius-lg;
    background: $gradient-aurora;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: $shadow-medium;

    .fa-solid {
      font-size: 26rpx;
      color: #ffffff;
    }
  }
}

.picker-popup {
  border-radius: $radius-xl $radius-xl 0 0;
  padding: $spacing-lg;
  padding-bottom: calc($spacing-lg + env(safe-area-inset-bottom));

  .picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-lg;

    .picker-title {
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

  .picker-content {
    max-height: 600rpx;

    .type-option {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      padding: $spacing-md;
      border-radius: $radius-md;
      transition: background $transition-fast;

      &:active {
        background: rgba(99, 102, 241, 0.05);
      }

      &.selected {
        background: rgba(99, 102, 241, 0.1);

        .type-name {
          color: $accent-indigo;
          font-weight: 600;
        }
      }

      .type-badge {
        width: 40rpx;
        height: 40rpx;
        border-radius: $radius-sm;
        display: flex;
        align-items: center;
        justify-content: center;

        .fa-solid {
          font-size: 18rpx;
          color: #ffffff;
        }
      }

      .type-name {
        flex: 1;
        font-size: 30rpx;
        font-weight: 500;
        color: $text-primary;
      }

      .fa-check {
        font-size: 18rpx;
        color: $accent-indigo;
      }
    }

    .empty-tip {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: $spacing-md;
      padding: $spacing-xl;
      color: $text-secondary;
      font-size: 28rpx;

      .fa-solid {
        font-size: 28rpx;
      }
    }
  }

  .picker-footer {
    margin-top: $spacing-lg;
    padding-top: $spacing-lg;
    border-top: 1px solid rgba(99, 102, 241, 0.1);

    .add-new-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-sm;
      padding: $spacing-md;
      background: rgba(99, 102, 241, 0.05);
      border-radius: $radius-lg;
      border: 1px dashed $accent-indigo;

      .fa-solid {
        font-size: 18rpx;
        color: $accent-indigo;
      }

      text {
        font-size: 30rpx;
        font-weight: 600;
        color: $accent-indigo;
      }
    }
  }
}

.new-type-popup {
  border-radius: $radius-xl $radius-xl 0 0;
  padding: $spacing-lg;
  padding-bottom: calc($spacing-lg + env(safe-area-inset-bottom));

  .popup-header {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-xl;

    .header-icon {
      width: 64rpx;
      height: 64rpx;
      border-radius: $radius-lg;
      background: $gradient-cool;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: $spacing-md;

      .fa-solid {
        font-size: 28rpx;
        color: #ffffff;
      }
    }

    .popup-title {
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

  .popup-content {
    .form-item {
      margin-bottom: $spacing-xl;

      .form-label {
        display: block;
        font-size: 28rpx;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: $spacing-md;
      }

      .input-wrapper {
        background: rgba(99, 102, 241, 0.05);
        border-radius: $radius-lg;
        padding: $spacing-md;
        border: 1px solid rgba(99, 102, 241, 0.1);
      }

      .color-grid {
        display: flex;
        flex-wrap: wrap;
        gap: $spacing-md;

        .color-option {
          width: 64rpx;
          height: 64rpx;
          border-radius: $radius-md;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all $transition-fast;

          &.selected {
            transform: scale(1.15);
            box-shadow: $shadow-medium;

            .fa-solid {
              font-size: 22rpx;
              color: #ffffff;
            }
          }
        }
      }

      .preview-card {
        background: rgba(99, 102, 241, 0.05);
        border-radius: $radius-lg;
        padding: $spacing-lg;

        .type-tag {
          display: inline-flex;
          align-items: center;
          gap: $spacing-xs;
          padding: $spacing-sm $spacing-md;
          border-radius: $radius-full;

          .fa-solid {
            font-size: 14rpx;
            color: #ffffff;
          }

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

      &.disabled {
        opacity: 0.5;
      }
    }
  }
}
</style>