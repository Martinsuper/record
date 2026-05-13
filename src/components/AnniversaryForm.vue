<template>
  <u-popup :show="visible" mode="bottom" round="24" @close="onClose">
    <scroll-view scroll-y class="form-scroll">
      <view class="anniversary-form glass-card">
        <!-- Header -->
        <view class="form-header">
          <view class="header-icon">
            <FaIcon v-if="isEditMode" name="edit" size="28rpx" />
            <FaIcon v-else name="plus" size="28rpx" />
          </view>
          <text class="form-title gradient-text">{{ isEditMode ? '编辑纪念日' : '添加纪念日' }}</text>
          <view class="close-btn" @click="onClose">
            <FaIcon name="times" size="20rpx" />
          </view>
        </view>

        <!-- Form body -->
        <view class="form-body">
          <!-- Name -->
          <view class="form-item">
            <view class="form-label">
              <FaIcon name="pen" size="16rpx" />
              <text>纪念日名称</text>
            </view>
            <view class="input-wrapper">
              <u-input
                v-model="anniversaryName"
                placeholder="请输入纪念日名称"
                border="none"
                :maxlength="50"
                :customStyle="{ fontSize: '32rpx', color: '#1E1B4B' }"
                :placeholderStyle="{ color: '#9CA3AF' }"
              />
              <text class="char-count">{{ anniversaryName.length }}/50</text>
            </view>
          </view>

          <!-- Category -->
          <view class="form-item">
            <view class="form-label">
              <FaIcon name="tag" size="16rpx" />
              <text>分类</text>
            </view>
            <view class="category-select" @click="showCategoryPicker = true">
              <FaIcon :name="selectedCategoryIcon" size="24rpx" />
              <text class="category-text">{{ selectedCategoryName }}</text>
              <FaIcon name="chevron-right" size="20rpx" />
            </view>
          </view>

          <!-- Date -->
          <view class="form-item">
            <view class="form-label">
              <FaIcon name="calendar" size="16rpx" />
              <text>目标日期</text>
            </view>
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
              <FaIcon name="calendar" size="20rpx" />
              <text class="date-text">{{ formattedDate }}</text>
              <FaIcon name="chevron-right" size="20rpx" />
            </view>
          </view>

          <!-- Repeat type -->
          <view class="form-item">
            <view class="form-label">
              <FaIcon name="undo" size="16rpx" />
              <text>重复方式</text>
            </view>
            <view class="option-grid">
              <view
                class="option-btn"
                :class="{ active: repeatType === 'year' }"
                @click="repeatType = 'year'"
              >
                <text>每年</text>
              </view>
              <view
                class="option-btn"
                :class="{ active: repeatType === 'month' }"
                @click="repeatType = 'month'"
              >
                <text>每月</text>
              </view>
              <view
                class="option-btn"
                :class="{ active: repeatType === 'week' }"
                @click="repeatType = 'week'"
              >
                <text>每周</text>
              </view>
              <view
                class="option-btn"
                :class="{ active: repeatType === 'none' }"
                @click="repeatType = 'none'"
              >
                <text>不重复</text>
              </view>
            </view>
          </view>

          <!-- Display mode -->
          <view class="form-item">
            <view class="form-label">
              <FaIcon name="clock" size="16rpx" />
              <text>显示模式</text>
            </view>
            <view class="option-row">
              <view
                class="option-btn"
                :class="{ active: displayMode === 'countdown' }"
                @click="displayMode = 'countdown'"
              >
                <text>倒计时</text>
              </view>
              <view
                class="option-btn"
                :class="{ active: displayMode === 'elapsed' }"
                @click="displayMode = 'elapsed'"
              >
                <text>正计时</text>
              </view>
            </view>
          </view>
        </view>

        <!-- Footer -->
        <view class="form-footer">
          <view v-if="isEditMode" class="btn-delete" @click="onDelete">
            <FaIcon name="trash" size="20rpx" />
            <text>删除</text>
          </view>
          <view class="btn-cancel" @click="onClose">
            <text>取消</text>
          </view>
          <view class="btn-save" @click="onSave">
            <FaIcon name="check" size="20rpx" />
            <text>保存</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </u-popup>

  <!-- Category Picker -->
  <AnniversaryCategoryPicker
    :visible="showCategoryPicker"
    :selectedId="selectedCategoryId"
    @close="showCategoryPicker = false"
    @select="onCategorySelect"
  />

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
import { useAnniversaryCategoryStore } from '@/store/anniversaryCategory'
import AnniversaryCategoryPicker from './AnniversaryCategoryPicker.vue'
import { formatAnniversaryDate } from '@/utils/anniversary'
import FaIcon from '@/components/FaIcon.vue'

interface EditData {
  id: string
  name: string
  date: number
  repeatType: 'none' | 'year' | 'month' | 'week' | 'day'
  mode: 'countdown' | 'elapsed'
  categoryId: string
}

const props = defineProps({
  visible: Boolean,
  isEditMode: Boolean,
  editData: Object as () => EditData | null
})

const emit = defineEmits(['close', 'save'])

const anniversaryStore = useAnniversaryStore()
const categoryStore = useAnniversaryCategoryStore()

const anniversaryName = ref('')
const anniversaryDate = ref(Date.now())
const repeatType = ref<'none' | 'year' | 'month' | 'week' | 'day'>('year')
const displayMode = ref<'countdown' | 'elapsed'>('countdown')
const showDatePicker = ref(false)
const showDeleteConfirm = ref(false)

// Category state
const showCategoryPicker = ref(false)
const selectedCategoryId = ref<string | null>(null)

// Get category info
const selectedCategory = computed(() => categoryStore.getCategoryById(selectedCategoryId.value ?? ''))
const selectedCategoryName = computed(() => selectedCategory.value?.name || '选择分类')
const selectedCategoryIcon = computed(() => selectedCategory.value?.icon || 'bookmark')

const formattedDate = computed(() => formatAnniversaryDate(anniversaryDate.value))

// Reset form when visible changes
watch(() => props.visible, (val) => {
  if (val) {
    anniversaryName.value = ''
    anniversaryDate.value = Date.now()
    repeatType.value = 'year'
    displayMode.value = 'countdown'
    selectedCategoryId.value = null

    if (props.isEditMode && props.editData) {
      anniversaryName.value = props.editData.name
      anniversaryDate.value = props.editData.date
      repeatType.value = props.editData.repeatType
      displayMode.value = props.editData.mode
      selectedCategoryId.value = props.editData.categoryId || null
    }
  }
})

function onDateConfirm(e: { value: number }) {
  anniversaryDate.value = e.value
  showDatePicker.value = false
}

function onCategorySelect(id: string) {
  selectedCategoryId.value = id
  showCategoryPicker.value = false
}

function onSave() {
  if (!anniversaryName.value.trim()) {
    uni.showToast({ title: '请输入纪念日名称', icon: 'none' })
    return
  }

  if (props.isEditMode && props.editData) {
    anniversaryStore.updateAnniversary(props.editData.id, {
      name: anniversaryName.value.trim(),
      date: anniversaryDate.value,
      repeatType: repeatType.value,
      mode: displayMode.value,
      categoryId: selectedCategoryId.value
    })
    uni.showToast({ title: '纪念日已更新', icon: 'success' })
  } else {
    anniversaryStore.addAnniversary({
      name: anniversaryName.value.trim(),
      date: anniversaryDate.value,
      repeatType: repeatType.value,
      mode: displayMode.value,
      categoryId: selectedCategoryId.value
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
.form-scroll {
  max-height: 85vh;
}

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
      background: $gradient-primary;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: $spacing-md;
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
        display: flex;
        align-items: center;
        transition: all $transition-fast;

        &:focus-within {
          border-color: $accent-indigo;
          background: rgba(99, 102, 241, 0.08);
        }

        .char-count {
          font-size: 24rpx;
          color: $text-muted;
          margin-left: $spacing-sm;
          flex-shrink: 0;
        }
      }

      .category-select,
      .date-display {
        display: flex;
        align-items: center;
        background: rgba(99, 102, 241, 0.05);
        border-radius: $radius-lg;
        padding: $spacing-md;
        border: 1px solid rgba(99, 102, 241, 0.1);
        gap: $spacing-sm;
        transition: all $transition-fast;

        &:active {
          background: rgba(99, 102, 241, 0.1);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .category-text,
        .date-text {
          flex: 1;
          font-size: 32rpx;
          color: $text-primary;
          font-weight: 500;
        }
      }

      .option-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: $spacing-md;

        .option-btn {
          padding: $spacing-md $spacing-lg;
          border-radius: $radius-lg;
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all $transition-fast;

          text {
            font-size: 28rpx;
            color: $text-secondary;
          }

          &.active {
            background: $gradient-primary;
            border-color: transparent;

            text {
              color: #ffffff;
              font-weight: 600;
            }
          }

          &:active {
            transform: scale(0.96);
          }
        }
      }

      .option-row {
        display: flex;
        gap: $spacing-md;

        .option-btn {
          flex: 1;
          padding: $spacing-md $spacing-lg;
          border-radius: $radius-lg;
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all $transition-fast;

          text {
            font-size: 28rpx;
            color: $text-secondary;
          }

          &.active {
            background: $gradient-warm;
            border-color: transparent;

            text {
              color: #ffffff;
              font-weight: 600;
            }
          }

          &:active {
            transform: scale(0.96);
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

      text {
        font-size: 28rpx;
        font-weight: 600;
        color: #EF4444;
      }
    }
  }
}
</style>