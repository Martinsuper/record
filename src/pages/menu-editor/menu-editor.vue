<template>
  <view class="page-menu-editor" :style="{ '--nav-bar-height': navBarHeight + 'px' }">
    <!-- Header -->
    <view class="header">
      <view class="header-bg"></view>
      <view class="header-content glass-card">
        <text class="fa-solid">&#xf0c9;</text>
        <view class="header-text">
          <text class="header-title">编辑菜单</text>
          <text class="header-subtitle">自定义你的功能栏</text>
        </view>
      </view>
    </view>

    <!-- Tip -->
    <view class="tip-card glass-card">
      <text class="fa-solid">&#xf05a;</text>
      <text class="tip-text">长按拖拽调整顺序，点击开关显示/隐藏</text>
    </view>

    <!-- Tab Menu Section -->
    <view class="menu-section">
      <view class="section-title">
        <text class="fa-solid">&#xf0ae;</text>
        <text>底部导航栏</text>
        <text class="section-count">{{ menuConfigStore.enabledTabCount }}/{{ menuConfigStore.allTabItems.length }}</text>
      </view>
      <view class="menu-list">
        <view
          v-for="(item, index) in tabItems"
          :key="item.id"
          class="menu-item glass-card"
          :class="{ dragging: draggingId === item.id, disabled: !item.enabled }"
          @touchstart="onTouchStart($event, item.id, 'tab', index)"
          @touchmove="onTouchMove($event, 'tab')"
          @touchend="onTouchEnd('tab')"
        >
          <view class="drag-handle">
            <text class="fa-solid">&#xf0dc;</text>
          </view>
          <view class="item-content">
            <view class="item-icon" :class="getIconClass(item.id)">
              <text class="fa-solid">{{ item.icon }}</text>
            </view>
            <text class="item-name">{{ item.name }}</text>
          </view>
          <switch
            :checked="item.enabled"
            @change="onToggle(item.id, $event)"
            color="#6366F1"
          />
        </view>
      </view>
      <view class="section-tip">
        <text>Tab 菜单至少保留 2 项</text>
      </view>
    </view>

    <!-- Page Menu Section -->
    <view class="menu-section">
      <view class="section-title">
        <text class="fa-solid">&#xf0e7;</text>
        <text>功能入口</text>
        <text class="section-count">{{ menuConfigStore.enabledPageItems.length }}/{{ menuConfigStore.allPageItems.length }}</text>
      </view>
      <view class="menu-list">
        <view
          v-for="(item, index) in pageItems"
          :key="item.id"
          class="menu-item glass-card"
          :class="{ dragging: draggingId === item.id, disabled: !item.enabled }"
          @touchstart="onTouchStart($event, item.id, 'page', index)"
          @touchmove="onTouchMove($event, 'page')"
          @touchend="onTouchEnd('page')"
        >
          <view class="drag-handle">
            <text class="fa-solid">&#xf0dc;</text>
          </view>
          <view class="item-content">
            <view class="item-icon" :class="getIconClass(item.id)">
              <text class="fa-solid">{{ item.icon }}</text>
            </view>
            <text class="item-name">{{ item.name }}</text>
          </view>
          <switch
            :checked="item.enabled"
            @change="onToggle(item.id, $event)"
            color="#6366F1"
          />
        </view>
      </view>
    </view>

    <!-- Reset Button -->
    <view class="action-section">
      <button class="reset-btn" @click="resetToDefault">
        <text class="fa-solid">&#xf0e2;</text>
        <text>重置默认</text>
      </button>
    </view>

    <!-- Custom TabBar -->
    <CustomTabBar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMenuConfigStore } from '@/store/menuConfig'
import CustomTabBar from '@/components/CustomTabBar.vue'

const menuConfigStore = useMenuConfigStore()

const navBarHeight = computed(() => {
  const height = uni.getStorageSync('navBarHeight')
  return height || 88
})

// 获取菜单项列表（响应式）
const tabItems = computed(() => menuConfigStore.allTabItems)
const pageItems = computed(() => menuConfigStore.allPageItems)

// 拖拽状态
const draggingId = ref<string | null>(null)
const draggingType = ref<'tab' | 'page' | null>(null)
const dragStartIndex = ref<number>(0)
const dragCurrentIndex = ref<number>(0)
const startY = ref<number>(0)
const longPressTimer = ref<number | null>(null)

// 加载菜单配置
onMounted(() => {
  menuConfigStore.loadFromStorage()
})

// 触摸开始
function onTouchStart(e: TouchEvent, id: string, type: 'tab' | 'page', index: number) {
  startY.value = e.touches[0].clientY
  dragStartIndex.value = index
  dragCurrentIndex.value = index

  // 长按 500ms 进入拖拽模式
  longPressTimer.value = setTimeout(() => {
    draggingId.value = id
    draggingType.value = type
    // 震动反馈
    uni.vibrateShort({ type: 'light' })
  }, 500) as unknown as number
}

// 触摸移动
function onTouchMove(e: TouchEvent, type: 'tab' | 'page') {
  if (!draggingId.value || draggingType.value !== type) {
    // 移动超过 10px 取消长按判定
    const deltaY = Math.abs(e.touches[0].clientY - startY.value)
    if (deltaY > 10 && longPressTimer.value) {
      clearTimeout(longPressTimer.value)
      longPressTimer.value = null
    }
    return
  }

  // 计算新位置
  const currentY = e.touches[0].clientY
  const itemHeight = 120 // 菜单项高度（rpx 转 px 约 60px）
  const deltaY = currentY - startY.value
  const newIndex = Math.max(0, Math.min(
    type === 'tab' ? tabItems.value.length - 1 : pageItems.value.length - 1,
    dragStartIndex.value + Math.round(deltaY / itemHeight)
  ))

  if (newIndex !== dragCurrentIndex.value) {
    dragCurrentIndex.value = newIndex
  }
}

// 触摸结束
function onTouchEnd(type: 'tab' | 'page') {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }

  if (draggingId.value && draggingType.value === type && dragStartIndex.value !== dragCurrentIndex.value) {
    // 重新排序
    const items = type === 'tab' ? tabItems.value : pageItems.value
    const sortedIds = [...items.map(i => i.id)]

    // 移动元素
    const [removed] = sortedIds.splice(dragStartIndex.value, 1)
    sortedIds.splice(dragCurrentIndex.value, 0, removed)

    // 更新 Store
    if (type === 'tab') {
      menuConfigStore.updateTabSortOrder(sortedIds)
    } else {
      menuConfigStore.updatePageSortOrder(sortedIds)
    }

    uni.showToast({
      title: '排序已更新',
      icon: 'success',
      duration: 1500
    })
  }

  draggingId.value = null
  draggingType.value = null
}

// 开关切换
function onToggle(id: string, e: any) {
  const enabled = e.detail.value

  // Tab 类型检查最小数量限制
  if (menuConfigStore.getItemById(id)?.type === 'tab') {
    const currentCount = menuConfigStore.enabledTabCount
    if (!enabled && currentCount <= 2) {
      uni.showToast({
        title: '至少保留 2 个 Tab',
        icon: 'none',
        duration: 2000
      })
      // 恢复开关状态
      menuConfigStore.setEnabled(id, true)
      return
    }
  }

  menuConfigStore.setEnabled(id, enabled)
}

// 重置默认
function resetToDefault() {
  uni.showModal({
    title: '确认重置',
    content: '是否恢复默认菜单配置？',
    success: (res) => {
      if (res.confirm) {
        menuConfigStore.resetToDefault()
        uni.showToast({
          title: '已重置',
          icon: 'success'
        })
      }
    }
  })
}

// 图标样式类
function getIconClass(id: string): string {
  const classes: Record<string, string> = {
    'tab_events': 'gradient-primary',
    'tab_anniversary': 'gradient-warm',
    'tab_settings': 'gradient-aurora',
    'page_data_manager': 'gradient-cool',
    'page_menu_editor': 'gradient-sunset',
    'page_type_manager': 'gradient-spring'
  }
  return classes[id] || 'gradient-primary'
}
</script>

<style lang="scss" scoped>
.page-menu-editor {
  min-height: 100vh;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom) + $spacing-lg);

  .header {
    position: relative;
    padding: $spacing-xl $spacing-md;
    /* #ifdef MP */
    padding-top: calc(var(--nav-bar-height) + $spacing-xl);
    /* #endif */
    /* #ifdef H5 */
    padding-top: $spacing-xl;
    /* #endif */

    .header-bg {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      height: calc(var(--nav-bar-height) + 200rpx);
      background: $gradient-aurora;
      opacity: 0.15;
      border-radius: 0 0 $radius-xl $radius-xl;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      padding: $spacing-lg;

      .fa-solid {
        font-size: 36rpx;
        color: $accent-indigo;
      }

      .header-text {
        flex: 1;

        .header-title {
          font-size: 40rpx;
          font-weight: 700;
          color: $text-primary;
          display: block;
        }

        .header-subtitle {
          font-size: 24rpx;
          color: $text-secondary;
          margin-top: $spacing-xs;
          display: block;
        }
      }
    }
  }

  .tip-card {
    margin: $spacing-md;
    padding: $spacing-md;
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    .fa-solid {
      font-size: 24rpx;
      color: $accent-indigo;
    }

    .tip-text {
      font-size: 24rpx;
      color: $text-secondary;
    }
  }

  .menu-section {
    margin: $spacing-md;

    .section-title {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      margin-bottom: $spacing-md;

      .fa-solid {
        font-size: 24rpx;
        color: $accent-indigo;
      }

      text {
        font-size: 28rpx;
        font-weight: 600;
        color: $text-primary;
      }

      .section-count {
        font-size: 24rpx;
        color: $text-muted;
        margin-left: $spacing-sm;
      }
    }

    .menu-list {
      .menu-item {
        display: flex;
        align-items: center;
        padding: $spacing-md;
        margin-bottom: $spacing-sm;
        transition: all $transition-normal;

        &.dragging {
          opacity: 0.85;
          transform: scale(1.02);
          box-shadow: $shadow-strong;
          z-index: 10;
        }

        &.disabled {
          opacity: 0.5;

          .item-icon {
            background: $text-muted !important;
          }
        }

        .drag-handle {
          width: 48rpx;
          height: 48rpx;
          display: flex;
          align-items: center;
          justify-content: center;

          .fa-solid {
            font-size: 24rpx;
            color: $text-muted;
          }
        }

        .item-content {
          flex: 1;
          display: flex;
          align-items: center;
          gap: $spacing-md;

          .item-icon {
            width: 56rpx;
            height: 56rpx;
            border-radius: $radius-lg;
            display: flex;
            align-items: center;
            justify-content: center;

            .fa-solid {
              font-size: 24rpx;
              color: #ffffff;
            }

            &.gradient-primary {
              background: $gradient-primary;
            }

            &.gradient-warm {
              background: $gradient-warm;
            }

            &.gradient-aurora {
              background: $gradient-aurora;
            }

            &.gradient-cool {
              background: $gradient-cool;
            }

            &.gradient-sunset {
              background: linear-gradient(135deg, #F97316 0%, #FB923C 100%);
            }

            &.gradient-spring {
              background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
            }
          }

          .item-name {
            font-size: 30rpx;
            font-weight: 500;
            color: $text-primary;
          }
        }
      }
    }

    .section-tip {
      margin-top: $spacing-sm;
      text-align: center;

      text {
        font-size: 24rpx;
        color: $text-muted;
      }
    }
  }

  .action-section {
    margin: $spacing-xl $spacing-md;

    .reset-btn {
      width: 100%;
      height: 88rpx;
      border-radius: $radius-lg;
      background: rgba(99, 102, 241, 0.1);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-sm;
      transition: all $transition-fast;

      .fa-solid {
        font-size: 28rpx;
        color: $accent-indigo;
      }

      text {
        font-size: 28rpx;
        color: $accent-indigo;
        font-weight: 500;
      }

      &:active {
        opacity: 0.8;
        transform: scale(0.98);
      }
    }
  }
}
</style>