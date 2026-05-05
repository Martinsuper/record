<template>
  <view class="page-index" :style="{ '--nav-bar-height': navBarHeight + 'px' }">
    <!-- Glassmorphism Header -->
    <view class="header glass-card">
      <view class="header-content">
        <view class="header-icon-wrap">
          <text class="fa-solid">&#xf896;</text>
        </view>
        <view class="header-text">
          <text class="header-title gradient-text">记录时光</text>
          <text class="header-subtitle">捕捉每一个精彩瞬间</text>
        </view>
      </view>
      <view class="header-decoration">
        <view class="deco-circle c1"></view>
        <view class="deco-circle c2"></view>
        <view class="deco-circle c3"></view>
      </view>
      <!-- Type management entry -->
      <view class="type-manage-btn" @click="showTypeManager = true">
        <view class="btn-icon-bg">
          <text class="fa-solid">&#xf02b;</text>
        </view>
        <text class="btn-text">类型</text>
      </view>
    </view>

    <!-- Stats Overview Card (Collapsible) -->
    <view class="stats-section">
      <view class="stats-card glass-card" :class="{ expanded: showStatsDetail }">
        <view class="stats-header" @click="toggleStats">
          <view class="stats-summary">
            <view class="stat-item-mini">
              <text class="stat-value-mini">{{ totalCount }}</text>
              <text class="stat-label-mini">总计</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item-mini">
              <text class="stat-value-mini">{{ monthCount }}</text>
              <text class="stat-label-mini">本月</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item-mini">
              <text class="stat-value-mini">{{ typeStats.length }}</text>
              <text class="stat-label-mini">类型</text>
            </view>
          </view>
          <view class="stats-toggle">
            <text class="fa-solid">{{ showStatsDetail ? '&#xf077;' : '&#xf078;' }}</text>
          </view>
        </view>

        <!-- Expanded Stats Detail -->
        <view v-if="showStatsDetail" class="stats-detail">
          <!-- Type distribution -->
          <view class="type-stats-section">
            <text class="stats-subtitle">类型分布</text>
            <view v-if="typeStats.length === 0" class="empty-stats">
              <text class="empty-text">暂无数据</text>
            </view>
            <view v-else class="type-stats-mini">
              <view v-for="stat in typeStats.slice(0, 5)" :key="stat.typeId" class="type-stat-row">
                <view class="type-badge" :style="{ backgroundColor: stat.color }"></view>
                <text class="type-name-mini">{{ stat.name }}</text>
                <view class="stat-bar-mini">
                  <view class="stat-bar-fill" :style="{ width: stat.percent + '%', backgroundColor: stat.color }"></view>
                </view>
                <text class="type-count-mini">{{ stat.count }}</text>
              </view>
            </view>
          </view>

          <!-- Recent 7 days -->
          <view class="trend-section">
            <text class="stats-subtitle">近7天</text>
            <view class="trend-mini-chart">
              <view v-for="(day, index) in recentStats" :key="index" class="trend-bar-item">
                <view class="trend-bar" :style="{ height: getBarHeight(day.count) + 'px' }">
                  <text v-if="day.count > 0" class="bar-count">{{ day.count }}</text>
                </view>
                <text class="trend-label">{{ day.label }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Anniversary Reminder -->
    <AnniversaryReminder
      :visible="showReminder"
      :upcomingList="upcomingAnniversaries"
      @close="onReminderClose"
      @navigate="onReminderNavigate"
    />

    <!-- Filter bar -->
    <view class="filter-section">
      <FilterBar />
    </view>

    <!-- Event list -->
    <view class="list-section">
      <EventList ref="eventListRef" @edit="onEditEvent" />
    </view>

    <!-- Floating gradient add button -->
    <view class="add-btn pulse-glow" @click="showEventForm = true">
      <text class="fa-solid">&#xf067;</text>
    </view>

    <!-- Event form popup -->
    <EventForm
      :visible="showEventForm"
      @close="showEventForm = false"
      @save="onEventSaved"
    />

    <!-- Edit event form popup -->
    <EventForm
      :visible="showEditForm"
      :isEditMode="true"
      :editData="editingEvent"
      @close="showEditForm = false"
      @save="onEventSaved"
    />

    <!-- Custom TabBar -->
    <CustomTabBar />

    <!-- Type Manager Popup -->
    <view v-if="showTypeManager" class="type-manager-overlay">
      <TypeManager @close="showTypeManager = false" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import { useAnniversaryStore } from '@/store/anniversary'
import { getUpcomingAnniversaries } from '@/utils/anniversary'
import { useNavBarHeight } from '@/utils/useNavBarHeight'
import FilterBar from '@/components/FilterBar.vue'
import EventList from '@/components/EventList.vue'
import EventForm from '@/components/EventForm.vue'
import CustomTabBar from '@/components/CustomTabBar.vue'
import TypeManager from '@/components/TypeManager.vue'
import AnniversaryReminder from '@/components/AnniversaryReminder.vue'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()
const anniversaryStore = useAnniversaryStore()

// 统计展开状态
const showStatsDetail = ref(false)

function toggleStats() {
  showStatsDetail.value = !showStatsDetail.value
}

// 统计数据
const totalCount = computed(() => eventStore.totalCount)
const monthCount = computed(() => eventStore.monthCount)
const recentStats = computed(() => eventStore.recentDaysStats)

// 类型统计
const typeStats = computed(() => {
  const stats = eventStore.statsByType
  const total = eventStore.totalCount

  return Object.entries(stats)
    .map(([typeId, count]) => {
      const type = eventTypeStore.types.find(t => t.id === typeId)
      return {
        typeId,
        name: type?.name || '未分类',
        color: type?.color || '#999999',
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0
      }
    })
    .sort((a, b) => b.count - a.count)
})

// 柱状图高度计算
const maxCount = computed(() => Math.max(...recentStats.value.map(d => d.count), 1))

function getBarHeight(count: number): number {
  if (maxCount.value === 0) return 0
  return Math.round((count / maxCount.value) * 32)
}

// 即将到来的纪念日列表
const upcomingAnniversaries = computed(() => {
  return getUpcomingAnniversaries(anniversaryStore.anniversaries, 3)
})

const showReminder = ref(true)

// 导航栏高度
const { navBarHeight } = useNavBarHeight()

const eventListRef = ref<InstanceType<typeof EventList> | null>(null)

const showEventForm = ref(false)
const showEditForm = ref(false)
const showTypeManager = ref(false)
const editingEvent = ref<{ id: string; name: string; typeId: string; time: number } | null>(null)

function onEventSaved() {
  showEventForm.value = false
  showEditForm.value = false
  editingEvent.value = null
  // 新增事件后滚动到顶部
  eventListRef.value?.resetScroll()
}

function onEditEvent(event: { id: string; name: string; typeId: string; time: number }) {
  editingEvent.value = event
  showEditForm.value = true
}

function onReminderClose() {
  showReminder.value = false
}

function onReminderNavigate(_id: string) {
  showReminder.value = false
  uni.switchTab({
    url: '/pages/anniversary/anniversary'
  })
}
</script>

<style lang="scss" scoped>
.page-index {
  min-height: 100vh;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom) + $spacing-lg);

  .header {
    margin: $spacing-lg $spacing-md;
    /* #ifdef MP */
    margin-top: calc(var(--nav-bar-height) + $spacing-lg);
    /* #endif */
    /* #ifdef H5 */
    margin-top: $spacing-lg;
    /* #endif */
    padding: $spacing-xl $spacing-lg;
    position: relative;
    overflow: hidden;

    .type-manage-btn {
      position: absolute;
      right: $spacing-md;
      top: $spacing-lg;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6rpx;
      padding: $spacing-sm $spacing-md;
      z-index: 10;

      .btn-icon-bg {
        width: 72rpx;
        height: 72rpx;
        border-radius: $radius-lg;
        background: $gradient-primary;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8rpx 24rpx rgba(99, 102, 241, 0.35);

        .fa-solid {
          font-size: 32rpx;
          color: #ffffff;
        }
      }

      .btn-text {
        font-size: 22rpx;
        color: $text-primary;
        font-weight: 500;
        text-shadow: 0 1rpx 2rpx rgba(255, 255, 255, 0.8);
      }

      &:active {
        .btn-icon-bg {
          transform: scale(0.92);
        }
      }
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: $spacing-md;

      .header-icon-wrap {
        width: 80rpx;
        height: 80rpx;
        border-radius: $radius-lg;
        background: $gradient-warm;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8rpx 24rpx rgba(249, 115, 22, 0.3);

        .fa-solid {
          font-size: 36rpx;
          color: #ffffff;
        }
      }

      .header-text {
        flex: 1;

        .header-title {
          font-size: 44rpx;
          font-weight: 700;
          letter-spacing: 2rpx;
          display: block;
        }

        .header-subtitle {
          font-size: 24rpx;
          color: $text-secondary;
          margin-top: $spacing-xs;
        }
      }
    }

    .header-decoration {
      position: absolute;
      right: -40rpx;
      top: -40rpx;

      .deco-circle {
        position: absolute;
        border-radius: 50%;
        opacity: 0.4;

        &.c1 {
          width: 120rpx;
          height: 120rpx;
          background: $gradient-sunset;
          right: 40rpx;
          top: 40rpx;
        }

        &.c2 {
          width: 80rpx;
          height: 80rpx;
          background: $gradient-cool;
          right: 100rpx;
          top: 80rpx;
        }

        &.c3 {
          width: 60rpx;
          height: 60rpx;
          background: $gradient-aurora;
          right: 60rpx;
          top: 120rpx;
        }
      }
    }
  }

  // 统计卡片
  .stats-section {
    padding: $spacing-sm $spacing-md;

    .stats-card {
      padding: $spacing-md;
      transition: all $transition-normal;

      .stats-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .stats-summary {
          display: flex;
          align-items: center;
          gap: $spacing-sm;

          .stat-item-mini {
            display: flex;
            flex-direction: column;
            align-items: center;

            .stat-value-mini {
              font-size: 32rpx;
              font-weight: 700;
              color: $accent-indigo;
            }

            .stat-label-mini {
              font-size: 22rpx;
              color: $text-muted;
            }
          }

          .stat-divider {
            width: 1px;
            height: 40rpx;
            background: $border-color;
          }
        }

        .stats-toggle {
          width: 40rpx;
          height: 40rpx;
          border-radius: $radius-full;
          background: rgba(99, 102, 241, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;

          .fa-solid {
            font-size: 16rpx;
            color: $text-secondary;
          }
        }
      }

      .stats-detail {
        margin-top: $spacing-md;
        padding-top: $spacing-md;
        border-top: 1px solid $border-color;

        .stats-subtitle {
          font-size: 26rpx;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: $spacing-sm;
          display: block;
        }

        .type-stats-section {
          margin-bottom: $spacing-md;

          .empty-stats {
            padding: $spacing-sm;
            text-align: center;

            .empty-text {
              font-size: 24rpx;
              color: $text-muted;
            }
          }

          .type-stats-mini {
            .type-stat-row {
              display: flex;
              align-items: center;
              gap: $spacing-sm;
              margin-bottom: $spacing-xs;

              .type-badge {
                width: 24rpx;
                height: 24rpx;
                border-radius: $radius-sm;
              }

              .type-name-mini {
                font-size: 24rpx;
                color: $text-secondary;
                min-width: 80rpx;
              }

              .stat-bar-mini {
                flex: 1;
                height: 12rpx;
                background: rgba(99, 102, 241, 0.1);
                border-radius: $radius-full;
                overflow: hidden;

                .stat-bar-fill {
                  height: 100%;
                  border-radius: $radius-full;
                  transition: width $transition-slow;
                }
              }

              .type-count-mini {
                font-size: 24rpx;
                font-weight: 600;
                color: $accent-indigo;
                min-width: 40rpx;
                text-align: right;
              }
            }
          }
        }

        .trend-section {
          .trend-mini-chart {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            height: 60px;
            padding-top: $spacing-sm;

            .trend-bar-item {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;

              .trend-bar {
                width: 24rpx;
                min-height: 4px;
                background: $gradient-cool;
                border-radius: $radius-xs $radius-xs 0 0;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                position: relative;

                .bar-count {
                  font-size: 18rpx;
                  font-weight: 600;
                  color: $text-primary;
                  position: absolute;
                  top: -20rpx;
                }
              }

              .trend-label {
                font-size: 20rpx;
                color: $text-muted;
                margin-top: 6rpx;
              }
            }
          }
        }
      }
    }
  }

  .filter-section {
    padding: $spacing-sm $spacing-md;
  }

  .list-section {
    padding: $spacing-md;
  }

  .add-btn {
    position: fixed;
    right: $spacing-xl;
    bottom: calc(120rpx + env(safe-area-inset-bottom) + $spacing-xl);
    width: 120rpx;
    height: 120rpx;
    border-radius: $radius-full;
    background: $gradient-primary;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: $shadow-glow;
    transition: all $transition-normal;
    z-index: 1000;

    .fa-solid {
      font-size: 44rpx;
      color: #ffffff;
    }

    &:active {
      transform: scale(0.92);
      box-shadow: 0 0 30rpx rgba(255, 107, 107, 0.4);
    }
  }

  .type-manager-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.5);
  }
}
</style>