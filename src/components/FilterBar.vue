<template>
  <view class="filter-bar">
    <view class="filter-chips">
      <!-- Type filter -->
      <view
        class="filter-chip"
        :class="{ active: eventStore.filterType }"
      >
        <text class="fa-solid" :class="{ active: eventStore.filterType }">&#xf02c;</text>
        <text class="chip-text" @click="showTypePicker = true">{{ typeTitle }}</text>
        <text v-if="eventStore.filterType" class="fa-solid clear-icon" @click.stop="selectType(null)">&#xf00d;</text>
        <text v-else class="fa-solid" @click="showTypePicker = true">&#xf078;</text>
      </view>

      <!-- Time range filter -->
      <view
        class="filter-chip"
        :class="{ active: eventStore.filterTimeRange !== 'all' }"
      >
        <text class="fa-solid" :class="{ active: eventStore.filterTimeRange !== 'all' }">&#xf017;</text>
        <text class="chip-text" @click="showTimePicker = true">{{ timeRangeTitle }}</text>
        <text v-if="eventStore.filterTimeRange !== 'all'" class="fa-solid clear-icon" @click.stop="selectTimeRange('all')">&#xf00d;</text>
        <text v-else class="fa-solid" @click="showTimePicker = true">&#xf078;</text>
      </view>

      <!-- Clear all filters -->
      <view
        v-if="eventStore.filterType || eventStore.filterTimeRange !== 'all'"
        class="clear-btn"
        @click="clearFilters"
      >
        <text class="fa-solid">&#xf00d;</text>
        <text class="clear-text">清除全部</text>
      </view>
    </view>

    <!-- Type picker popup -->
    <u-popup :show="showTypePicker" mode="bottom" round="24" @close="showTypePicker = false">
      <view class="picker-popup glass-card">
        <view class="picker-header">
          <text class="picker-title">选择类型</text>
          <view class="close-btn" @click="showTypePicker = false">
            <text class="fa-solid">&#xf00d;</text>
          </view>
        </view>
        <scroll-view scroll-y class="picker-list">
          <view
            class="picker-item"
            :class="{ selected: !eventStore.filterType }"
            @click="selectType(null)"
          >
            <view class="type-color type-color-gradient"></view>
            <text class="picker-item-text">全部类型</text>
            <text v-if="!eventStore.filterType" class="fa-solid">&#xf00c;</text>
          </view>
          <view
            v-for="type in eventTypeStore.types"
            :key="type.id"
            class="picker-item"
            :class="{ selected: eventStore.filterType === type.id }"
            @click="selectType(type.id)"
          >
            <view class="type-color" :style="{ backgroundColor: type.color }"></view>
            <text class="picker-item-text">{{ type.name }}</text>
            <text v-if="eventStore.filterType === type.id" class="fa-solid">&#xf00c;</text>
          </view>
        </scroll-view>
      </view>
    </u-popup>

    <!-- Time range picker popup -->
    <u-popup :show="showTimePicker" mode="bottom" round="24" @close="showTimePicker = false">
      <view class="picker-popup glass-card">
        <view class="picker-header">
          <text class="picker-title">选择时间范围</text>
          <view class="close-btn" @click="showTimePicker = false">
            <text class="fa-solid">&#xf00d;</text>
          </view>
        </view>
        <view class="picker-list">
          <view
            v-for="option in timeRangeOptions"
            :key="option.value"
            class="picker-item"
            :class="{ selected: eventStore.filterTimeRange === option.value }"
            @click="selectTimeRange(option.value as TimeRangeFilter)"
          >
            <text class="fa-solid">{{ option.iconUnicode }}</text>
            <text class="picker-item-text">{{ option.label }}</text>
            <text v-if="eventStore.filterTimeRange === option.value" class="fa-solid">&#xf00c;</text>
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

// Time range options with Unicode icons
const timeRangeOptions = [
  { value: 'all', label: '全部', iconUnicode: '\uf133' },
  { value: 'today', label: '今天', iconUnicode: '\uf185' },
  { value: 'week', label: '本周', iconUnicode: '\uf784' },
  { value: 'month', label: '本月', iconUnicode: '\uf073' }
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
    gap: $spacing-md;
    flex-wrap: wrap;

    .filter-chip {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      padding: $spacing-sm $spacing-md;
      background: $glass-bg;
      backdrop-filter: blur(10px);
      border-radius: $radius-full;
      border: 1px solid $glass-border;
      transition: all $transition-normal;

      &.active {
        background: $gradient-primary;
        border-color: transparent;

        .fa-solid {
          color: #ffffff;
        }

        .chip-text {
          color: #ffffff;
        }
      }

      .fa-solid {
        font-size: 16rpx;
        color: $text-secondary;

        &.active {
          color: #ffffff;
        }
      }

      .chip-text {
        font-size: 26rpx;
        color: $text-primary;
        font-weight: 500;
      }

      .clear-icon {
        font-size: 14rpx;
        color: #ffffff;
        padding: 4rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);

        &:active {
          background: rgba(255, 255, 255, 0.5);
        }
      }
    }

    .clear-btn {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      padding: $spacing-sm $spacing-md;

      .fa-solid {
        font-size: 16rpx;
        color: $uni-color-error;
      }

      .clear-text {
        font-size: 24rpx;
        color: $uni-color-error;
        font-weight: 500;
      }
    }
  }

  .picker-popup {
    border-radius: $radius-xl $radius-xl 0 0;
    padding: $spacing-lg;
    padding-bottom: calc($spacing-lg + env(safe-area-inset-bottom));

    .picker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-lg;

      .picker-title {
        font-size: 32rpx;
        font-weight: 700;
        color: $text-primary;
      }

      .close-btn {
        width: 56rpx;
        height: 56rpx;
        border-radius: $radius-full;
        background: rgba(99, 102, 241, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;

        .fa-solid {
          font-size: 18rpx;
          color: $text-secondary;
        }
      }
    }

    .picker-list {
      max-height: 600rpx;

      .picker-item {
        display: flex;
        align-items: center;
        padding: $spacing-md;
        border-radius: $radius-md;
        transition: background $transition-fast;

        &:active {
          background: rgba(99, 102, 241, 0.05);
        }

        &.selected {
          background: rgba(99, 102, 241, 0.1);

          .picker-item-text {
            color: $accent-indigo;
            font-weight: 600;
          }
        }

        .type-color {
          width: 36rpx;
          height: 36rpx;
          border-radius: $radius-sm;
          margin-right: $spacing-md;

          &.type-color-gradient {
            background: $gradient-primary;
          }
        }

        .fa-solid {
          font-size: 18rpx;
          color: $text-secondary;
          margin-right: $spacing-md;
        }

        .picker-item-text {
          flex: 1;
          font-size: 30rpx;
          color: $text-primary;
        }

        .fa-check {
          font-size: 18rpx;
          color: $accent-indigo;
        }
      }
    }
  }
}
</style>