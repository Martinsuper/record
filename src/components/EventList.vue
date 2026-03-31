<template>
  <view class="event-list">
    <!-- Empty state -->
    <view v-if="!eventStore.isLoaded" class="loading-state">
      <text class="loading-text">加载中...</text>
    </view>

    <view v-else-if="filteredEvents.length === 0" class="empty-state glass-card">
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

    <!-- 原生滚动 + 下拉刷新 -->
    <scroll-view
      v-else
      scroll-y
      class="scroll-container"
      refresher-enabled
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <view class="event-list-inner">
        <view
          v-for="event in filteredEvents"
          :key="event.id"
          class="event-card glass-card"
          :class="{ 'expanded': expandedEventId === event.id }"
        >
          <view
            class="event-card-inner"
            @click="toggleExpand(event.id)"
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
                <text class="expand-icon" :class="{ 'rotated': expandedEventId === event.id }">&#xf107;</text>
              </view>

              <text class="event-name">{{ event.name }}</text>

              <view class="event-time">
                <text class="fa-solid">&#xf017;</text>
                <text class="time-text">{{ formatTime(event.time) }}</text>
              </view>

              <!-- 展开后的详情区域 -->
              <view v-if="expandedEventId === event.id" class="event-detail">
                <view class="detail-divider"></view>
                <view class="detail-actions">
                  <view class="action-btn edit" @click.stop="handleEdit(event)">
                    <text class="fa-solid">&#xf044;</text>
                    <text class="action-text">编辑</text>
                  </view>
                  <view class="action-btn delete" @click.stop="handleDelete(event)">
                    <text class="fa-solid">&#xf1f8;</text>
                    <text class="action-text">删除</text>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- Card decoration -->
          <view class="card-decoration" :style="{ background: getTypeGradient(event.typeId) }"></view>
        </view>

        <!-- 加载更多提示 -->
        <view v-if="isLoadingMore" class="loading-more">
          <text class="loading-more-text">加载中...</text>
        </view>
        <view v-else-if="hasMore === false && filteredEvents.length > 0" class="no-more">
          <text class="no-more-text">- 没有更多了 -</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import { formatTime } from '@/utils/time'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()

// 监听事件类型变化
const typeVersion = computed(() => eventTypeStore.types.length)

const filteredEvents = computed(() => {
  void typeVersion.value
  return eventStore.filteredEvents
})

// 是否有更多数据
const hasMore = computed(() => eventStore.hasMoreEvents)

// 加载状态
const isRefreshing = ref(false)
const isLoadingMore = ref(false)

// 展开状态
const expandedEventId = ref<string | null>(null)

// Helper to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '')
  const num = parseInt(hex, 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function getTypeGradient(typeId: string): string {
  const type = eventTypeStore.getTypeById(typeId)
  if (type) {
    return `linear-gradient(135deg, ${type.color} 0%, ${adjustColor(type.color, -20)} 100%)`
  }
  return 'linear-gradient(135deg, #999999 0%, #7a7a7a 100%)'
}

function getTypeColor(typeId: string): string {
  const type = eventTypeStore.getTypeById(typeId)
  return type?.color || '#999999'
}

function getTypeName(typeId: string): string {
  return eventTypeStore.getTypeName(typeId)
}

// 切换展开/收起状态
function toggleExpand(eventId: string) {
  expandedEventId.value = expandedEventId.value === eventId ? null : eventId
}

// 下拉刷新
async function onRefresh() {
  isRefreshing.value = true
  expandedEventId.value = null

  // 重置分页并刷新数据
  eventStore.resetPagination()
  eventStore.refresh()

  // 模拟短暂延迟，让刷新动画更自然
  await new Promise(resolve => setTimeout(resolve, 300))
  isRefreshing.value = false
}

// 上拉加载更多
async function onLoadMore() {
  if (isLoadingMore.value || !hasMore.value) return

  isLoadingMore.value = true
  eventStore.loadMore()

  // 模拟短暂延迟
  await new Promise(resolve => setTimeout(resolve, 200))
  isLoadingMore.value = false
}

// 重置滚动位置（用于新增事件后）
function resetScroll() {
  eventStore.resetPagination()
  eventStore.refresh()
  expandedEventId.value = null
}

// 监听筛选条件变化，重置分页
watch(
  () => eventStore.filterType,
  () => {
    eventStore.resetPagination()
  }
)

watch(
  () => eventStore.filterTimeRange,
  () => {
    eventStore.resetPagination()
  }
)

// 暴露方法给父组件
defineExpose({
  resetScroll
})

const emit = defineEmits(['edit'])

// 处理编辑
function handleEdit(event: typeof filteredEvents.value[number]) {
  emit('edit', {
    id: event.id,
    name: event.name,
    typeId: event.typeId,
    time: event.time
  })
}

// 处理删除
function handleDelete(event: typeof filteredEvents.value[number]) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个事件吗？',
    confirmColor: '#EF4444',
    success: (res) => {
      if (res.confirm) {
        eventStore.deleteEvent(event.id)
        expandedEventId.value = null
        uni.showToast({
          title: '已删除',
          icon: 'success'
        })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.event-list {
  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-2xl;

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

  .scroll-container {
    height: calc(100vh - 300rpx);

    .event-list-inner {
      padding: $spacing-md;
    }

    .event-card {
      margin-bottom: $spacing-md;
      position: relative;
      transition: all 0.3s ease;
      overflow: visible;

      &.expanded {
        margin-bottom: 0;
        z-index: 10;
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);

        .event-card-inner {
          background: rgba(#ffffff, 0.95);
        }
      }

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
            display: flex;
            justify-content: space-between;
            align-items: center;
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

            .expand-icon {
              font-size: 24rpx;
              color: $text-secondary;
              transition: transform 0.3s ease;

              &.rotated {
                transform: rotate(180deg);
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

          .event-detail {
            margin-top: $spacing-md;
            padding-top: $spacing-md;
            animation: slide-down 0.3s ease;

            .detail-divider {
              height: 1rpx;
              background: linear-gradient(90deg, transparent, rgba($primary-color, 0.3), transparent);
              margin-bottom: $spacing-md;
            }

            .detail-actions {
              display: flex;
              gap: $spacing-md;

              .action-btn {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: $spacing-xs;
                padding: $spacing-sm $spacing-md;
                border-radius: $radius-md;
                transition: background 0.15s ease;

                .fa-solid {
                  font-size: 28rpx;
                }

                .action-text {
                  font-size: 26rpx;
                  font-weight: 500;
                }

                &.edit {
                  background: rgba($primary-color, 0.1);
                  color: $primary-color;

                  &:active {
                    background: rgba($primary-color, 0.2);
                  }
                }

                &.delete {
                  background: rgba(#EF4444, 0.1);
                  color: #EF4444;

                  &:active {
                    background: rgba(#EF4444, 0.2);
                  }
                }
              }
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

    .loading-more {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: $spacing-lg;

      .loading-more-text {
        font-size: 26rpx;
        color: $text-secondary;
      }
    }

    .no-more {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: $spacing-lg;

      .no-more-text {
        font-size: 24rpx;
        color: $text-muted;
      }
    }
  }
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
