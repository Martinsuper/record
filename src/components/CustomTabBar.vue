<template>
  <view class="custom-tabbar">
    <view
      v-for="(item, index) in menuConfigStore.enabledTabItems"
      :key="item.id"
      class="tab-item"
      :class="{ active: currentPath === item.path }"
      @click="switchTab(item)"
    >
      <view class="tab-icon-wrap">
        <text class="fa-solid">{{ item.icon }}</text>
      </view>
      <text class="tab-text">{{ item.name }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useMenuConfigStore } from '@/store/menuConfig'
import type { MenuItemConfig } from '@/utils/storage'

const menuConfigStore = useMenuConfigStore()
const currentPath = ref('')

// 加载菜单配置
onMounted(() => {
  menuConfigStore.loadFromStorage()
})

function getCurrentPath(): string {
  const pageStack = getCurrentPages()
  if (pageStack.length === 0) return ''
  const currentPage = pageStack[pageStack.length - 1]
  const route = currentPage.route || ''
  return '/' + route
}

// 初始化时获取当前页面路径
currentPath.value = getCurrentPath()

// 每次页面显示时更新高亮状态
onShow(() => {
  currentPath.value = getCurrentPath()
})

function switchTab(item: MenuItemConfig) {
  currentPath.value = item.path
  uni.switchTab({
    url: item.path
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