<template>
  <view class="page-index">
    <!-- Header -->
    <view class="header">
      <view class="header-content">
        <text class="header-title">事件记录</text>
        <text class="header-subtitle">记录生活点滴</text>
      </view>
    </view>

    <!-- Filter bar -->
    <view class="filter-section">
      <FilterBar />
    </view>

    <!-- Event list -->
    <view class="list-section">
      <EventList />
    </view>

    <!-- Floating add button -->
    <view class="add-btn" @click="showEventForm = true">
      <u-icon name="plus" color="#ffffff" size="28" />
    </view>

    <!-- Event form popup -->
    <EventForm
      :visible="showEventForm"
      @close="showEventForm = false"
      @save="onEventSaved"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import FilterBar from '@/components/FilterBar.vue'
import EventList from '@/components/EventList.vue'
import EventForm from '@/components/EventForm.vue'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()

const showEventForm = ref(false)

// Load data on mount
onMounted(() => {
  eventStore.loadFromStorage()
  eventTypeStore.loadFromStorage()
})

function onEventSaved() {
  showEventForm.value = false
}
</script>

<style lang="scss" scoped>
.page-index {
  min-height: 100vh;
  background: linear-gradient(180deg, #E6FFFA 0%, #F0FDFA 100%);
  padding-bottom: 120rpx;

  .header {
    background: linear-gradient(135deg, #0D9488 0%, #14B8A6 100%);
    padding: 60rpx 32rpx 40rpx;
    border-radius: 0 0 48rpx 48rpx;
    box-shadow: 0 8rpx 32rpx rgba(13, 148, 136, 0.2);

    .header-content {
      display: flex;
      flex-direction: column;
      align-items: center;

      .header-title {
        font-size: 48rpx;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: 4rpx;
      }

      .header-subtitle {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.8);
        margin-top: 8rpx;
      }
    }
  }

  .filter-section {
    padding: 24rpx 24rpx 0;
  }

  .list-section {
    padding: 16rpx 24rpx;
  }

  .add-btn {
    position: fixed;
    right: 40rpx;
    bottom: calc(var(--window-bottom) + 40rpx);
    width: 112rpx;
    height: 112rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #0D9488 0%, #14B8A6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 24rpx rgba(13, 148, 136, 0.35);
    transition: all 0.2s ease;

    &:active {
      transform: scale(0.95);
      box-shadow: 0 4rpx 12rpx rgba(13, 148, 136, 0.25);
    }
  }
}
</style>