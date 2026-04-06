<template>
  <view class="page-stats" :style="{ '--nav-bar-height': navBarHeight + 'px' }">
    <!-- Gradient header -->
    <view class="header" role="banner">
      <view class="header-bg"></view>
      <view class="header-content glass-card">
        <text class="fa-solid" aria-hidden="true">&#xf200;</text>
        <text class="header-title">统计概览</text>
      </view>
    </view>

    <!-- Overview cards with gradients -->
    <view class="overview-section" role="region" aria-label="概览数据">
      <view class="stat-card gradient-warm fade-in-up" style="animation-delay: 0.1s">
        <view class="stat-icon" aria-hidden="true">
          <text class="fa-solid">&#xf5fd;</text>
        </view>
        <view class="stat-content">
          <text class="stat-value">{{ totalCount }}</text>
          <text class="stat-label">总事件数</text>
        </view>
        <view class="stat-glow"></view>
      </view>

      <view class="stat-card gradient-cool fade-in-up" style="animation-delay: 0.2s">
        <view class="stat-icon" aria-hidden="true">
          <text class="fa-solid">&#xf274;</text>
        </view>
        <view class="stat-content">
          <text class="stat-value">{{ monthCount }}</text>
          <text class="stat-label">本月新增</text>
        </view>
        <view class="stat-glow"></view>
      </view>
    </view>

    <!-- Type distribution -->
    <view class="section-card glass-card fade-in-up" style="animation-delay: 0.3s" role="region" aria-label="类型分布">
      <view class="section-header">
        <text class="fa-solid" aria-hidden="true">&#xf02c;</text>
        <text class="section-title">类型分布</text>
      </view>

      <view v-if="typeStats.length === 0" class="empty-state" role="status">
        <text class="fa-solid" aria-hidden="true">&#xf01c;</text>
        <text class="empty-text">暂无数据</text>
      </view>

      <view v-else class="type-stats">
        <view v-for="(stat, index) in typeStats" :key="stat.typeId" class="type-stat-item">
          <view class="type-header">
            <view class="type-badge" :style="{ backgroundColor: stat.color }" aria-hidden="true">
              <text class="fa-solid">&#xf005;</text>
            </view>
            <text class="type-name">{{ stat.name }}</text>
            <text class="type-count">{{ stat.count }}</text>
          </view>
          <view class="stat-bar-track" role="progressbar" :aria-valuenow="stat.percent" aria-valuemin="0" aria-valuemax="100">
            <view class="stat-bar" :style="{ width: stat.percent + '%', backgroundColor: stat.color }" />
          </view>
          <text class="stat-percent">{{ stat.percent }}%</text>
        </view>
      </view>
    </view>

    <!-- Recent 7 days trend -->
    <view class="section-card glass-card fade-in-up" style="animation-delay: 0.4s" role="region" aria-label="近7天趋势">
      <view class="section-header">
        <text class="fa-solid" aria-hidden="true">&#xf201;</text>
        <text class="section-title">近7天趋势</text>
      </view>

      <view v-if="recentStats.length === 0" class="empty-state" role="status">
        <text class="fa-solid" aria-hidden="true">&#xf01c;</text>
        <text class="empty-text">暂无数据</text>
      </view>

      <view v-else class="trend-chart">
        <view class="chart-y-axis" aria-hidden="true">
          <text class="y-label">{{ maxCount }}</text>
          <view class="y-grid-lines">
            <view v-for="i in 4" :key="i" class="y-grid-line" />
          </view>
          <text class="y-label">0</text>
        </view>
        <view class="chart-bars" role="img" aria-label="柱状图显示近7天事件数量">
          <view v-for="(day, index) in recentStats" :key="index" class="chart-bar-item">
            <text class="bar-value">{{ day.count }}</text>
            <view class="bar-container">
              <view
                class="bar-visual"
                :style="{ height: getBarHeight(day.count) + 'rpx', animationDelay: index * 0.08 + 's' }"
              />
            </view>
            <text class="bar-label">{{ day.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Data management entry -->
    <view class="section-card glass-card fade-in-up" style="animation-delay: 0.5s" role="button" tabindex="0" @click="goToDataManager" @keydown.enter="goToDataManager">
      <view class="section-header">
        <text class="fa-solid" aria-hidden="true">&#xf0e7;</text>
        <text class="section-title">数据管理</text>
      </view>
      <view class="section-desc">导出或导入数据</view>
      <view class="entry-arrow" aria-hidden="true">
        <text class="fa-solid">&#xf054;</text>
      </view>
    </view>

    <!-- Custom TabBar -->
    <CustomTabBar />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import CustomTabBar from '@/components/CustomTabBar.vue'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()

// 动态计算导航栏高度
const navBarHeight = computed(() => {
  const height = uni.getStorageSync('navBarHeight')
  return height || 88 // 默认值
})

const totalCount = computed(() => eventStore.totalCount)
const monthCount = computed(() => eventStore.monthCount)

// Type distribution computed from statsByType getter
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

// Recent 7 days
const recentStats = computed(() => eventStore.recentDaysStats)

// Max count for chart scale
const maxCount = computed(() => Math.max(...recentStats.value.map(d => d.count), 1))

function getBarHeight(count: number): number {
  if (maxCount.value === 0) return 0
  return Math.round((count / maxCount.value) * 140)
}

function goToDataManager() {
  uni.navigateTo({
    url: '/pages/data-manager/data-manager'
  })
}
</script>

<style lang="scss" scoped>
.page-stats {
  min-height: 100vh;
  padding-bottom: calc(100rpx + env(safe-area-inset-bottom) + $spacing-lg);

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
      background: $gradient-primary;
      opacity: 0.15;
      border-radius: 0 0 $radius-xl $radius-xl;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-md;
      padding: $spacing-lg;

      .fa-solid {
        font-size: 32rpx;
        color: $accent-purple;
      }

      .header-title {
        font-size: 36rpx;
        font-weight: 700;
        color: $text-primary;
      }
    }
  }

  .overview-section {
    display: flex;
    gap: $spacing-md;
    padding: $spacing-md;

    .stat-card {
      flex: 1;
      position: relative;
      padding: $spacing-lg;
      border-radius: $radius-lg;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;

      &.gradient-warm {
        background: $gradient-warm;
        color: #ffffff;
      }

      &.gradient-cool {
        background: $gradient-cool;
        color: #ffffff;
      }

      .stat-icon {
        width: 64rpx;
        height: 64rpx;
        border-radius: $radius-md;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;

        .fa-solid {
          font-size: 28rpx;
          color: #ffffff;
        }
      }

      .stat-content {
        .stat-value {
          font-size: 48rpx;
          font-weight: 700;
          display: block;
        }

        .stat-label {
          font-size: 24rpx;
          opacity: 0.9;
        }
      }

      .stat-glow {
        position: absolute;
        right: -20rpx;
        bottom: -20rpx;
        width: 100rpx;
        height: 100rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
      }
    }
  }

  .section-card {
    margin: $spacing-md;
    padding: $spacing-lg;
    position: relative;

    .section-header {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      margin-bottom: $spacing-lg;

      .fa-solid {
        font-size: 20rpx;
        color: $accent-indigo;
      }

      .section-title {
        font-size: 30rpx;
        font-weight: 600;
        color: $text-primary;
      }
    }

    .entry-arrow {
      position: absolute;
      right: $spacing-lg;
      top: 50%;
      transform: translateY(-50%);

      .fa-solid {
        font-size: 20rpx;
        color: $text-muted;
      }
    }

    .section-desc {
      padding-right: $spacing-xl;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: $spacing-md;
      padding: $spacing-xl;

      .fa-solid {
        font-size: 40rpx;
        color: $text-muted;
      }

      .empty-text {
        font-size: 26rpx;
        color: $text-secondary;
      }
    }

    .type-stats {
      .type-stat-item {
        margin-bottom: $spacing-lg;

        &:last-child {
          margin-bottom: 0;
        }

        .type-header {
          display: flex;
          align-items: center;
          margin-bottom: $spacing-sm;

          .type-badge {
            width: 36rpx;
            height: 36rpx;
            border-radius: $radius-sm;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: $spacing-sm;

            .fa-solid {
              font-size: 16rpx;
              color: #ffffff;
            }
          }

          .type-name {
            flex: 1;
            font-size: 28rpx;
            font-weight: 500;
            color: $text-primary;
          }

          .type-count {
            font-size: 28rpx;
            font-weight: 700;
            color: $accent-indigo;
          }
        }

        .stat-bar-track {
          height: 16rpx;
          background: rgba(99, 102, 241, 0.1);
          border-radius: $radius-full;
          overflow: hidden;

          .stat-bar {
            height: 100%;
            border-radius: $radius-full;
            transition: width $transition-slow;
          }
        }

        .stat-percent {
          display: block;
          text-align: right;
          font-size: 22rpx;
          color: $text-secondary;
          margin-top: $spacing-xs;
        }
      }
    }

    .trend-chart {
      display: flex;
      gap: $spacing-md;
      padding-top: $spacing-sm;

      .chart-y-axis {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: $spacing-lg 0;
        position: relative;

        .y-label {
          font-size: 22rpx;
          color: $text-muted;
          z-index: 1;
        }

        .y-grid-lines {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          pointer-events: none;

          .y-grid-line {
            width: 100%;
            height: 1px;
            background: rgba(99, 102, 241, 0.08);
          }
        }
      }

      .chart-bars {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;

        .chart-bar-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;

          .bar-value {
            font-size: 24rpx;
            font-weight: 600;
            color: $text-primary;
            margin-top: $spacing-xs;
          }

          .bar-container {
            width: 48rpx;
            height: 160rpx;
            display: flex;
            align-items: flex-end;
            position: relative;

            .bar-visual {
              width: 100%;
              min-height: 8rpx;
              background: $gradient-cool;
              border-radius: $radius-sm $radius-sm 0 0;
              animation: barGrow 0.6s ease-out forwards;
              transform-origin: bottom;
              transform: scaleY(0);
            }
          }

          .bar-label {
            font-size: 22rpx;
            color: $text-secondary;
            margin-top: $spacing-sm;
            text-align: center;
          }
        }
      }
    }
  }
}

@keyframes barGrow {
  from {
    transform: scaleY(0);
    opacity: 0;
  }
  to {
    transform: scaleY(1);
    opacity: 1;
  }
}
</style>