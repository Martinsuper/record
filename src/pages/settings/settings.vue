<template>
  <view class="settings-page" :style="{ '--nav-bar-height': navBarHeight + 'px' }">
    <!-- Gradient header -->
    <view class="header">
      <view class="header-bg"></view>
      <view class="header-content glass-card">
        <text class="fa-solid">&#xf013;</text>
        <view class="header-text">
          <text class="header-title">设置</text>
          <text class="header-subtitle">个性化配置</text>
        </view>
      </view>
    </view>

    <!-- Data management entry -->
    <view class="section-card glass-card" @click="goToDataManager">
      <view class="section-header">
        <view class="section-icon gradient-data">
          <text class="fa-solid">&#xf0e7;</text>
        </view>
        <view class="section-info">
          <text class="section-title">数据管理</text>
          <text class="section-desc">导出或导入数据</text>
        </view>
      </view>
      <view class="entry-arrow">
        <text class="fa-solid">&#xf054;</text>
      </view>
    </view>

    <!-- Custom TabBar -->
    <CustomTabBar />
  </view>
</template>

<script setup lang="ts">
import { useNavBarHeight } from '@/utils/useNavBarHeight'
import CustomTabBar from '@/components/CustomTabBar.vue'

// 导航栏高度
const { navBarHeight } = useNavBarHeight()

function goToDataManager() {
  uni.navigateTo({
    url: '/pages/data-manager/data-manager'
  })
}
</script>

<style scoped lang="scss">
.settings-page {
  min-height: 100vh;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom) + $spacing-lg);

  .header {
    position: relative;
    padding: $spacing-xl $spacing-md;
    /* #ifdef MP */
    padding-top: calc(var(--nav-bar-height) + $spacing-xl);
    /* #endif */
    /* #ifdef H5 */
    padding-top: $spacing-xl;
    /* #endif */

    .header-bg {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      height: calc(var(--nav-bar-height) + 200rpx);
      background: $gradient-aurora;
      opacity: 0.15;
      border-radius: 0 0 $radius-xl $radius-xl;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      padding: $spacing-lg;

      .fa-solid {
        font-size: 36rpx;
        color: $accent-cyan;
      }

      .header-text {
        flex: 1;

        .header-title {
          font-size: 40rpx;
          font-weight: 700;
          color: $text-primary;
          display: block;
        }

        .header-subtitle {
          font-size: 24rpx;
          color: $text-secondary;
          margin-top: $spacing-xs;
          display: block;
        }
      }
    }
  }

  .section-card {
    margin: $spacing-md;
    padding: $spacing-lg;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .section-header {
      display: flex;
      align-items: center;
      gap: $spacing-md;

      .section-icon {
        width: 64rpx;
        height: 64rpx;
        border-radius: $radius-lg;
        display: flex;
        align-items: center;
        justify-content: center;

        .fa-solid {
          font-size: 28rpx;
          color: #ffffff;
        }

        &.gradient-data {
          background: $gradient-warm;
          box-shadow: 0 8rpx 24rpx rgba(249, 115, 22, 0.3);
        }
      }

      .section-info {
        .section-title {
          font-size: 32rpx;
          font-weight: 600;
          color: $text-primary;
          display: block;
        }

        .section-desc {
          font-size: 24rpx;
          color: $text-secondary;
          margin-top: $spacing-xs;
        }
      }
    }

    .entry-arrow {
      .fa-solid {
        font-size: 20rpx;
        color: $text-muted;
      }
    }

    &:active {
      opacity: 0.85;
    }
  }
}
</style>