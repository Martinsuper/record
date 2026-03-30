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

    <!-- Event cards -->
    <view v-else class="event-cards">
      <u-swipe-action
        v-for="(event, index) in filteredEvents"
        :key="event.id"
        :options="swipeOptions"
        @click="handleSwipeClick($event, event.id)"
      >
        <view class="event-card glass-card fade-in-up" :style="{ animationDelay: (index * 0.05) + 's' }">
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
        </view>
      </u-swipe-action>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import { formatTime } from '@/utils/time'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()

const filteredEvents = computed(() => eventStore.filteredEvents)

// Get type name and color from store
const getTypeName = (typeId: string) => eventTypeStore.getTypeName(typeId)
const getTypeColor = (typeId: string) => eventTypeStore.getTypeColor(typeId)

// Get gradient for type indicator
const getTypeGradient = (typeId: string) => {
  const color = eventTypeStore.getTypeColor(typeId)
  return `linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -20)} 100%)`
}

// Helper to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '')
  const num = parseInt(hex, 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

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
  min-height: 60vh;

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

  .event-cards {
    .event-card {
      margin-bottom: $spacing-md;
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