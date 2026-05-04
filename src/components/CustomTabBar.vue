<template>
  <view class="custom-tabbar">
    <view
      class="tab-item"
      :class="{ active: currentIndex === 0 }"
      @click="switchTab(0)"
    >
      <view class="tab-icon-wrap">
        <text class="fa-solid">&#xf0ae;</text>
      </view>
      <text class="tab-text">事件</text>
    </view>
    <view
      class="tab-item"
      :class="{ active: currentIndex === 1 }"
      @click="switchTab(1)"
    >
      <view class="tab-icon-wrap">
        <text class="fa-solid">&#xf004;</text>
      </view>
      <text class="tab-text">纪念日</text>
    </view>
    <view
      class="tab-item"
      :class="{ active: currentIndex === 2 }"
      @click="switchTab(2)"
    >
      <view class="tab-icon-wrap">
        <text class="fa-solid">&#xf013;</text>
      </view>
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
  '/pages/anniversary/anniversary',
  '/pages/settings/settings'
]

function getCurrentPageIndex(): number {
  const pageStack = getCurrentPages()
  if (pageStack.length === 0) return 0
  const currentPage = pageStack[pageStack.length - 1]
  const route = currentPage.route || ''

  if (route === 'pages/anniversary/anniversary') return 1
  if (route === 'pages/settings/settings') return 2
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
  height: 120rpx;
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
    gap: 10rpx;
    padding: 16rpx 0;
    transition: all $transition-fast;

    .tab-icon-wrap {
      width: 64rpx;
      height: 64rpx;
      border-radius: $radius-lg;
      background: rgba(99, 102, 241, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all $transition-normal;

      .fa-solid {
        font-size: 28rpx;
        color: $text-muted;
        transition: color $transition-fast;
      }
    }

    .tab-text {
      font-size: 26rpx;
      color: $text-muted;
      transition: color $transition-fast;
      font-weight: 500;
    }

    &.active {
      .tab-icon-wrap {
        background: $gradient-primary;
        box-shadow: 0 8rpx 24rpx rgba(255, 107, 107, 0.25);

        .fa-solid {
          color: #ffffff;
        }
      }

      .tab-text {
        color: $accent-indigo;
        font-weight: 600;
      }
    }

    &:active {
      opacity: 0.8;
      transform: scale(0.96);
    }
  }
}
</style>