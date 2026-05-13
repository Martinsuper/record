<template>
  <view class="event-list">
    <!-- Empty state -->
    <view v-if="!eventStore.isLoaded" class="loading-state">
      <text class="loading-text">加载中...</text>
    </view>

    <view v-else-if="filteredEvents.length === 0" class="empty-state">
      <FaIcon name="inbox" size="48rpx" />
      <text class="empty-text">还没有事件记录</text>
      <text class="empty-hint">点击右下角按钮添加</text>
    </view>

    <!-- 列表直接渲染，不使用 scroll-view -->
    <view v-else class="event-list-inner">
      <view
        v-for="event in filteredEvents"
        :key="event.id"
        class="event-card glass-card"
        @click="handleEdit(event)"
      >
        <view class="card-content">
          <view class="card-header">
            <text class="card-name">{{ event.name }}</text>
            <view v-if="typeName" class="type-indicator" :style="{ backgroundColor: getTypeColor(event.typeId) }">
              <text class="type-text">{{ typeName(event.typeId) }}</text>
            </view>
          </view>
          <view class="card-time">
            <text class="time-text">{{ formatRelativeTime(event.time) }}</text>
          </view>
          <view class="card-date">
            <FaIcon name="clock" size="20rpx" />
            <text class="date-text">{{ formatTime(event.time) }}</text>
          </view>
        </view>
      </view>

      <!-- 加载更多提示 -->
      <view v-if="hasMore && filteredEvents.length > 0" class="load-more-hint">
        <text class="load-more-text">上拉加载更多</text>
      </view>
      <view v-else-if="!hasMore && filteredEvents.length > 0" class="no-more">
        <text class="no-more-text">- 没有更多了 -</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import { formatTime } from '@/utils/time'
import FaIcon from '@/components/FaIcon.vue'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()

const emit = defineEmits(['edit', 'loadMore'])

// 监听事件类型变化
const typeVersion = computed(() => eventTypeStore.types.length)

const filteredEvents = computed(() => {
  void typeVersion.value
  return eventStore.filteredEvents
})

// 是否有更多数据
const hasMore = computed(() => eventStore.hasMoreEvents)

function getTypeColor(typeId: string): string {
  const type = eventTypeStore.getTypeById(typeId)
  return type?.color || '#6366F1'
}

function typeName(typeId: string): string | null {
  const type = eventTypeStore.getTypeById(typeId)
  return type?.name || null
}

// 格式化相对时间
function formatRelativeTime(time: number): string {
  const now = Date.now()
  const diff = now - time
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}个月前`
  return `${Math.floor(days / 365)}年前`
}

// 重置（用于新增事件后）
function resetScroll() {
  eventStore.resetPagination()
  eventStore.refresh()
}

// 监听筛选条件变化，重置分页
watch(
  () => eventStore.filterType,
  () => {
    eventStore.resetPagination()
    const count = eventStore.filteredEventsFull.length
    if (eventStore.filterType && count === 0) {
      uni.showToast({ title: '没有找到相关事件', icon: 'none', duration: 1500 })
    }
  }
)

watch(
  () => eventStore.filterTimeRange,
  () => {
    eventStore.resetPagination()
    const count = eventStore.filteredEventsFull.length
    if (eventStore.filterTimeRange !== 'all' && count === 0) {
      uni.showToast({ title: '该时间段没有事件', icon: 'none', duration: 1500 })
    }
  }
)

// 暴露方法给父组件
defineExpose({ resetScroll })

// 处理编辑（点击卡片直接编辑）
function handleEdit(event: typeof filteredEvents.value[number]) {
  emit('edit', {
    id: event.id,
    name: event.name,
    typeId: event.typeId,
    time: event.time
  })
}
</script>

<style lang="scss" scoped>
.event-list {
  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 120rpx;

    .loading-text {
      font-size: 28rpx;
      color: $text-secondary;
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 120rpx $spacing-xl;

    .empty-text {
      font-size: 32rpx;
      color: $text-secondary;
      margin-top: $spacing-lg;
      margin-bottom: $spacing-sm;
    }

    .empty-hint {
      font-size: 26rpx;
      color: $text-muted;
    }
  }

  .event-list-inner {
    .event-card {
      margin-bottom: $spacing-md;
      padding: $spacing-lg;
      border-radius: $radius-lg;
      transition: all $transition-fast;

      &:active {
        transform: scale(0.98);
        opacity: 0.9;
      }

      .card-content {
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: $spacing-sm;

          .card-name {
            font-size: 32rpx;
            font-weight: 600;
            color: $text-primary;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .type-indicator {
            padding: 4rpx 12rpx;
            border-radius: $radius-xs;

            .type-text {
              font-size: 20rpx;
              color: #ffffff;
              font-weight: 500;
            }
          }
        }

        .card-time {
          margin-bottom: $spacing-sm;

          .time-text {
            font-size: 40rpx;
            font-weight: 700;
            color: $accent-indigo;
          }
        }

        .card-date {
          display: flex;
          align-items: center;
          gap: $spacing-xs;

          .date-text {
            font-size: 24rpx;
            color: $text-secondary;
          }
        }
      }
    }

    .no-more {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: $spacing-lg $spacing-md;
      padding-bottom: calc($spacing-lg + env(safe-area-inset-bottom));

      .no-more-text {
        font-size: 24rpx;
        color: $text-muted;
      }
    }

    .load-more-hint {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: $spacing-lg;

      .load-more-text {
        font-size: 24rpx;
        color: $text-muted;
      }
    }
  }
}
</style>