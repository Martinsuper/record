<template>
  <view class="custom-tabbar">
    <view
      class="tab-item"
      :class="{ active: currentIndex === 0 }"
      @click="switchTab(0)"
    >
      <text class="fa-solid">&#xf0ae;</text>
      <text class="tab-text">事件</text>
    </view>
    <view
      class="tab-item"
      :class="{ active: currentIndex === 1 }"
      @click="switchTab(1)"
    >
      <text class="fa-solid">&#xf200;</text>
      <text class="tab-text">统计</text>
    </view>
    <view
      class="tab-item"
      :class="{ active: currentIndex === 2 }"
      @click="switchTab(2)"
    >
      <text class="fa-solid">&#xf004;</text>
      <text class="tab-text">纪念日</text>
    </view>
    <view
      class="tab-item"
      :class="{ active: currentIndex === 3 }"
      @click="switchTab(3)"
    >
      <text class="fa-solid">&#xf013;</text>
      <text class="tab-text">设置</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const currentIndex = ref(0)

const pages = [
  '/pages/index/index',
  '/pages/stats/stats',
  '/pages/anniversary/anniversary',
  '/pages/settings/settings'
]

function getCurrentPageIndex(): number {
  const pageStack = getCurrentPages()
  if (pageStack.length === 0) return 0
  const currentPage = pageStack[pageStack.length - 1]
  const route = currentPage.route || ''

  if (route === 'pages/stats/stats') return 1
  if (route === 'pages/anniversary/anniversary') return 2
  if (route === 'pages/settings/settings') return 3
  return 0
}

// 初始化时获取当前页面索引
currentIndex.value = getCurrentPageIndex()

// 每次页面显示时更新高亮状态
onShow(() => {
  currentIndex.value = getCurrentPageIndex()
})

function switchTab(index: number) {
  currentIndex.value = index
  uni.switchTab({
    url: pages[index]
  })
}
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