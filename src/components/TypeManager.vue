<template>
  <view class="type-manager" :style="{ '--nav-bar-height': navBarHeight + 'px' }">
    <!-- Header -->
    <view class="manager-header">
      <text class="manager-title gradient-text">类型管理</text>
      <view class="close-btn" @click="closeManager">
        <text class="fa-solid">&#xf00d;</text>
      </view>
    </view>

    <!-- Type List -->
    <scroll-view class="manager-content" scroll-y @click="closeActionMenu">
      <view v-if="eventTypeStore.types.length === 0" class="empty-tip">
        <text class="fa-solid">&#xf01c;</text>
        <text>暂无类型，请点击右下角新建</text>
      </view>

      <view
        v-for="type in typesWithCount"
        :key="type.id"
        class="type-item"
        :class="{ 'deleting': deletingId === type.id }"
        @click.stop="openEditDialog(type)"
        @longpress.stop="confirmDelete(type)"
      >
        <view class="type-badge" :style="{ backgroundColor: type.color }">
          <text class="fa-solid">&#xf005;</text>
        </view>
        <view class="type-info">
          <text class="type-name">{{ type.name }}</text>
          <text class="type-count">{{ type.eventCount }} 个事件</text>
        </view>
        <view class="type-actions">
          <view class="more-btn" @click.stop="toggleActionMenu(type.id)">
            <text class="fa-solid">&#xf142;</text>
          </view>
          <view v-if="activeActionMenuId === type.id" class="action-menu">
            <view class="menu-item edit" @click="openEditDialog(type)">
              <text class="fa-solid">&#xf044;</text>
              <text>编辑</text>
            </view>
            <view class="menu-item delete" @click="confirmDelete(type)">
              <text class="fa-solid">&#xf2ed;</text>
              <text>删除</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- Footer -->
    <view class="manager-footer">
      <view class="add-btn" @click="openCreateDialog">
        <text class="fa-solid">&#xf067;</text>
        <text>新建类型</text>
      </view>
    </view>

    <!-- Edit/Create Dialog -->
    <u-popup
      :show="showDialog"
      mode="center"
      @close="closeDialog"
      :custom-style="customPopupStyle"
      :safe-area-inset-bottom="false"
      :mask-touch="false"
    >
      <view class="dialog-card">
        <view class="dialog-header">
          <text class="dialog-title">{{ dialogMode === 'edit' ? '编辑类型' : '新建类型' }}</text>
        </view>

        <view class="dialog-content">
          <!-- Name Input -->
          <view class="form-item">
            <text class="form-label">类型名称</text>
            <view class="input-wrapper">
              <u-input
                v-model="formData.name"
                placeholder="请输入类型名称"
                border="none"
                :customStyle="{ fontSize: '32rpx', color: '#1E1B4B' }"
              />
            </view>
          </view>

          <!-- Color Picker -->
          <view class="form-item">
            <text class="form-label">选择颜色</text>
            <view class="color-grid">
              <view
                v-for="color in colorOptions"
                :key="color.value"
                class="color-option"
                :class="{ selected: formData.color === color.value }"
                :style="{ backgroundColor: color.value }"
                @click="selectColor(color.value)"
              >
                <text v-if="formData.color === color.value" class="fa-solid">&#xf00c;</text>
              </view>
            </view>
          </view>

          <!-- Preview -->
          <view class="form-item">
            <text class="form-label">预览效果</text>
            <view class="preview-card">
              <view class="type-tag" :style="{ backgroundColor: formData.color }">
                <text class="fa-solid">&#xf005;</text>
                <text class="tag-name">{{ formData.name || '类型名称' }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="dialog-footer">
          <view class="btn-cancel" @click="closeDialog">
            <text>取消</text>
          </view>
          <view class="btn-save" :class="{ disabled: !formData.name.trim() }" @click="saveType">
            <text class="fa-solid">&#xf00c;</text>
            <text>保存</text>
          </view>
        </view>
      </view>
    </u-popup>

    <!-- Delete Confirmation Dialog -->
    <u-popup
      :show="showDeleteConfirm"
      mode="center"
      @close="closeDeleteConfirm"
      :custom-style="customPopupStyle"
      :safe-area-inset-bottom="false"
      :mask-touch="false"
    >
      <view class="delete-dialog-card">
        <view class="delete-icon-wrapper">
          <text class="fa-solid">&#xf1f8;</text>
        </view>
        <text class="delete-title">确认删除</text>
        <text class="delete-desc">
          确定要删除类型「{{ deletingType?.name }}」吗？
          <text v-if="deletingType && deletingTypeCount > 0">
            该类型下有 {{ deletingTypeCount }} 个事件，删除后这些事件将归为「未分类」
          </text>
        </text>
        <view class="delete-actions">
          <view class="btn-cancel" @click="closeDeleteConfirm">
            <text>取消</text>
          </view>
          <view class="btn-delete" @click="executeDelete">
            <text class="fa-solid">&#xf2ed;</text>
            <text>删除</text>
          </view>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEventTypeStore } from '@/store/eventType'
import { useEventStore } from '@/store/event'

// 导航栏高度（小程序端需要从胶囊按钮下方开始）
// 使用同步方式获取，确保渲染前已有正确值
const navBarHeight = ref(88)
// #ifdef MP-WEIXIN
const systemInfo = uni.getSystemInfoSync()
const menuButton = uni.getMenuButtonBoundingClientRect()
// 导航栏高度 = 胶囊按钮 bottom + (胶囊按钮 top - 状态栏高度)
navBarHeight.value = menuButton.bottom + (menuButton.top - systemInfo.statusBarHeight)
// #endif

interface TypeWithCount {
  id: string
  name: string
  color: string
  eventCount: number
}

const emit = defineEmits(['close'])

const eventTypeStore = useEventTypeStore()
const eventStore = useEventStore()

// Color options
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

// State
const showDialog = ref(false)
const showDeleteConfirm = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const deletingType = ref<TypeWithCount | null>(null)
const activeActionMenuId = ref<string | null>(null)

// Form data
const formData = ref({
  name: '',
  color: '#3B82F6'
})

// Types with event count
const typesWithCount = computed<TypeWithCount[]>(() => {
  const stats = eventStore.statsByType
  return eventTypeStore.types.map(type => ({
    id: type.id,
    name: type.name,
    color: type.color,
    eventCount: stats[type.id] || 0
  }))
})

// Deleting type event count
const deletingTypeCount = computed(() => {
  if (!deletingType.value) return 0
  return deletingType.value.eventCount
})

// Custom popup style for WeChat Mini Program to fix bottom spacing issue
const customPopupStyle = {
  // #ifdef MP-WEIXIN
  paddingBottom: '0',
  paddingTop: '0',
  minHeight: 'auto',
  height: 'auto',
  display: 'block'
  // #endif
}

// Close manager
function closeManager() {
  emit('close')
}

// Toggle action menu
function toggleActionMenu(typeId: string) {
  activeActionMenuId.value = activeActionMenuId.value === typeId ? null : typeId
}

// Close action menu
function closeActionMenu() {
  activeActionMenuId.value = null
}

// Open edit dialog
function openEditDialog(type: TypeWithCount) {
  closeActionMenu()
  dialogMode.value = 'edit'
  editingId.value = type.id
  formData.value = {
    name: type.name,
    color: type.color
  }
  showDialog.value = true
}

// Open create dialog
function openCreateDialog() {
  dialogMode.value = 'create'
  editingId.value = null
  formData.value = {
    name: '',
    color: '#3B82F6'
  }
  showDialog.value = true
}

// Close dialog
function closeDialog() {
  showDialog.value = false
  editingId.value = null
}

// Select color
function selectColor(color: string) {
  formData.value.color = color
}

// Save type
function saveType() {
  if (!formData.value.name.trim()) return

  if (dialogMode.value === 'edit' && editingId.value) {
    eventTypeStore.updateType(editingId.value, {
      name: formData.value.name.trim(),
      color: formData.value.color
    })
    uni.showToast({ title: '已更新', icon: 'success' })
  } else {
    eventTypeStore.addType({
      name: formData.value.name.trim(),
      color: formData.value.color
    })
    uni.showToast({ title: '已创建', icon: 'success' })
  }

  closeDialog()
}

// Confirm delete
function confirmDelete(type: TypeWithCount) {
  closeActionMenu()
  deletingType.value = type
  deletingId.value = type.id
  showDeleteConfirm.value = true
}

// Close delete confirm
function closeDeleteConfirm() {
  showDeleteConfirm.value = false
  deletingType.value = null
  deletingId.value = null
}

// Execute delete
function executeDelete() {
  if (deletingType.value) {
    eventTypeStore.deleteType(deletingType.value.id)
    uni.showToast({ title: '已删除', icon: 'success' })
    closeDeleteConfirm()
  }
}
</script>

<style lang="scss" scoped>
.type-manager {
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  background: #ffffff;
  padding-bottom: env(safe-area-inset-bottom);

  /* #ifdef MP-WEIXIN */
  padding-top: var(--nav-bar-height);
  height: calc(100vh - var(--nav-bar-height));
  /* #endif */

  /* #ifndef MP-WEIXIN */
  height: 100vh;
  /* #endif */
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);

  .manager-title {
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
      font-size: 20rpx;
      color: $text-secondary;
    }
  }
}

.manager-content {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  padding: $spacing-lg $spacing-xl;

  .empty-tip {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-lg;
    padding: 96rpx;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%);
    border-radius: $radius-xl;
    border: 1px dashed rgba(99, 102, 241, 0.2);

    .fa-solid {
      font-size: 64rpx;
      color: $text-secondary;
      background: linear-gradient(135deg, $accent-indigo 0%, $accent-purple 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      opacity: 0.6;
    }

    > text:last-child {
      font-size: 28rpx;
      color: $text-secondary;
      opacity: 0.8;
    }
  }

  .type-item {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-md;
    width: 100%;
    box-sizing: border-box;
    border-radius: $radius-lg;
    background: rgba(99, 102, 241, 0.03);
    margin-bottom: $spacing-md;
    transition: all $transition-fast;

    &:active {
      background: rgba(99, 102, 241, 0.08);
    }

    &.deleting {
      opacity: 0.5;
      transform: scale(0.98);
    }

    .type-badge {
      width: 48rpx;
      height: 48rpx;
      border-radius: $radius-md;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .fa-solid {
        font-size: 20rpx;
        color: #ffffff;
      }
    }

    .type-info {
      flex: 1;
      min-width: 0;

      .type-name {
        display: block;
        font-size: 30rpx;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 4rpx;
      }

      .type-count {
        display: block;
        font-size: 24rpx;
        color: $text-secondary;
      }
    }

    .type-actions {
      position: relative;
      display: flex;
      align-items: center;

      .more-btn {
        width: 48rpx;
        height: 48rpx;
        border-radius: $radius-md;
        background: rgba(99, 102, 241, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all $transition-fast;

        .fa-solid {
          font-size: 20rpx;
          color: $text-secondary;
        }

        &:active {
          background: rgba(99, 102, 241, 0.15);
        }
      }

      .action-menu {
        position: absolute;
        right: 0;
        top: 100%;
        background: #ffffff;
        border-radius: $radius-lg;
        box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
        z-index: 100;
        overflow: hidden;
        min-width: 200rpx;
        transform-origin: top right;
        animation: menuSlideIn 0.2s ease-out;

        .menu-item {
          display: flex;
          align-items: center;
          gap: $spacing-md;
          padding: $spacing-lg $spacing-xl;
          transition: background $transition-fast;

          .fa-solid {
            font-size: 20rpx;
          }

          text {
            font-size: 30rpx;
            font-weight: 500;
            color: $text-primary;
          }

          &:active {
            background: rgba(99, 102, 241, 0.05);
          }

          &.edit {
            .fa-solid {
              color: $accent-indigo;
            }
          }

          &.delete {
            border-top: 1px solid rgba(99, 102, 241, 0.08);

            .fa-solid {
              color: #EF4444;
            }

            text {
              color: #EF4444;
            }
          }
        }
      }
    }
  }
}

// Menu slide-in animation
@keyframes menuSlideIn {
  from {
    opacity: 0;
    transform: translateY(-8rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.manager-footer {
  padding: $spacing-lg;
  border-top: 1px solid rgba(99, 102, 241, 0.1);

  .add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    padding: $spacing-md;
    background: rgba(99, 102, 241, 0.05);
    border-radius: $radius-lg;
    border: 1px dashed $accent-indigo;

    .fa-solid {
      font-size: 20rpx;
      color: $accent-indigo;
    }

    text {
      font-size: 30rpx;
      font-weight: 600;
      color: $accent-indigo;
    }
  }
}

// Dialog styles - responsive width
.dialog-card,
.delete-dialog-card {
  width: 100%;
  max-width: 600rpx;
  border-radius: $radius-xl;
  padding: $spacing-lg;
  background: #ffffff !important;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
}

.dialog-header {
  text-align: center;
  margin-bottom: $spacing-lg;

  .dialog-title {
    font-size: 34rpx;
    font-weight: 700;
  }
}

.dialog-content {
  .form-item {
    margin-bottom: $spacing-lg;

    &:last-child {
      margin-bottom: 0;
    }

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
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: $spacing-md;

      .color-option {
        aspect-ratio: 1;
        border-radius: $radius-md;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all $transition-fast;

        &.selected {
          transform: scale(1.1);
          box-shadow: $shadow-medium;
          border-width: 2rpx;
          border-style: solid;
          border-color: rgba(255, 255, 255, 0.8);

          .fa-solid {
            font-size: 22rpx;
            color: #ffffff;
          }
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }

    .preview-card {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
      border-radius: $radius-lg;
      padding: $spacing-lg;
      border: 1px solid rgba(99, 102, 241, 0.1);

      .type-tag {
        display: inline-flex;
        align-items: center;
        gap: $spacing-xs;
        padding: $spacing-sm $spacing-md;
        border-radius: $radius-full;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

        .fa-solid {
          font-size: 16rpx;
          color: #ffffff;
        }

        .tag-name {
          font-size: 28rpx;
          font-weight: 500;
          color: #ffffff;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  gap: $spacing-md;
  margin-top: $spacing-lg;

  .btn-cancel,
  .btn-save {
    flex: 1;
    height: 80rpx;
    border-radius: $radius-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    transition: all $transition-fast;
  }

  .btn-cancel {
    background: rgba(99, 102, 241, 0.05);
    border: 1px solid rgba(99, 102, 241, 0.1);

    text {
      font-size: 30rpx;
      font-weight: 600;
      color: $text-secondary;
    }

    &:active {
      background: rgba(99, 102, 241, 0.1);
    }
  }

  .btn-save {
    background: $gradient-primary;
    box-shadow: $shadow-glow;

    .fa-solid {
      font-size: 20rpx;
      color: #ffffff;
    }

    text {
      font-size: 30rpx;
      font-weight: 600;
      color: #ffffff;
    }

    &.disabled {
      opacity: 0.5;
      transform: scale(0.98);
    }

    &:active:not(.disabled) {
      transform: scale(0.96);
    }
  }
}

// Delete dialog
.delete-dialog-card {
  text-align: center;
  padding: $spacing-xl;

  .delete-icon-wrapper {
    width: 80rpx;
    height: 80rpx;
    border-radius: $radius-full;
    background: rgba(239, 68, 68, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto $spacing-md;

    .fa-solid {
      font-size: 32rpx;
      color: #EF4444;
    }
  }

  .delete-title {
    display: block;
    font-size: 34rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: $spacing-md;
  }

  .delete-desc {
    display: block;
    font-size: 28rpx;
    color: $text-secondary;
    line-height: 1.6;
    margin-bottom: $spacing-xl;
  }

  .delete-actions {
    display: flex;
    gap: $spacing-md;

    .btn-cancel,
    .btn-delete {
      flex: 1;
      height: 80rpx;
      border-radius: $radius-lg;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-sm;
      transition: all $transition-fast;
    }

    .btn-cancel {
      background: rgba(99, 102, 241, 0.05);
      border: 1px solid rgba(99, 102, 241, 0.1);

      text {
        font-size: 30rpx;
        font-weight: 600;
        color: $text-secondary;
      }

      &:active {
        background: rgba(99, 102, 241, 0.1);
      }
    }

    .btn-delete {
      background: #EF4444;
      box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.3);

      .fa-solid {
        font-size: 20rpx;
        color: #ffffff;
      }

      text {
        font-size: 30rpx;
        font-weight: 600;
        color: #ffffff;
      }

      &:active {
        transform: scale(0.96);
        box-shadow: 0 2rpx 8rpx rgba(239, 68, 68, 0.25);
      }
    }
  }
}
</style>
