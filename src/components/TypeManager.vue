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
        @click="openEditDialog(type)"
        @longpress="confirmDelete(type)"
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
    <u-popup :show="showDialog" mode="center" @close="closeDialog">
      <view class="dialog-card glass-card">
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
    <u-popup :show="showDeleteConfirm" mode="center" @close="closeDeleteConfirm">
      <view class="delete-dialog-card glass-card">
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
  height: 100vh;
  background: #ffffff;

  /* #ifdef MP-WEIXIN */
  padding-top: var(--nav-bar-height);
  height: calc(100vh - var(--nav-bar-height));
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
      font-size: 18rpx;
      color: $text-secondary;
    }
  }
}

.manager-content {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-lg;

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
      font-size: 48rpx;
    }
  }

  .type-item {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-md;
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
      padding-right: $spacing-md;

      .more-btn {
        width: 64rpx;
        height: 64rpx;
        border-radius: $radius-lg;
        background: rgba(99, 102, 241, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all $transition-fast;
        margin-left: auto;

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
        right: $spacing-md;
        top: calc(100% + 16rpx);
        background: #ffffff;
        border-radius: $radius-lg;
        box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
        z-index: 100;
        overflow: hidden;
        min-width: 200rpx;

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

// Dialog styles
.dialog-card,
.delete-dialog-card {
  width: 600rpx;
  border-radius: $radius-xl;
  padding: $spacing-lg;
  background: #ffffff;
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

.dialog-footer {
  display: flex;
  gap: $spacing-md;
  margin-top: $spacing-lg;

  .btn-cancel {
    flex: 1;
    height: 80rpx;
    border-radius: $radius-lg;
    background: rgba(99, 102, 241, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;

    text {
      font-size: 30rpx;
      font-weight: 600;
      color: $text-secondary;
    }
  }

  .btn-save {
    flex: 2;
    height: 80rpx;
    border-radius: $radius-lg;
    background: $gradient-primary;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    box-shadow: $shadow-glow;

    .fa-solid {
      font-size: 18rpx;
      color: #ffffff;
    }

    text {
      font-size: 30rpx;
      font-weight: 600;
      color: #ffffff;
    }

    &.disabled {
      opacity: 0.5;
    }
  }
}

// Delete dialog
.delete-dialog-card {
  text-align: center;
  padding: $spacing-xl;

  .delete-icon-wrapper {
    width: 96rpx;
    height: 96rpx;
    border-radius: $radius-full;
    background: rgba(239, 68, 68, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto $spacing-md;

    .fa-solid {
      font-size: 36rpx;
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

    .btn-cancel {
      flex: 1;
      height: 80rpx;
      border-radius: $radius-lg;
      background: rgba(99, 102, 241, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;

      text {
        font-size: 30rpx;
        font-weight: 600;
        color: $text-secondary;
      }
    }

    .btn-delete {
      flex: 1;
      height: 80rpx;
      border-radius: $radius-lg;
      background: #EF4444;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-sm;
      box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.3);

      .fa-solid {
        font-size: 18rpx;
        color: #ffffff;
      }

      text {
        font-size: 30rpx;
        font-weight: 600;
        color: #ffffff;
      }
    }
  }
}
</style>
