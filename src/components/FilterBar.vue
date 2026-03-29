<template>
  <view class="filter-bar">
    <u-dropdown :borderBottom="false" :customStyle="dropdownStyle">
      <!-- Type filter dropdown -->
      <u-dropdown-item
        v-model="selectedType"
        :title="typeTitle"
        :options="typeOptions"
        @change="handleTypeChange"
      ></u-dropdown-item>

      <!-- Time range dropdown -->
      <u-dropdown-item
        v-model="selectedTimeRange"
        :title="timeRangeTitle"
        :options="timeRangeOptions"
        @change="handleTimeRangeChange"
      ></u-dropdown-item>
    </u-dropdown>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useEventTypeStore } from '@/store/eventType'
import { useEventStore, type TimeRangeFilter } from '@/store/event'

const eventTypeStore = useEventTypeStore()
const eventStore = useEventStore()

// Time range options
const timeRangeOptions = [
  { value: 'all', label: '全部' },
  { value: 'today', label: '今天' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' }
]

// Time range display mapping
const timeRangeMap: Record<TimeRangeFilter, string> = {
  all: '全部',
  today: '今天',
  week: '本周',
  month: '本月'
}

// Initialize selected values from store
const selectedType = ref(eventStore.filterType || '')
const selectedTimeRange = ref<TimeRangeFilter>(eventStore.filterTimeRange)

// Build type options including "全部类型"
const typeOptions = computed(() => {
  const options = eventTypeStore.typeOptions.map((type) => ({
    value: type.value,
    label: type.label
  }))
  // Add "全部类型" option at the beginning
  return [{ value: '', label: '全部类型' }, ...options]
})

// Display title for type filter
const typeTitle = computed(() => {
  if (!selectedType.value) {
    return '全部类型'
  }
  const type = eventTypeStore.getTypeById(selectedType.value)
  return type?.name || '全部类型'
})

// Display title for time range filter
const timeRangeTitle = computed(() => {
  return timeRangeMap[selectedTimeRange.value] || '全部'
})

// Handle type filter change
const handleTypeChange = (value: string) => {
  const typeId = value === '' ? null : value
  eventStore.setFilterType(typeId)
}

// Handle time range filter change
const handleTimeRangeChange = (value: TimeRangeFilter) => {
  eventStore.setFilterTimeRange(value)
}

// Sync with store changes (e.g., from external clear filters)
watch(
  () => eventStore.filterType,
  (newType) => {
    selectedType.value = newType || ''
  }
)

watch(
  () => eventStore.filterTimeRange,
  (newRange) => {
    selectedTimeRange.value = newRange
  }
)

// Dropdown custom styles
const dropdownStyle = {
  backgroundColor: '#ffffff'
}
</script>

<style lang="scss" scoped>
.filter-bar {
  background-color: #ffffff;
  padding: 0 16rpx;

  :deep(.u-dropdown__menu) {
    background-color: #ffffff;
  }

  :deep(.u-dropdown__menu__item__title) {
    color: #333333;
    font-size: 28rpx;
  }

  :deep(.u-dropdown__menu__arrow) {
    color: #999999;
  }
}
</style>