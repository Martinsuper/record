<template>
  <view class="anniversary-card glass-card" @click="handleClick">
    <view class="card-content">
      <view class="card-header">
        <text class="card-name">{{ name }}</text>
        <text v-if="categoryIcon" class="fa-solid category-icon">{{ categoryIcon }}</text>
      </view>
      <view class="card-time">
        <text class="time-text" :class="{ 'countdown': isCountdown, 'elapsed': !isCountdown }">
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
import { useAnniversaryCategoryStore } from '@/store/anniversaryCategory'

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
  },
  mode: {
    type: String as () => 'countdown' | 'elapsed',
    default: 'countdown'
  },
  categoryId: {
    type: String,
    default: ''
  }
})

const categoryStore = useAnniversaryCategoryStore()

// 计算分类图标
const categoryIcon = computed(() => {
  if (!props.categoryId) return null
  const category = categoryStore.getCategoryById(props.categoryId)
  return category?.icon || null
})

const emit = defineEmits(['click'])

// 计算纪念日
const calcResult = computed(() => {
  return calculateAnniversary(props.date, props.mode, props.repeatType)
})

// 是否为倒计时模式
const isCountdown = computed(() => calcResult.value.mode === 'countdown')

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
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: $spacing-sm;

      .card-name {
        font-size: 32rpx;
        font-weight: 600;
        color: $text-primary;
      }

      .category-icon {
        font-size: 24rpx;
        color: $text-muted;
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
