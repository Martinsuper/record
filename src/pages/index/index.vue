<template>
  <view class="page-index">
    <!-- Glassmorphism Header -->
    <view class="header glass-card">
      <view class="header-content">
        <view class="header-icon-wrap">
          <text class="fa-solid fa-sparkles"></text>
        </view>
        <view class="header-text">
          <text class="header-title gradient-text">记录时光</text>
          <text class="header-subtitle">捕捉每一个精彩瞬间</text>
        </view>
      </view>
      <view class="header-decoration">
        <view class="deco-circle c1"></view>
        <view class="deco-circle c2"></view>
        <view class="deco-circle c3"></view>
      </view>
    </view>

    <!-- Filter bar -->
    <view class="filter-section">
      <FilterBar />
    </view>

    <!-- Event list -->
    <view class="list-section">
      <EventList @edit="onEditEvent" />
    </view>

    <!-- Floating gradient add button -->
    <view class="add-btn pulse-glow" @click="showEventForm = true">
      <text class="fa-solid fa-plus"></text>
    </view>

    <!-- Event form popup -->
    <EventForm
      :visible="showEventForm"
      @close="showEventForm = false"
      @save="onEventSaved"
    />

    <!-- Edit event form popup -->
    <EventForm
      :visible="showEditForm"
      :isEditMode="true"
      :editData="editingEvent"
      @close="showEditForm = false"
      @save="onEventSaved"
    />

    <!-- Custom TabBar -->
    <CustomTabBar />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import FilterBar from '@/components/FilterBar.vue'
import EventList from '@/components/EventList.vue'
import EventForm from '@/components/EventForm.vue'
import CustomTabBar from '@/components/CustomTabBar.vue'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()

const showEventForm = ref(false)
const showEditForm = ref(false)
const editingEvent = ref<{ id: string; name: string; typeId: string; time: number } | null>(null)

function onEventSaved() {
  showEventForm.value = false
  showEditForm.value = false
  editingEvent.value = null
}

function onEditEvent(event: { id: string; name: string; typeId: string; time: number }) {
  editingEvent.value = event
  showEditForm.value = true
}
</script>

<style lang="scss" scoped>
.page-index {
  min-height: 100vh;
  padding-bottom: calc(100rpx + env(safe-area-inset-bottom) + $spacing-lg);

  .header {
    margin: $spacing-lg $spacing-md;
    padding: $spacing-xl $spacing-lg;
    position: relative;
    overflow: hidden;

    .header-content {
      display: flex;
      align-items: center;
      gap: $spacing-md;

      .header-icon-wrap {
        width: 80rpx;
        height: 80rpx;
        border-radius: $radius-lg;
        background: $gradient-warm;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8rpx 24rpx rgba(249, 115, 22, 0.3);

        .fa-solid {
          font-size: 36rpx;
          color: #ffffff;
        }
      }

      .header-text {
        flex: 1;

        .header-title {
          font-size: 44rpx;
          font-weight: 700;
          letter-spacing: 2rpx;
          display: block;
        }

        .header-subtitle {
          font-size: 24rpx;
          color: $text-secondary;
          margin-top: $spacing-xs;
        }
      }
    }

    .header-decoration {
      position: absolute;
      right: -40rpx;
      top: -40rpx;

      .deco-circle {
        position: absolute;
        border-radius: 50%;
        opacity: 0.4;

        &.c1 {
          width: 120rpx;
          height: 120rpx;
          background: $gradient-sunset;
          right: 40rpx;
          top: 40rpx;
        }

        &.c2 {
          width: 80rpx;
          height: 80rpx;
          background: $gradient-cool;
          right: 100rpx;
          top: 80rpx;
        }

        &.c3 {
          width: 60rpx;
          height: 60rpx;
          background: $gradient-aurora;
          right: 60rpx;
          top: 120rpx;
        }
      }
    }
  }

  .filter-section {
    padding: $spacing-sm $spacing-md;
  }

  .list-section {
    padding: $spacing-md;
  }

  .add-btn {
    position: fixed;
    right: $spacing-xl;
    bottom: calc(100rpx + env(safe-area-inset-bottom) + $spacing-xl);
    width: 120rpx;
    height: 120rpx;
    border-radius: $radius-full;
    background: $gradient-primary;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: $shadow-glow;
    transition: all $transition-normal;
    z-index: 1000;

    .fa-solid {
      font-size: 44rpx;
      color: #ffffff;
    }

    &:active {
      transform: scale(0.92);
      box-shadow: 0 0 30rpx rgba(255, 107, 107, 0.4);
    }
  }
}
</style>