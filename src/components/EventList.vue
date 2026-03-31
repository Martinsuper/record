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
      :show-scrollbar="false"
      @scroll="onScroll"
      class="virtual-scroll-container"
    >
      <!-- 占位容器，撑开真实高度 -->
      <view :style="{ height: totalHeight + 'px' }">
        <!-- 仅渲染可视区域项目 -->
        <view
          v-for="event in visibleEvents"
          :key="event.id"
          class="event-card glass-card"
          :class="{ 'expanded': expandedEventId === event.id }"
          :style="getCardStyle(event._index)"
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
      </view>
    </scroll-view>

    <!-- 移除气泡菜单 -->
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
const ITEM_HEIGHT = 120 // 卡片基础高度（rpx 转 px，包含间距）
const BUFFER_SIZE = 5   // 缓冲区项目数
const CARD_GAP = 16 // 卡片间距 px

// 展开状态
const expandedEventId = ref<string | null>(null)
// 展开后额外增加的高度 (与 .event-detail 高度匹配)
const EXPANDED_EXTRA_HEIGHT = 100

const scrollTop = ref(0)
const containerHeight = ref(500) // 默认容器高度，后续会计算

// 计算可视范围
const visibleRange = computed(() => {
  const itemTotalHeight = ITEM_HEIGHT + CARD_GAP
  const startIndex = Math.max(0, Math.floor(scrollTop.value / itemTotalHeight) - BUFFER_SIZE)
  const visibleCount = Math.ceil(containerHeight.value / itemTotalHeight) + 2 * BUFFER_SIZE
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

// 总高度（用于撑开滚动容器，考虑展开状态）
const totalHeight = computed(() => {
  let height = 0
  for (let i = 0; i < filteredEvents.value.length; i++) {
    height += ITEM_HEIGHT
    const isExpanded = expandedEventId.value !== null && filteredEvents.value[i]?.id === expandedEventId.value
    if (!isExpanded) {
      height += CARD_GAP
    }
  }
  // 如果有展开的卡片，增加额外高度
  if (expandedEventId.value !== null) {
    height += EXPANDED_EXTRA_HEIGHT
  }
  return height
})

// 计算每个项目的偏移位置
function getEventOffset(index: number): number {
  let offset = 0
  for (let i = 0; i < index; i++) {
    // 每张卡片的基础高度
    offset += ITEM_HEIGHT
    // 如果这张卡片是展开的，增加额外高度且没有 margin-bottom
    const isExpanded = expandedEventId.value !== null && filteredEvents.value[i]?.id === expandedEventId.value
    if (isExpanded) {
      offset += EXPANDED_EXTRA_HEIGHT
    } else {
      offset += CARD_GAP
    }
  }
  return offset
}

// 获取卡片样式（支持展开状态）
function getCardStyle(index: number) {
  const event = filteredEvents.value[index]
  const isExpanded = expandedEventId.value === event?.id
  // 展开卡片高度增加，非展开卡片保持基础高度
  const height = isExpanded ? (ITEM_HEIGHT + EXPANDED_EXTRA_HEIGHT) : ITEM_HEIGHT
  return {
    position: 'absolute' as const,
    top: getEventOffset(index) + 'px',
    width: '100%',
    height: height + 'px'
  }
}

// 切换展开/收起状态
function toggleExpand(eventId: string) {
  expandedEventId.value = expandedEventId.value === eventId ? null : eventId
}

// 滚动事件处理
function onScroll(e: { detail: { scrollTop: number } }): void {
  scrollTop.value = e.detail.scrollTop
  // 滚动时收起展开的卡片
  if (expandedEventId.value !== null) {
    expandedEventId.value = null
  }
}

// 重置滚动位置（用于新增事件后）
function resetScroll() {
  scrollTop.value = 0
  expandedEventId.value = null
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
      margin-bottom: $spacing-md;
      padding-bottom: 0;
      box-sizing: border-box;
      overflow: visible;
      position: relative;
      transition: all 0.3s ease;

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

          // 展开后的详情区域
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