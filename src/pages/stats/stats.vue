<template>
  <view class="page-stats">
    <!-- Overview card -->
    <view class="overview-card">
      <view class="stat-item">
        <text class="stat-value">{{ totalCount }}</text>
        <text class="stat-label">总事件数</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-value">{{ monthCount }}</text>
        <text class="stat-label">本月新增</text>
      </view>
    </view>

    <!-- Type distribution -->
    <view class="section-card">
      <text class="section-title">按类型分布</text>
      <view v-for="stat in typeStats" :key="stat.typeId" class="type-stat-item">
        <view class="type-info">
          <view class="type-color-dot" :style="{ backgroundColor: stat.color }" />
          <text class="type-name">{{ stat.name }}</text>
        </view>
        <view class="stat-bar-section">
          <view class="stat-bar-bg">
            <view class="stat-bar" :style="{ width: stat.percent + '%', backgroundColor: stat.color }" />
          </view>
          <text class="stat-count">{{ stat.count }} ({{ stat.percent }}%)</text>
        </view>
      </view>
    </view>

    <!-- Recent 7 days trend -->
    <view class="section-card">
      <text class="section-title">近7天趋势</text>
      <view class="trend-chart">
        <view v-for="day in recentStats" :key="day.timestamp" class="chart-bar-item">
          <text class="bar-value">{{ day.count }}</text>
          <view class="bar-visual" :style="{ height: getBarHeight(day.count) + 'px' }" />
          <text class="bar-label">{{ day.label }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import { getRecentDays } from '@/utils/time'

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

  return Object.entries(stats).map(([typeId, count]) => {
    const type = eventTypeStore.types.find(t => t.id === typeId)
    return {
      typeId,
      name: type?.name || '未分类',
      color: type?.color || '#999999',
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0
    }
  })
})

// Recent 7 days
const recentStats = computed(() => {
  return eventStore.recentDaysStats
})

function getBarHeight(count: number): number {
  const maxCount = Math.max(...recentStats.value.map(d => d.count), 1)
  return Math.round((count / maxCount) * 60)
}
</script>

<style scoped>
.page-stats {
  padding: 16px;
}

.overview-card {
  display: flex;
  background-color: #f8f8f8;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  background-color: #e0e0e0;
  margin: 0 20px;
}

.section-card {
  background-color: #f8f8f8;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 16px;
}

.type-stat-item {
  margin-bottom: 12px;
}

.type-stat-item:last-child {
  margin-bottom: 0;
}

.type-info {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.type-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

.type-name {
  font-size: 14px;
  color: #333;
}

.stat-bar-section {
  display: flex;
  align-items: center;
}

.stat-bar-bg {
  flex: 1;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 12px;
}

.stat-bar {
  height: 100%;
  border-radius: 4px;
}

.stat-count {
  font-size: 12px;
  color: #666;
  min-width: 60px;
  text-align: right;
}

.trend-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 100px;
  padding-top: 20px;
}

.chart-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-value {
  font-size: 12px;
  color: #333;
  margin-bottom: 4px;
}

.bar-visual {
  width: 24px;
  background-color: #4a90d9;
  border-radius: 4px 4px 0 0;
}

.bar-label {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}
</style>