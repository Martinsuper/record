<template>
  <view class="page-stats">
    <!-- Header -->
    <view class="header">
      <view class="header-content">
        <u-icon name="chart-pie-fill" size="40" color="#ffffff" />
        <text class="header-title">统计概览</text>
      </view>
    </view>

    <!-- Overview cards -->
    <view class="overview-section">
      <view class="stat-card">
        <view class="stat-icon total">
          <u-icon name="file-text" size="28" color="#ffffff" />
        </view>
        <view class="stat-content">
          <text class="stat-value">{{ totalCount }}</text>
          <text class="stat-label">总事件数</text>
        </view>
      </view>

      <view class="stat-card">
        <view class="stat-icon month">
          <u-icon name="calendar-fill" size="28" color="#ffffff" />
        </view>
        <view class="stat-content">
          <text class="stat-value">{{ monthCount }}</text>
          <text class="stat-label">本月新增</text>
        </view>
      </view>
    </view>

    <!-- Type distribution -->
    <view class="section-card">
      <view class="section-header">
        <u-icon name="tags" size="20" color="#0D9488" />
        <text class="section-title">按类型分布</text>
      </view>

      <view v-if="typeStats.length === 0" class="empty-tip">
        <u-icon name="info-circle" size="24" color="#99F6E4" />
        <text class="empty-text">暂无数据</text>
      </view>

      <view v-else class="type-stats">
        <view v-for="stat in typeStats" :key="stat.typeId" class="type-stat-item">
          <view class="type-header">
            <view class="type-badge" :style="{ backgroundColor: stat.color }">
              <u-icon name="star-fill" size="12" color="#ffffff" />
            </view>
            <text class="type-name">{{ stat.name }}</text>
            <text class="type-count">{{ stat.count }}</text>
          </view>
          <view class="stat-bar-track">
            <view class="stat-bar" :style="{ width: stat.percent + '%', backgroundColor: stat.color }" />
          </view>
          <text class="stat-percent">{{ stat.percent }}%</text>
        </view>
      </view>
    </view>

    <!-- Recent 7 days trend -->
    <view class="section-card">
      <view class="section-header">
        <u-icon name="trending-up" size="20" color="#0D9488" />
        <text class="section-title">近7天趋势</text>
      </view>

      <view v-if="recentStats.length === 0" class="empty-tip">
        <u-icon name="info-circle" size="24" color="#99F6E4" />
        <text class="empty-text">暂无数据</text>
      </view>

      <view v-else class="trend-chart">
        <view class="chart-y-axis">
          <text class="y-label">{{ maxCount }}</text>
          <text class="y-label">0</text>
        </view>
        <view class="chart-bars">
          <view v-for="(day, index) in recentStats" :key="index" class="chart-bar-item">
            <text class="bar-value">{{ day.count }}</text>
            <view class="bar-container">
              <view
                class="bar-visual"
                :style="{ height: getBarHeight(day.count) + 'rpx' }"
              />
            </view>
            <text class="bar-label">{{ day.label }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()

onMounted(() => {
  eventStore.loadFromStorage()
  eventTypeStore.loadFromStorage()
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
  return Math.round((count / maxCount.value) * 120)
}
</script>

<style lang="scss" scoped>
.page-stats {
  min-height: 100vh;
  background: linear-gradient(180deg, #E6FFFA 0%, #F0FDFA 100%);

  .header {
    background: linear-gradient(135deg, #0D9488 0%, #14B8A6 100%);
    padding: 60rpx 32rpx 40rpx;
    border-radius: 0 0 48rpx 48rpx;
    box-shadow: 0 8rpx 32rpx rgba(13, 148, 136, 0.2);

    .header-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16rpx;

      .header-title {
        font-size: 40rpx;
        font-weight: 700;
        color: #ffffff;
      }
    }
  }

  .overview-section {
    display: flex;
    gap: 20rpx;
    padding: 24rpx;

    .stat-card {
      flex: 1;
      background: #ffffff;
      border-radius: 20rpx;
      padding: 24rpx;
      display: flex;
      align-items: center;
      gap: 16rpx;
      box-shadow: 0 4rpx 16rpx rgba(13, 148, 136, 0.08);

      .stat-icon {
        width: 80rpx;
        height: 80rpx;
        border-radius: 16rpx;
        display: flex;
        align-items: center;
        justify-content: center;

        &.total {
          background: linear-gradient(135deg, #0D9488 0%, #14B8A6 100%);
        }

        &.month {
          background: linear-gradient(135deg, #F97316 0%, #FB923C 100%);
        }
      }

      .stat-content {
        flex: 1;

        .stat-value {
          font-size: 44rpx;
          font-weight: 700;
          color: #134E4A;
          display: block;
        }

        .stat-label {
          font-size: 24rpx;
          color: #5EEAD4;
        }
      }
    }
  }

  .section-card {
    background: #ffffff;
    border-radius: 20rpx;
    margin: 0 24rpx 20rpx;
    padding: 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(13, 148, 136, 0.08);

    .section-header {
      display: flex;
      align-items: center;
      gap: 12rpx;
      margin-bottom: 24rpx;

      .section-title {
        font-size: 32rpx;
        font-weight: 600;
        color: #134E4A;
      }
    }

    .empty-tip {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12rpx;
      padding: 40rpx;

      .empty-text {
        font-size: 26rpx;
        color: #5EEAD4;
      }
    }

    .type-stats {
      .type-stat-item {
        margin-bottom: 24rpx;

        &:last-child {
          margin-bottom: 0;
        }

        .type-header {
          display: flex;
          align-items: center;
          margin-bottom: 12rpx;

          .type-badge {
            width: 36rpx;
            height: 36rpx;
            border-radius: 10rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12rpx;
          }

          .type-name {
            flex: 1;
            font-size: 28rpx;
            font-weight: 500;
            color: #134E4A;
          }

          .type-count {
            font-size: 28rpx;
            font-weight: 600;
            color: #0D9488;
          }
        }

        .stat-bar-track {
          height: 12rpx;
          background: #E6FFFA;
          border-radius: 6rpx;
          overflow: hidden;

          .stat-bar {
            height: 100%;
            border-radius: 6rpx;
            transition: width 0.3s ease;
          }
        }

        .stat-percent {
          display: block;
          text-align: right;
          font-size: 22rpx;
          color: #5EEAD4;
          margin-top: 8rpx;
        }
      }
    }

    .trend-chart {
      display: flex;
      gap: 16rpx;
      padding-top: 16rpx;

      .chart-y-axis {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 24rpx 0;

        .y-label {
          font-size: 20rpx;
          color: #99F6E4;
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
            font-size: 22rpx;
            font-weight: 600;
            color: #134E4A;
            margin-bottom: 8rpx;
          }

          .bar-container {
            width: 48rpx;
            height: 140rpx;
            display: flex;
            align-items: flex-end;

            .bar-visual {
              width: 100%;
              min-height: 8rpx;
              background: linear-gradient(180deg, #14B8A6 0%, #0D9488 100%);
              border-radius: 8rpx 8rpx 0 0;
            }
          }

          .bar-label {
            font-size: 20rpx;
            color: #5EEAD4;
            margin-top: 12rpx;
            text-align: center;
          }
        }
      }
    }
  }
}
</style>