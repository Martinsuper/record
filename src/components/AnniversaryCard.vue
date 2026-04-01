<template>
  <view class="anniversary-card glass-card" @click="handleClick">
    <view class="card-content">
      <view class="card-header">
        <text class="card-name">{{ name }}</text>
      </view>
      <view class="card-time">
        <text class="time-text" :class="{ 'countdown': isFuture, 'elapsed': !isFuture }">
          {{ displayText }}
        </text>
      </view>
      <view class="card-date">
        <text class="fa-solid">&#xf133;</text>
        <text class="date-text">{{ formattedDate }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { calculateAnniversary, formatAnniversaryDate } from '@/utils/anniversary'

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  date: {
    type: Number,
    required: true
  },
  repeatType: {
    type: String as () => 'none' | 'year' | 'month' | 'week' | 'day',
    default: 'year'
  }
})

const emit = defineEmits(['click'])

// 计算纪念日
const calcResult = computed(() => {
  return calculateAnniversary(props.date, props.repeatType)
})

// 是否未发生
const isFuture = computed(() => calcResult.value.isFuture)

// 显示文本
const displayText = computed(() => calcResult.value.displayText)

// 格式化日期
const formattedDate = computed(() => formatAnniversaryDate(props.date))

function handleClick() {
  emit('click', props.id)
}
</script>

<style lang="scss" scoped>
.anniversary-card {
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
      margin-bottom: $spacing-sm;

      .card-name {
        font-size: 32rpx;
        font-weight: 600;
        color: $text-primary;
      }
    }

    .card-time {
      margin-bottom: $spacing-sm;

      .time-text {
        font-size: 40rpx;
        font-weight: 700;

        &.countdown {
          color: $accent-indigo;
        }

        &.elapsed {
          color: $accent-purple;
        }
      }
    }

    .card-date {
      display: flex;
      align-items: center;
      gap: $spacing-xs;

      .fa-solid {
        font-size: 20rpx;
        color: $text-muted;
      }

      .date-text {
        font-size: 24rpx;
        color: $text-secondary;
      }
    }
  }
}
</style>
