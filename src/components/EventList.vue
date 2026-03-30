<template>
  <view class="event-list">
    <!-- Empty state -->
    <view v-if="filteredEvents.length === 0" class="empty-state glass-card">
      <view class="empty-icon-wrap">
        <text class="fa-solid fa-inbox"></text>
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
          <u-swipe-action
            :options="swipeOptions"
            @click="handleSwipeClick($event, event.id)"
          >
            <view class="event-card-inner">
              <!-- Type indicator with gradient -->
              <view class="type-indicator" :style="{ background: getTypeGradient(event.typeId) }"></view>

              <!-- Content -->
              <view class="event-content">
                <view class="event-header">
                  <view class="type-tag" :style="{ backgroundColor: getTypeColor(event.typeId) }">
                    <text class="fa-solid fa-star"></text>
                    <text class="type-name">{{ getTypeName(event.typeId) }}</text>
                  </view>
                </view>

                <text class="event-name">{{ event.name }}</text>

                <view class="event-time">
                  <text class="fa-solid fa-clock"></text>
                  <text class="time-text">{{ formatTime(event.time) }}</text>
                </view>
              </view>
            </view>

            <!-- Card decoration -->
            <view class="card-decoration" :style="{ background: getTypeGradient(event.typeId) }"></view>
          </u-swipe-action>
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

const filteredEvents = computed(() => eventStore.filteredEvents)

// 颜色计算缓存 - 避免每次渲染重复计算
const typeColorMap = computed(() => {
  const map = new Map<string, { gradient: string; baseColor: string }>()

  // 预计算所有类型的颜色
  eventTypeStore.types.forEach(type => {
    const gradient = `linear-gradient(135deg, ${type.color} 0%, ${adjustColor(type.color, -20)} 100%)`
    map.set(type.id, {
      gradient,
      baseColor: type.color
    })
  })

  // 添加默认类型（未分类）的颜色
  map.set('', {
    gradient: 'linear-gradient(135deg, #999999 0%, #7a7a7a 100%)',
    baseColor: '#999999'
  })

  return map
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

// 使用缓存的颜色映射
function getTypeGradient(typeId: string): string {
  return typeColorMap.value.get(typeId)?.gradient || typeColorMap.value.get('')!.gradient
}

function getTypeColor(typeId: string): string {
  return typeColorMap.value.get(typeId)?.baseColor || '#999999'
}

function getTypeName(typeId: string): string {
  return eventTypeStore.getTypeName(typeId)
}

// 虚拟滚动配置
const ITEM_HEIGHT = 140 // 卡片高度 + 间距（rpx 转 px 约 70px，使用 140px 确保安全）
const BUFFER_SIZE = 5   // 缓冲区项目数

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

// 初始化时计算容器高度
onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  // 减去 header + filter + tabbar 大约 200px
  containerHeight.value = systemInfo.windowHeight - 200
})

// Swipe action options
const swipeOptions = [
  {
    text: '删除',
    style: {
      backgroundColor: '#EF4444'
    }
  }
]

// Handle swipe delete with confirmation
const handleSwipeClick = (index: number, eventId: string) => {
  if (index === 0) {
    uni.showModal({
      title: '确认删除',
      content: '确定要删除这个事件吗？',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          eventStore.deleteEvent(eventId)
          uni.showToast({
            title: '已删除',
            icon: 'success'
          })
        }
      }
    })
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