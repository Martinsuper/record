<template>
  <view v-if="visible && upcomingList.length > 0" class="reminder-card glass-card">
    <view class="reminder-header">
      <view class="header-icon">
        <text class="fa-solid">&#xf004;</text>
      </view>
      <text class="header-title">纪念日提醒</text>
      <view class="close-btn" @click="onClose">
        <text class="fa-solid">&#xf00d;</text>
      </view>
    </view>

    <view class="reminder-list">
      <view
        v-for="item in upcomingList"
        :key="item.id"
        class="reminder-item"
        @click="onItemClick(item.id)"
      >
        <text class="item-dot">•</text>
        <text class="item-name">{{ item.name }}</text>
        <text class="item-days" :class="{ urgent: item.days === 0 }">
          {{ item.displayText }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UpcomingAnniversary } from '@/utils/anniversary'

const props = defineProps<{
  visible: boolean
  upcomingList: UpcomingAnniversary[]
}>()

const emit = defineEmits<{
  close: []
  navigate: [id: string]
}>()

function onClose() {
  emit('close')
}

function onItemClick(id: string) {
  emit('navigate', id)
}
</script>

<style lang="scss" scoped>
.reminder-card {
  margin: $spacing-md;
  padding: $spacing-lg;
  border-radius: $radius-lg;

  .reminder-header {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-md;

    .header-icon {
      width: 48rpx;
      height: 48rpx;
      border-radius: $radius-md;
      background: $gradient-warm;
      display: flex;
      align-items: center;
      justify-content: center;

      .fa-solid {
        font-size: 22rpx;
        color: #ffffff;
      }
    }

    .header-title {
      flex: 1;
      margin-left: $spacing-sm;
      font-size: 28rpx;
      font-weight: 600;
      color: $text-primary;
    }

    .close-btn {
      width: 44rpx;
      height: 44rpx;
      border-radius: $radius-full;
      background: rgba(99, 102, 241, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;

      .fa-solid {
        font-size: 16rpx;
        color: $text-secondary;
      }

      &:active {
        background: rgba(99, 102, 241, 0.2);
      }
    }
  }

  .reminder-list {
    .reminder-item {
      display: flex;
      align-items: center;
      padding: $spacing-sm 0;

      &:active {
        opacity: 0.8;
      }

      .item-dot {
        font-size: 24rpx;
        color: $accent-indigo;
        margin-right: $spacing-xs;
      }

      .item-name {
        flex: 1;
        font-size: 26rpx;
        color: $text-primary;
      }

      .item-days {
        font-size: 24rpx;
        color: $accent-indigo;
        font-weight: 500;

        &.urgent {
          color: $accent-rose;
          font-weight: 700;
        }
      }
    }
  }
}
</style>