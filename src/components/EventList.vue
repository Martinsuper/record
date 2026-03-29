<template>
  <view class="event-list">
    <!-- Empty state -->
    <view v-if="filteredEvents.length === 0" class="empty-state">
      <view class="empty-icon">
        <u-icon name="calendar" size="80" color="#99F6E4" />
      </view>
      <text class="empty-title">暂无事件记录</text>
      <text class="empty-subtitle">点击右下角按钮添加新事件</text>
    </view>

    <!-- Event cards -->
    <view v-else class="event-cards">
      <u-swipe-action
        v-for="event in filteredEvents"
        :key="event.id"
        :options="swipeOptions"
        @click="handleSwipeClick($event, event.id)"
      >
        <view class="event-card">
          <view class="event-card-inner">
            <!-- Type indicator -->
            <view class="type-indicator" :style="{ backgroundColor: getTypeColor(event.typeId) }" />

            <!-- Content -->
            <view class="event-content">
              <view class="event-header">
                <view class="type-tag" :style="{ backgroundColor: getTypeColor(event.typeId) }">
                  <u-icon name="tag" size="12" color="#ffffff" />
                  <text class="type-name">{{ getTypeName(event.typeId) }}</text>
                </view>
              </view>

              <text class="event-name">{{ event.name }}</text>

              <view class="event-time">
                <u-icon name="clock" size="14" color="#5EEAD4" />
                <text class="time-text">{{ formatTime(event.time) }}</text>
              </view>
            </view>
          </view>
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
    padding: 120rpx 48rpx;

    .empty-icon {
      width: 160rpx;
      height: 160rpx;
      border-radius: 50%;
      background: linear-gradient(135deg, #E6FFFA 0%, #CCFBF1 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 32rpx;
    }

    .empty-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #134E4A;
      margin-bottom: 12rpx;
    }

    .empty-subtitle {
      font-size: 26rpx;
      color: #5EEAD4;
    }
  }

  .event-cards {
    .event-card {
      background: #ffffff;
      border-radius: 16rpx;
      margin-bottom: 20rpx;
      overflow: hidden;
      box-shadow: 0 2rpx 12rpx rgba(13, 148, 136, 0.08);

      .event-card-inner {
        display: flex;
        padding: 24rpx;

        .type-indicator {
          width: 6rpx;
          border-radius: 6rpx;
          margin-right: 20rpx;
          flex-shrink: 0;
        }

        .event-content {
          flex: 1;

          .event-header {
            margin-bottom: 12rpx;

            .type-tag {
              display: inline-flex;
              align-items: center;
              gap: 6rpx;
              padding: 6rpx 16rpx;
              border-radius: 20rpx;

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
            color: #134E4A;
            line-height: 1.4;
            display: block;
            margin-bottom: 12rpx;
          }

          .event-time {
            display: flex;
            align-items: center;
            gap: 8rpx;

            .time-text {
              font-size: 24rpx;
              color: #5EEAD4;
            }
          }
        }
      }
    }
  }
}
</style>