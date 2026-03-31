<template>
  <view class="event-list">
    <!-- Empty state -->
    <view v-if="filteredEvents.length === 0" class="empty-state glass-card">
      <view class="empty-icon-wrap">
        <text class="fa-solid">&#xf01c;</text>
      </view>
      <text class="empty-title">暂无事件记录</text>
      <text class="empty-subtitle">点击右下角按钮添加新事件</text>
      <view class="empty-decoration">
        <view class="deco-dot d1"></view>
        <view class="deco-dot d2"></view>
        <view class="deco-dot d3"></view>
      </view>
    </view>

    <!-- Virtual scroll container -->
    <scroll-view
      v-else
      scroll-y
      :scroll-top="scrollTop"
      :style="{ height: containerHeight + 'px' }"
      @scroll="onScroll"
      class="virtual-scroll-container"
    >
      <!-- 占位容器，撑开真实高度 -->
      <view :style="{ height: totalHeight + 'px', position: 'relative' }">
        <!-- 仅渲染可视区域项目 -->
        <view
          v-for="event in visibleEvents"
          :key="event.id"
          class="event-card glass-card"
          :style="{ position: 'absolute', top: getEventOffset(event._index) + 'px', width: '100%' }"
        >
          <view
            class="event-card-inner"
            @touchstart="(e: any) => onTouchStart(e, event.id)"
            @touchend="onTouchEnd"
            @touchmove="onTouchMove"
            @touchcancel="onTouchEnd"
          >
            <!-- Type indicator with gradient -->
            <view class="type-indicator" :style="{ background: getTypeGradient(event.typeId) }"></view>

            <!-- Content -->
            <view class="event-content">
              <view class="event-header">
                <view class="type-tag" :style="{ backgroundColor: getTypeColor(event.typeId) }">
                  <text class="fa-solid">&#xf005;</text>
                  <text class="type-name">{{ getTypeName(event.typeId) }}</text>
                </view>
              </view>

              <text class="event-name">{{ event.name }}</text>

              <view class="event-time">
                <text class="fa-solid">&#xf017;</text>
                <text class="time-text">{{ formatTime(event.time) }}</text>
              </view>
            </view>
          </view>

          <!-- Card decoration -->
          <view class="card-decoration" :style="{ background: getTypeGradient(event.typeId) }"></view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import { formatTime } from '@/utils/time'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()

// 监听事件类型变化，确保组件能响应类型变更
const typeVersion = computed(() => eventTypeStore.types.length)

const filteredEvents = computed(() => {
  // 访问 typeVersion 以建立响应式依赖
  void typeVersion.value
  return eventStore.filteredEvents
})

// Helper to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '')
  const num = parseInt(hex, 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// 直接从 store 获取类型信息，确保响应式更新
function getTypeGradient(typeId: string): string {
  const type = eventTypeStore.getTypeById(typeId)
  if (type) {
    return `linear-gradient(135deg, ${type.color} 0%, ${adjustColor(type.color, -20)} 100%)`
  }
  // 默认类型（未分类）的颜色
  return 'linear-gradient(135deg, #999999 0%, #7a7a7a 100%)'
}

function getTypeColor(typeId: string): string {
  const type = eventTypeStore.getTypeById(typeId)
  return type?.color || '#999999'
}

function getTypeName(typeId: string): string {
  return eventTypeStore.getTypeName(typeId)
}

// 虚拟滚动配置
const ITEM_HEIGHT = 140 // 卡片高度 + 间距（rpx 转 px 约 70px，使用 140px 确保安全）
const BUFFER_SIZE = 5   // 缓冲区项目数

// 长按相关状态
const LONG_PRESS_DURATION = 800 // 长按时长 ms
const CANCEL_DISTANCE = 20 // 取消滑动距离 px

const isLongPressing = ref(false)
const menuVisible = ref(false)
const menuPosition = ref({ x: 0, y: 0 })
const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const touchStartPos = ref({ x: 0, y: 0 })
const selectedEventId = ref<string | null>(null)

const scrollTop = ref(0)
const containerHeight = ref(500) // 默认容器高度，后续会计算

// 计算可视范围
const visibleRange = computed(() => {
  const startIndex = Math.max(0, Math.floor(scrollTop.value / ITEM_HEIGHT) - BUFFER_SIZE)
  const visibleCount = Math.ceil(containerHeight.value / ITEM_HEIGHT) + 2 * BUFFER_SIZE
  const endIndex = Math.min(filteredEvents.value.length, startIndex + visibleCount)
  return { startIndex, endIndex }
})

// 仅渲染可视区域的事件
const visibleEvents = computed(() => {
  const { startIndex, endIndex } = visibleRange.value
  return filteredEvents.value.slice(startIndex, endIndex).map((event, i) => ({
    ...event,
    _index: startIndex + i
  }))
})

// 总高度（用于撑开滚动容器）
const totalHeight = computed(() => filteredEvents.value.length * ITEM_HEIGHT)

// 计算每个项目的偏移位置
function getEventOffset(index: number): number {
  return index * ITEM_HEIGHT
}

// 滚动事件处理
function onScroll(e: { detail: { scrollTop: number } }): void {
  scrollTop.value = e.detail.scrollTop
}

// 重置滚动位置（用于新增事件后）
function resetScroll() {
  scrollTop.value = 0
}

// 初始化时计算容器高度
onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  // 减去 header + filter + tabbar 大约 200px
  containerHeight.value = systemInfo.windowHeight - 200
})

// 暴露方法给父组件
defineExpose({
  resetScroll
})

const emit = defineEmits(['edit'])

// 触摸开始
function onTouchStart(e: any, eventId: string) {
  const touch = e.touches[0]
  touchStartPos.value = { x: touch.clientX, y: touch.clientY }
  selectedEventId.value = eventId
  isLongPressing.value = true

  // 开始长按计时
  longPressTimer.value = setTimeout(() => {
    if (isLongPressing.value) {
      // 长按触发，显示菜单
      menuPosition.value = {
        x: touchStartPos.value.x,
        y: touchStartPos.value.y - 60 // 在长按位置上方 60px
      }
      menuVisible.value = true
    }
  }, LONG_PRESS_DURATION)
}

// 触摸结束
function onTouchEnd() {
  isLongPressing.value = false
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

// 触摸移动（取消长按）
function onTouchMove(e: any) {
  const touch = e.touches[0]
  const distance = Math.sqrt(
    Math.pow(touch.clientX - touchStartPos.value.x, 2) +
    Math.pow(touch.clientY - touchStartPos.value.y, 2)
  )
  if (distance > CANCEL_DISTANCE) {
    // 移动超过阈值，取消长按
    isLongPressing.value = false
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
      longPressTimer.value = null
    }
  }
}
</script>

<style lang="scss" scoped>
.event-list {
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $spacing-2xl $spacing-lg;
    margin: $spacing-lg;
    position: relative;

    .empty-icon-wrap {
      width: 120rpx;
      height: 120rpx;
      border-radius: $radius-lg;
      background: $gradient-soft;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: $spacing-lg;

      .fa-solid {
        font-size: 48rpx;
        color: $accent-purple;
      }
    }

    .empty-title {
      font-size: 32rpx;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: $spacing-sm;
    }

    .empty-subtitle {
      font-size: 26rpx;
      color: $text-secondary;
    }

    .empty-decoration {
      position: absolute;
      right: $spacing-lg;
      bottom: $spacing-lg;

      .deco-dot {
        width: 8rpx;
        height: 8rpx;
        border-radius: 50%;
        position: absolute;

        &.d1 {
          background: $primary-color;
          right: 0;
          bottom: 0;
        }

        &.d2 {
          background: $accent-purple;
          right: 20rpx;
          bottom: 20rpx;
        }

        &.d3 {
          background: $accent-indigo;
          right: 40rpx;
          bottom: 10rpx;
        }
      }
    }
  }

  .virtual-scroll-container {
    overflow: hidden;

    .event-card {
      margin-bottom: 0;
      padding-bottom: $spacing-md;
      box-sizing: border-box;
      overflow: hidden;
      position: relative;

      .event-card-inner {
        display: flex;
        padding: $spacing-lg;

        .type-indicator {
          width: 8rpx;
          border-radius: $radius-full;
          margin-right: $spacing-md;
          flex-shrink: 0;
          opacity: 0.9;
        }

        .event-content {
          flex: 1;

          .event-header {
            margin-bottom: $spacing-sm;

            .type-tag {
              display: inline-flex;
              align-items: center;
              gap: 8rpx;
              padding: 8rpx $spacing-md;
              border-radius: $radius-full;

              .fa-solid {
                font-size: 14rpx;
                color: #ffffff;
              }

              .type-name {
                font-size: 22rpx;
                color: #ffffff;
                font-weight: 500;
              }
            }
          }

          .event-name {
            font-size: 32rpx;
            font-weight: 600;
            color: $text-primary;
            line-height: 1.5;
            display: block;
            margin-bottom: $spacing-sm;
            // Ensure fixed height for virtual scroll
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .event-time {
            display: flex;
            align-items: center;
            gap: $spacing-xs;

            .fa-solid {
              font-size: 16rpx;
              color: $text-secondary;
            }

            .time-text {
              font-size: 24rpx;
              color: $text-secondary;
            }
          }
        }
      }

      .card-decoration {
        position: absolute;
        right: -40rpx;
        bottom: -40rpx;
        width: 100rpx;
        height: 100rpx;
        border-radius: 50%;
        opacity: 0.1;
      }
    }
  }
}
</style>