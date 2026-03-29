<template>
  <view class="filter-bar">
    <view class="filter-chips">
      <!-- Type filter -->
      <view
        class="filter-chip"
        :class="{ active: eventStore.filterType }"
        @click="showTypePicker = true"
      >
        <u-icon name="tags" size="16" :color="eventStore.filterType ? '#ffffff' : '#0D9488'" />
        <text class="chip-text">{{ typeTitle }}</text>
        <u-icon name="arrow-down" size="14" :color="eventStore.filterType ? '#ffffff' : '#5EEAD4'" />
      </view>

      <!-- Time range filter -->
      <view
        class="filter-chip"
        :class="{ active: eventStore.filterTimeRange !== 'all' }"
        @click="showTimePicker = true"
      >
        <u-icon name="clock" size="16" :color="eventStore.filterTimeRange !== 'all' ? '#ffffff' : '#0D9488'" />
        <text class="chip-text">{{ timeRangeTitle }}</text>
        <u-icon name="arrow-down" size="14" :color="eventStore.filterTimeRange !== 'all' ? '#ffffff' : '#5EEAD4'" />
      </view>

      <!-- Clear filters -->
      <view
        v-if="eventStore.filterType || eventStore.filterTimeRange !== 'all'"
        class="clear-btn"
        @click="clearFilters"
      >
        <u-icon name="close" size="16" color="#EF4444" />
        <text class="clear-text">清除</text>
      </view>
    </view>

    <!-- Type picker popup -->
    <u-popup :show="showTypePicker" mode="bottom" round="16" @close="showTypePicker = false">
      <view class="picker-popup">
        <view class="picker-header">
          <text class="picker-title">选择类型</text>
          <view class="close-btn" @click="showTypePicker = false">
            <u-icon name="close" size="20" color="#5EEAD4" />
          </view>
        </view>
        <scroll-view scroll-y class="picker-list">
          <view
            class="picker-item"
            :class="{ selected: !eventStore.filterType }"
            @click="selectType(null)"
          >
            <view class="type-color" style="background-color: #0D9488" />
            <text class="picker-item-text">全部类型</text>
            <u-icon v-if="!eventStore.filterType" name="checkmark" size="20" color="#0D9488" />
          </view>
          <view
            v-for="type in eventTypeStore.types"
            :key="type.id"
            class="picker-item"
            :class="{ selected: eventStore.filterType === type.id }"
            @click="selectType(type.id)"
          >
            <view class="type-color" :style="{ backgroundColor: type.color }" />
            <text class="picker-item-text">{{ type.name }}</text>
            <u-icon v-if="eventStore.filterType === type.id" name="checkmark" size="20" color="#0D9488" />
          </view>
        </scroll-view>
      </view>
    </u-popup>

    <!-- Time range picker popup -->
    <u-popup :show="showTimePicker" mode="bottom" round="16" @close="showTimePicker = false">
      <view class="picker-popup">
        <view class="picker-header">
          <text class="picker-title">选择时间范围</text>
          <view class="close-btn" @click="showTimePicker = false">
            <u-icon name="close" size="20" color="#5EEAD4" />
          </view>
        </view>
        <view class="picker-list">
          <view
            v-for="option in timeRangeOptions"
            :key="option.value"
            class="picker-item"
            :class="{ selected: eventStore.filterTimeRange === option.value }"
            @click="selectTimeRange(option.value)"
          >
            <u-icon :name="option.icon" size="20" :color="eventStore.filterTimeRange === option.value ? '#0D9488' : '#5EEAD4'" />
            <text class="picker-item-text">{{ option.label }}</text>
            <u-icon v-if="eventStore.filterTimeRange === option.value" name="checkmark" size="20" color="#0D9488" />
          </view>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEventTypeStore } from '@/store/eventType'
import { useEventStore, type TimeRangeFilter } from '@/store/event'

const eventTypeStore = useEventTypeStore()
const eventStore = useEventStore()

const showTypePicker = ref(false)
const showTimePicker = ref(false)

// Time range options with icons
const timeRangeOptions = [
  { value: 'all', label: '全部', icon: 'calendar' },
  { value: 'today', label: '今天', icon: 'sun' },
  { value: 'week', label: '本周', icon: 'calendar-fill' },
  { value: 'month', label: '本月', icon: 'list' }
]

// Time range display mapping
const timeRangeMap: Record<TimeRangeFilter, string> = {
  all: '全部',
  today: '今天',
  week: '本周',
  month: '本月'
}

// Display title for type filter
const typeTitle = computed(() => {
  if (!eventStore.filterType) return '全部类型'
  return eventTypeStore.getTypeName(eventStore.filterType)
})

// Display title for time range filter
const timeRangeTitle = computed(() => {
  return timeRangeMap[eventStore.filterTimeRange] || '全部'
})

// Select type
function selectType(typeId: string | null) {
  eventStore.setFilterType(typeId)
  showTypePicker.value = false
}

// Select time range
function selectTimeRange(range: TimeRangeFilter) {
  eventStore.setFilterTimeRange(range)
  showTimePicker.value = false
}

// Clear all filters
function clearFilters() {
  eventStore.clearFilters()
}
</script>

<style lang="scss" scoped>
.filter-bar {
  .filter-chips {
    display: flex;
    gap: 16rpx;
    padding: 0 8rpx;

    .filter-chip {
      display: flex;
      align-items: center;
      gap: 8rpx;
      padding: 16rpx 24rpx;
      background: #ffffff;
      border-radius: 40rpx;
      border: 2rpx solid #D1E7E4;
      transition: all 0.2s ease;

      &.active {
        background: linear-gradient(135deg, #0D9488 0%, #14B8A6 100%);
        border-color: transparent;

        .chip-text {
          color: #ffffff;
        }
      }

      .chip-text {
        font-size: 26rpx;
        color: #134E4A;
        font-weight: 500;
      }
    }

    .clear-btn {
      display: flex;
      align-items: center;
      gap: 6rpx;
      padding: 16rpx 20rpx;

      .clear-text {
        font-size: 24rpx;
        color: #EF4444;
        font-weight: 500;
      }
    }
  }

  .picker-popup {
    background: #ffffff;
    border-radius: 32rpx 32rpx 0 0;

    .picker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 32rpx;
      border-bottom: 2rpx solid #E6FFFA;

      .picker-title {
        font-size: 32rpx;
        font-weight: 600;
        color: #134E4A;
      }

      .close-btn {
        width: 64rpx;
        height: 64rpx;
        border-radius: 50%;
        background: #F0FDFA;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .picker-list {
      max-height: 600rpx;
      padding: 16rpx 32rpx;

      .picker-item {
        display: flex;
        align-items: center;
        padding: 24rpx 16rpx;
        border-radius: 12rpx;
        transition: background 0.2s ease;

        &:active {
          background: #F0FDFA;
        }

        &.selected {
          background: #E6FFFA;
        }

        .type-color {
          width: 32rpx;
          height: 32rpx;
          border-radius: 8rpx;
          margin-right: 20rpx;
        }

        .picker-item-text {
          flex: 1;
          font-size: 30rpx;
          color: #134E4A;
          font-weight: 500;
        }
      }
    }
  }
}
</style>