<template>
  <view class="custom-tabbar">
    <view
      class="tab-item"
      :class="{ active: currentIndex === 0 }"
      @click="switchTab(0)"
    >
      <text class="fa-solid fa-list-check"></text>
      <text class="tab-text">事件</text>
    </view>
    <view
      class="tab-item"
      :class="{ active: currentIndex === 1 }"
      @click="switchTab(1)"
    >
      <text class="fa-solid fa-chart-pie"></text>
      <text class="tab-text">统计</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  current?: number
}>()

const currentIndex = ref(props.current || 0)

const pages = [
  '/pages/index/index',
  '/pages/stats/stats'
]

function switchTab(index: number) {
  if (currentIndex.value === index) return
  currentIndex.value = index
  uni.switchTab({
    url: pages[index]
  })
}

watch(() => props.current, (val) => {
  if (val !== undefined) {
    currentIndex.value = val
  }
})
</script>

<style lang="scss" scoped>
.custom-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100rpx;
  padding-bottom: env(safe-area-inset-bottom);
  background: $glass-bg;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid $glass-border;
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 999;

  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    padding: 16rpx 0;
    transition: all $transition-fast;

    .fa-solid {
      font-size: 40rpx;
      color: $text-muted;
      transition: color $transition-fast;
    }

    .tab-text {
      font-size: 24rpx;
      color: $text-muted;
      transition: color $transition-fast;
    }

    &.active {
      .fa-solid {
        color: $accent-indigo;
      }

      .tab-text {
        color: $accent-indigo;
        font-weight: 600;
      }
    }

    &:active {
      opacity: 0.7;
    }
  }
}
</style>