<template>
  <u-popup :show="visible" mode="bottom" round="24" @close="onClose">
    <view class="anniversary-form glass-card">
      <!-- Header -->
      <view class="form-header">
        <view class="header-icon">
          <text v-if="isEditMode" class="fa-solid">&#xf044;</text>
          <text v-else class="fa-solid">&#xf067;</text>
        </view>
        <text class="form-title gradient-text">{{ isEditMode ? '编辑纪念日' : '添加纪念日' }}</text>
        <view class="close-btn" @click="onClose">
          <text class="fa-solid">&#xf00d;</text>
        </view>
      </view>

      <!-- Form body -->
      <view class="form-body">
        <!-- Name -->
        <view class="form-item">
          <view class="form-label">
            <text class="fa-solid">&#xf304;</text>
            <text>纪念日名称</text>
          </view>
          <view class="input-wrapper">
            <u-input
              v-model="anniversaryName"
              placeholder="请输入纪念日名称"
              border="none"
              :customStyle="{ fontSize: '32rpx', color: '#1E1B4B' }"
              :placeholderStyle="{ color: '#9CA3AF' }"
            />
          </view>
        </view>

        <!-- Date -->
        <view class="form-item">
          <view class="form-label">
            <text class="fa-solid">&#xf133;</text>
            <text>目标日期</text>
          </view>
          <view class="date-picker-row">
            <u-datetime-picker
              :show="showDatePicker"
              v-model="anniversaryDate"
              mode="date"
              title="选择日期"
              @confirm="onDateConfirm"
              @cancel="showDatePicker = false"
              @close="showDatePicker = false"
            />
            <view class="date-display" @click="showDatePicker = true">
              <text class="fa-solid">&#xf073;</text>
              <text class="date-text">{{ formattedDate }}</text>
              <text class="fa-solid">&#xf054;</text>
            </view>
          </view>
        </view>

        <!-- Repeat type -->
        <view class="form-item">
          <view class="form-label">
            <text class="fa-solid">&#xf01e;</text>
            <text>重复方式</text>
          </view>
          <view class="repeat-options">
            <view class="repeat-row">
              <view
                class="repeat-option"
                :class="{ active: repeatType === 'year' }"
                @click="repeatType = 'year'"
              >
                <text>每年</text>
              </view>
              <view
                class="repeat-option"
                :class="{ active: repeatType === 'month' }"
                @click="repeatType = 'month'"
              >
                <text>每月</text>
              </view>
              <view
                class="repeat-option"
                :class="{ active: repeatType === 'week' }"
                @click="repeatType = 'week'"
              >
                <text>每周</text>
              </view>
              <view
                class="repeat-option"
                :class="{ active: repeatType === 'day' }"
                @click="repeatType = 'day'"
              >
                <text>每天</text>
              </view>
            </view>
            <view class="repeat-row">
              <view
                class="repeat-option full-width"
                :class="{ active: repeatType === 'none' }"
                @click="repeatType = 'none'"
              >
                <text>不重复</text>
              </view>
            </view>
          </view>
        </view>

        <!-- Display mode -->
        <view class="form-item">
          <view class="form-label">
            <text class="fa-solid">&#xf017;</text>
            <text>显示模式</text>
          </view>
          <view class="mode-options">
            <view
              class="mode-option"
              :class="{ active: displayMode === 'countdown' }"
              @click="displayMode = 'countdown'"
            >
              <text class="fa-solid">&#xf061;</text>
              <text>倒计时</text>
            </view>
            <view
              class="mode-option"
              :class="{ active: displayMode === 'elapsed' }"
              @click="displayMode = 'elapsed'"
            >
              <text class="fa-solid">&#xf060;</text>
              <text>正计时</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Footer -->
      <view class="form-footer">
        <view v-if="isEditMode" class="btn-delete" @click="onDelete">
          <text class="fa-solid">&#xf2ed;</text>
          <text>删除</text>
        </view>
        <view class="btn-cancel" @click="onClose">
          <text>取消</text>
        </view>
        <view class="btn-save" @click="onSave">
          <text class="fa-solid">&#xf00c;</text>
          <text>保存</text>
        </view>
      </view>
    </view>
  </u-popup>

  <!-- Delete confirm modal -->
  <u-modal
    :show="showDeleteConfirm"
    title="确认删除"
    content="确定要删除这个纪念日吗？"
    showCancelButton
    @confirm="confirmDelete"
    @cancel="showDeleteConfirm = false"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAnniversaryStore } from '@/store/anniversary'
import { formatAnniversaryDate } from '@/utils/anniversary'

interface EditData {
  id: string
  name: string
  date: number
  repeatType: 'none' | 'year' | 'month' | 'week' | 'day'
  mode: 'countdown' | 'elapsed'
}

const props = defineProps({
  visible: Boolean,
  isEditMode: Boolean,
  editData: Object as () => EditData | null
})

const emit = defineEmits(['close', 'save'])

const anniversaryStore = useAnniversaryStore()

const anniversaryName = ref('')
const anniversaryDate = ref(Date.now())
const repeatType = ref<'none' | 'year' | 'month' | 'week' | 'day'>('year')
const displayMode = ref<'countdown' | 'elapsed'>('countdown')
const showDatePicker = ref(false)
const showDeleteConfirm = ref(false)

const formattedDate = computed(() => {
  return formatAnniversaryDate(anniversaryDate.value)
})

// Reset form when visible changes
watch(() => props.visible, (val) => {
  if (val) {
    anniversaryName.value = ''
    anniversaryDate.value = Date.now()
    repeatType.value = 'year'
    displayMode.value = 'countdown'

    // 编辑模式填充数据
    if (props.isEditMode && props.editData) {
      anniversaryName.value = props.editData.name
      anniversaryDate.value = props.editData.date
      repeatType.value = props.editData.repeatType
      displayMode.value = props.editData.mode
    }
  }
})

function onDateConfirm(e: { value: number }) {
  anniversaryDate.value = e.value
  showDatePicker.value = false
}

function onSave() {
  // Validate
  if (!anniversaryName.value.trim()) {
    uni.showToast({ title: '请输入纪念日名称', icon: 'none' })
    return
  }

  if (props.isEditMode && props.editData) {
    // 更新
    anniversaryStore.updateAnniversary(props.editData.id, {
      name: anniversaryName.value.trim(),
      date: anniversaryDate.value,
      repeatType: repeatType.value,
      mode: displayMode.value
    })
    uni.showToast({ title: '纪念日已更新', icon: 'success' })
  } else {
    // 新增
    anniversaryStore.addAnniversary({
      name: anniversaryName.value.trim(),
      date: anniversaryDate.value,
      repeatType: repeatType.value,
      mode: displayMode.value,
      categoryId: ''
    })
    uni.showToast({ title: '纪念日已添加', icon: 'success' })
  }

  emit('save')
  emit('close')
}

function onDelete() {
  showDeleteConfirm.value = true
}

function confirmDelete() {
  if (props.isEditMode && props.editData) {
    anniversaryStore.deleteAnniversary(props.editData.id)
    uni.showToast({ title: '纪念日已删除', icon: 'success' })
    emit('save')
    emit('close')
  }
  showDeleteConfirm.value = false
}

function onClose() {
  emit('close')
}
</script>

<style lang="scss" scoped>
.anniversary-form {
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
      background: $gradient-warm;
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

      .date-picker-row {
        .date-display {
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

          .date-text {
            flex: 1;
            font-size: 32rpx;
            color: $text-primary;
            font-weight: 500;
          }
        }
      }

      .repeat-options {
        display: flex;
        flex-direction: column;
        gap: $spacing-md;

        .repeat-row {
          display: flex;
          gap: $spacing-md;

          .repeat-option {
            flex: 1;
            padding: $spacing-md $spacing-lg;
            border-radius: $radius-lg;
            background: rgba(99, 102, 241, 0.05);
            border: 1px solid rgba(99, 102, 241, 0.1);
            transition: all $transition-fast;
            display: flex;
            align-items: center;
            justify-content: center;

            text {
              font-size: 28rpx;
              color: $text-secondary;
            }

            &.active {
              background: $gradient-cool;
              border-color: transparent;

              text {
                color: #ffffff;
                font-weight: 600;
              }
            }

            &.full-width {
              flex: 1;
            }
          }
        }
      }

      .mode-options {
        display: flex;
        gap: $spacing-md;

        .mode-option {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: $spacing-sm;
          padding: $spacing-md $spacing-lg;
          border-radius: $radius-lg;
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.1);
          transition: all $transition-fast;

          .fa-solid {
            font-size: 16rpx;
            color: $text-secondary;
          }

          text {
            font-size: 28rpx;
            color: $text-secondary;
          }

          &.active {
            background: $gradient-warm;
            border-color: transparent;

            .fa-solid {
              color: #ffffff;
            }

            text {
              color: #ffffff;
              font-weight: 600;
            }
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
      background: $gradient-warm;
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

    .btn-delete {
      height: 88rpx;
      padding: 0 $spacing-lg;
      border-radius: $radius-lg;
      background: rgba(239, 68, 68, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-xs;

      .fa-solid {
        font-size: 20rpx;
        color: #EF4444;
      }

      text {
        font-size: 28rpx;
        font-weight: 600;
        color: #EF4444;
      }
    }
  }
}
</style>
