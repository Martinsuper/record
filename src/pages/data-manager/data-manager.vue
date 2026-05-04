<template>
  <view class="page-data-manager" :style="{ '--nav-bar-height': navBarHeight + 'px' }">
    <!-- Gradient header -->
    <view class="header">
      <view class="header-bg"></view>
      <view class="header-content glass-card">
        <text class="fa-solid">&#xf1c0;</text>
        <text class="header-title">数据管理</text>
      </view>
    </view>

    <!-- Stats overview -->
    <view class="overview-section">
      <view class="stat-card gradient-primary">
        <view class="stat-icon">
          <text class="fa-solid">&#xf5fd;</text>
        </view>
        <view class="stat-content">
          <text class="stat-value">{{ totalEvents }}</text>
          <text class="stat-label">事件总数</text>
        </view>
        <view class="stat-glow"></view>
      </view>

      <view class="stat-card gradient-cool">
        <view class="stat-icon">
          <text class="fa-solid">&#xf02c;</text>
        </view>
        <view class="stat-content">
          <text class="stat-value">{{ totalTypes }}</text>
          <text class="stat-label">类型总数</text>
        </view>
        <view class="stat-glow"></view>
      </view>

      <view class="stat-card gradient-warm">
        <view class="stat-icon">
          <text class="fa-solid">&#xf004;</text>
        </view>
        <view class="stat-content">
          <text class="stat-value">{{ totalAnniversaries }}</text>
          <text class="stat-label">纪念日</text>
        </view>
        <view class="stat-glow"></view>
      </view>
    </view>

    <!-- Export data section -->
    <view class="section-card glass-card">
      <view class="section-header">
        <text class="fa-solid">&#xf56e;</text>
        <text class="section-title">导出数据</text>
      </view>
      <text class="section-desc">将当前所有数据导出为 JSON 格式，并复制到剪贴板</text>
      <button class="action-btn gradient-btn" @click="handleExport">
        <text class="fa-solid">&#xf093;</text>
        <text class="btn-text">导出数据</text>
      </button>
    </view>

    <!-- Import data section -->
    <view class="section-card glass-card">
      <view class="section-header">
        <text class="fa-solid">&#xf56f;</text>
        <text class="section-title">导入数据</text>
      </view>
      <text class="section-desc">从剪贴板导入 JSON 格式数据，将合并到现有数据中</text>
      <button class="action-btn gradient-btn" @click="handleImport">
        <text class="fa-solid">&#xf093;</text>
        <text class="btn-text">导入数据</text>
      </button>
    </view>

    <!-- Export anniversary data section -->
    <view class="section-card glass-card">
      <view class="section-header">
        <text class="fa-solid">&#xf004;</text>
        <text class="section-title">导出纪念日数据</text>
      </view>
      <text class="section-desc">将纪念日和分类数据导出为 JSON 格式，并复制到剪贴板</text>
      <button class="action-btn gradient-btn" @click="handleExportAnniversaries">
        <text class="fa-solid">&#xf093;</text>
        <text class="btn-text">导出纪念日数据</text>
      </button>
    </view>

    <!-- Import anniversary data section -->
    <view class="section-card glass-card">
      <view class="section-header">
        <text class="fa-solid">&#xf56f;</text>
        <text class="section-title">导入纪念日数据</text>
      </view>
      <text class="section-desc">从剪贴板导入纪念日 JSON 数据，将合并到现有数据中</text>
      <button class="action-btn gradient-btn" @click="handleImportAnniversaries">
        <text class="fa-solid">&#xf093;</text>
        <text class="btn-text">导入纪念日数据</text>
      </button>
    </view>

    <!-- Import preview dialog -->
    <view v-if="showPreview" class="dialog-overlay" @click="closePreview">
      <view class="dialog-content" @click.stop>
        <view class="dialog-header">
          <text class="fa-solid">&#xf06e;</text>
          <text class="dialog-title">导入预览</text>
        </view>
        <view class="dialog-body">
          <view class="preview-item">
            <text class="preview-label">事件数</text>
            <text class="preview-value">{{ previewData.eventCount }}</text>
          </view>
          <view class="preview-item">
            <text class="preview-label">类型数</text>
            <text class="preview-value">{{ previewData.typeCount }}</text>
          </view>
        </view>
        <view class="dialog-footer">
          <button class="dialog-btn dialog-btn-cancel" @click="closePreview">
            <text class="fa-solid">&#xf00d;</text>
            <text class="btn-text">取消</text>
          </button>
          <button class="dialog-btn dialog-btn-confirm gradient-btn" @click="confirmImport">
            <text class="fa-solid">&#xf00c;</text>
            <text class="btn-text">确认导入</text>
          </button>
        </view>
      </view>
    </view>

    <!-- Anniversary import preview dialog -->
    <view v-if="showAnniversaryPreview" class="dialog-overlay" @click="closeAnniversaryPreview">
      <view class="dialog-content" @click.stop>
        <view class="dialog-header">
          <text class="fa-solid">&#xf06e;</text>
          <text class="dialog-title">纪念日导入预览</text>
        </view>
        <view class="dialog-body">
          <view class="preview-item">
            <text class="preview-label">纪念日数</text>
            <text class="preview-value">{{ previewAnniversaryData.anniversaryCount }}</text>
          </view>
          <view class="preview-item">
            <text class="preview-label">分类数</text>
            <text class="preview-value">{{ previewAnniversaryData.categoryCount }}</text>
          </view>
        </view>
        <view class="dialog-footer">
          <button class="dialog-btn dialog-btn-cancel" @click="closeAnniversaryPreview">
            <text class="fa-solid">&#xf00d;</text>
            <text class="btn-text">取消</text>
          </button>
          <button class="dialog-btn dialog-btn-confirm gradient-btn" @click="confirmAnniversaryImport">
            <text class="fa-solid">&#xf00c;</text>
            <text class="btn-text">确认导入</text>
          </button>
        </view>
      </view>
    </view>

    <!-- Custom TabBar -->
    <CustomTabBar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEventStore, type EventData } from '@/store/event'
import { useEventTypeStore, type EventTypeData } from '@/store/eventType'
import { useAnniversaryStore } from '@/store/anniversary'
import { useAnniversaryCategoryStore } from '@/store/anniversaryCategory'
import type { AnniversaryData, AnniversaryCategory } from '@/utils/storage'
import CustomTabBar from '@/components/CustomTabBar.vue'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()
const anniversaryStore = useAnniversaryStore()
const categoryStore = useAnniversaryCategoryStore()

// 动态计算导航栏高度
const navBarHeight = computed(() => {
  const height = uni.getStorageSync('navBarHeight')
  return height || 88
})

// 数据统计
const totalEvents = computed(() => eventStore.totalCount)
const totalTypes = computed(() => eventTypeStore.typeCount)

// 纪念日统计
const totalAnniversaries = computed(() => anniversaryStore.totalCount)

// 导入预览状态
const showPreview = ref(false)
const previewData = ref({
  eventCount: 0,
  typeCount: 0,
  events: [] as EventData[],
  types: [] as EventTypeData[]
})

// 纪念日导入预览状态
const showAnniversaryPreview = ref(false)
const previewAnniversaryData = ref({
  anniversaryCount: 0,
  categoryCount: 0,
  anniversaries: [] as AnniversaryData[],
  categories: [] as AnniversaryCategory[]
})

// ExportData 接口定义
interface ExportData {
  version: number
  events: EventData[]
  types: EventTypeData[]
  exportedAt: number
}

// 纪念日导出数据接口定义
interface AnniversaryExportData {
  version: number
  anniversaries: AnniversaryData[]
  categories: AnniversaryCategory[]
  exportedAt: number
}

/**
 * 处理导出数据
 */
function handleExport(): void {
  const exportData: ExportData = {
    version: 1,
    events: eventStore.events,
    types: eventTypeStore.types,
    exportedAt: Date.now()
  }

  const jsonString = JSON.stringify(exportData, null, 2)

  uni.setClipboardData({
    data: jsonString,
    success: () => {
      uni.showToast({
        title: '已复制到剪贴板',
        icon: 'success'
      })
    },
    fail: () => {
      uni.showToast({
        title: '复制失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 处理导入数据
 */
function handleImport(): void {
  uni.getClipboardData({
    success: (res) => {
      try {
        const data = JSON.parse(res.data) as ExportData

        // 校验版本
        if (data.version !== 1) {
          uni.showToast({
            title: '数据版本不兼容',
            icon: 'none'
          })
          return
        }

        // 校验 JSON 格式
        if (!data.events || !Array.isArray(data.events)) {
          throw new Error('无效的 Events 数据')
        }
        if (!data.types || !Array.isArray(data.types)) {
          throw new Error('无效的 Types 数据')
        }

        // 更新预览数据
        previewData.value = {
          eventCount: data.events.length,
          typeCount: data.types.length,
          events: data.events,
          types: data.types
        }

        // 显示预览弹窗
        showPreview.value = true
      } catch (error) {
        uni.showToast({
          title: 'JSON 格式无效',
          icon: 'none'
        })
      }
    },
    fail: () => {
      uni.showToast({
        title: '读取剪贴板失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 关闭预览弹窗
 */
function closePreview(): void {
  showPreview.value = false
  previewData.value = {
    eventCount: 0,
    typeCount: 0,
    events: [],
    types: []
  }
}

/**
 * 确认导入数据
 */
function confirmImport(): void {
  try {
    // 合并事件类型
    const typeResult = eventTypeStore.mergeTypes(previewData.value.types)

    // 合并事件
    const eventResult = eventStore.mergeEvents(previewData.value.events)

    // 显示导入结果
    const message = `导入完成！\n事件：新增${eventResult.added}，更新${eventResult.updated}\n类型：新增${typeResult.added}，更新${typeResult.updated}`

    uni.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    })

    // 关闭预览弹窗
    closePreview()
  } catch (error) {
    uni.showToast({
      title: '导入失败',
      icon: 'none'
    })
  }
}

/**
 * 处理导出纪念日数据
 */
function handleExportAnniversaries(): void {
  const exportData: AnniversaryExportData = {
    version: 2,
    anniversaries: anniversaryStore.anniversaries,
    categories: categoryStore.categories,
    exportedAt: Date.now()
  }

  const jsonString = JSON.stringify(exportData, null, 2)

  uni.setClipboardData({
    data: jsonString,
    success: () => {
      uni.showToast({
        title: '纪念日数据已复制',
        icon: 'success'
      })
    },
    fail: () => {
      uni.showToast({
        title: '复制失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 处理导入纪念日数据
 */
function handleImportAnniversaries(): void {
  uni.getClipboardData({
    success: (res) => {
      try {
        const data = JSON.parse(res.data) as AnniversaryExportData

        // 校验版本
        if (data.version !== 2) {
          uni.showToast({
            title: '数据版本不兼容',
            icon: 'none'
          })
          return
        }

        // 校验 JSON 格式
        if (!data.anniversaries || !Array.isArray(data.anniversaries)) {
          throw new Error('无效的纪念日数据')
        }
        if (!data.categories || !Array.isArray(data.categories)) {
          throw new Error('无效的分类数据')
        }

        // 更新预览数据
        previewAnniversaryData.value = {
          anniversaryCount: data.anniversaries.length,
          categoryCount: data.categories.length,
          anniversaries: data.anniversaries,
          categories: data.categories
        }

        // 显示预览弹窗
        showAnniversaryPreview.value = true
      } catch (error) {
        uni.showToast({
          title: 'JSON 格式无效',
          icon: 'none'
        })
      }
    },
    fail: () => {
      uni.showToast({
        title: '读取剪贴板失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 关闭纪念日预览弹窗
 */
function closeAnniversaryPreview(): void {
  showAnniversaryPreview.value = false
  previewAnniversaryData.value = {
    anniversaryCount: 0,
    categoryCount: 0,
    anniversaries: [],
    categories: []
  }
}

/**
 * 确认导入纪念日数据
 */
function confirmAnniversaryImport(): void {
  try {
    // 合并分类
    const categoryResult = categoryStore.mergeCategories(previewAnniversaryData.value.categories)

    // 合并纪念日
    const anniversaryResult = anniversaryStore.mergeAnniversaries(previewAnniversaryData.value.anniversaries)

    // 显示导入结果
    const message = `导入完成！\n纪念日：新增${anniversaryResult.added}，更新${anniversaryResult.updated}\n分类：新增${categoryResult.added}，跳过${categoryResult.skipped}`

    uni.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    })

    // 关闭预览弹窗
    closeAnniversaryPreview()
  } catch (error) {
    uni.showToast({
      title: '导入失败',
      icon: 'none'
    })
  }
}
</script>

<style lang="scss" scoped>
.page-data-manager {
  min-height: 100vh;
  padding-bottom: calc(100rpx + env(safe-area-inset-bottom) + $spacing-lg);

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
      background: $gradient-primary;
      opacity: 0.15;
      border-radius: 0 0 $radius-xl $radius-xl;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-md;
      padding: $spacing-lg;

      .fa-solid {
        font-size: 32rpx;
        color: $accent-purple;
      }

      .header-title {
        font-size: 36rpx;
        font-weight: 700;
        color: $text-primary;
      }
    }
  }

  .overview-section {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;
    padding: $spacing-md;

    .stat-card {
      flex: 1;
      min-width: 200rpx;
      position: relative;
      padding: $spacing-lg;
      border-radius: $radius-lg;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;

      &.gradient-primary {
        background: $gradient-primary;
        color: #ffffff;
      }

      &.gradient-cool {
        background: $gradient-cool;
        color: #ffffff;
      }

      &.gradient-warm {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
        color: #ffffff;
      }

      .stat-icon {
        width: 64rpx;
        height: 64rpx;
        border-radius: $radius-md;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;

        .fa-solid {
          font-size: 28rpx;
          color: #ffffff;
        }
      }

      .stat-content {
        .stat-value {
          font-size: 48rpx;
          font-weight: 700;
          display: block;
        }

        .stat-label {
          font-size: 24rpx;
          opacity: 0.9;
        }
      }

      .stat-glow {
        position: absolute;
        right: -20rpx;
        bottom: -20rpx;
        width: 100rpx;
        height: 100rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
      }
    }
  }

  .section-card {
    margin: $spacing-md;
    padding: $spacing-lg;

    .section-header {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      margin-bottom: $spacing-md;

      .fa-solid {
        font-size: 20rpx;
        color: $accent-indigo;
      }

      .section-title {
        font-size: 30rpx;
        font-weight: 600;
        color: $text-primary;
      }
    }

    .section-desc {
      display: block;
      font-size: 24rpx;
      color: $text-secondary;
      margin-bottom: $spacing-lg;
      line-height: 1.5;
    }

    .action-btn {
      width: 100%;
      height: 88rpx;
      border-radius: $radius-md;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-sm;
      background: $gradient-primary;
      box-shadow: $shadow-medium;
      transition: all $transition-fast;

      .fa-solid {
        font-size: 28rpx;
        color: #ffffff;
      }

      .btn-text {
        font-size: 28rpx;
        font-weight: 600;
        color: #ffffff;
      }

      &:active {
        opacity: 0.8;
        transform: scale(0.98);
      }
    }
  }

  .dialog-overlay {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fade-in $transition-normal;

    .dialog-content {
      width: 80%;
      max-width: 600rpx;
      background: $glass-bg;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: $radius-lg;
      border: 1px solid $glass-border;
      box-shadow: $shadow-strong;
      overflow: hidden;
      animation: slide-up $transition-normal;

      .dialog-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: $spacing-sm;
        padding: $spacing-lg;
        background: $gradient-primary;
        color: #ffffff;

        .fa-solid {
          font-size: 28rpx;
        }

        .dialog-title {
          font-size: 30rpx;
          font-weight: 700;
        }
      }

      .dialog-body {
        padding: $spacing-lg;

        .preview-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: $spacing-md 0;
          border-bottom: 1px solid $border-color;

          &:last-child {
            border-bottom: none;
          }

          .preview-label {
            font-size: 28rpx;
            color: $text-secondary;
          }

          .preview-value {
            font-size: 32rpx;
            font-weight: 700;
            color: $accent-indigo;
          }
        }
      }

      .dialog-footer {
        display: flex;
        padding: $spacing-lg;
        gap: $spacing-md;
        border-top: 1px solid $border-color;

        .dialog-btn {
          flex: 1;
          height: 80rpx;
          border-radius: $radius-md;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: $spacing-sm;
          font-size: 28rpx;
          transition: all $transition-fast;

          &.dialog-btn-cancel {
            background: rgba(99, 102, 241, 0.1);
            color: $text-secondary;

            .fa-solid {
              color: $text-secondary;
            }

            &:active {
              background: rgba(99, 102, 241, 0.2);
            }
          }

          &.dialog-btn-confirm {
            .fa-solid {
              color: #ffffff;
            }
          }
        }
      }
    }
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slide-up {
  from {
    transform: translateY(40rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
