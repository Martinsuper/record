# 数据导入导出功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 uni-app 事件记录应用添加全量数据导入导出功能，通过粘贴板传输 JSON 数据。

**Architecture:** 新增独立数据管理页面，通过 TabBar 入口访问；在现有 Pinia store 中添加合并数据方法；使用 uni-app 粘贴板 API 完成数据读写。

**Tech Stack:** Vue 3, Pinia, uni-app, TypeScript, SCSS

---

## File Structure

| 文件 | 责任 |
|-----|------|
| `src/pages/data-manager/data-manager.vue` | 数据管理页面 UI 和交互逻辑 |
| `src/store/event.ts` | 添加 `mergeEvents` action 处理事件合并 |
| `src/store/eventType.ts` | 添加 `mergeTypes` action 处理类型合并 |
| `src/components/CustomTabBar.vue` | 添加第三个 Tab 项「数据」 |
| `src/pages.json` | 注册新页面和 TabBar 配置 |

---

### Task 1: 在 Event Store 中添加 mergeEvents action

**Files:**
- Modify: `src/store/event.ts`

- [ ] **Step 1: 添加 mergeEvents action**

在 `src/store/event.ts` 的 `actions` 对象中添加 `mergeEvents` 方法，位置在 `refresh` 方法之后：

```typescript
    /**
     * 合并导入的事件数据
     * @param importedEvents 导入的事件数组
     * @returns { added: number, updated: number } 新增和更新的数量
     */
    mergeEvents(importedEvents: EventData[]): { added: number; updated: number } {
      let added = 0
      let updated = 0

      importedEvents.forEach((imported) => {
        const existing = this.events.find((e) => e.id === imported.id)

        if (existing) {
          // 更新已存在的事件
          existing.name = imported.name || existing.name
          existing.typeId = imported.typeId || existing.typeId
          existing.time = imported.time || existing.time
          updated++
        } else {
          // 新增事件
          this.events.push({
            id: imported.id,
            name: imported.name || '',
            typeId: imported.typeId || '',
            time: imported.time || Date.now(),
            createdAt: imported.createdAt || Date.now()
          })
          added++
        }
      })

      if (added > 0 || updated > 0) {
        this.saveToStorage()
      }

      return { added, updated }
    }
```

- [ ] **Step 2: 验证代码语法**

检查 TypeScript 类型是否正确，确保 `EventData` 类型已定义。

- [ ] **Step 3: Commit**

```bash
git add src/store/event.ts
git commit -m "feat(store): 添加 mergeEvents action 支持事件数据合并导入

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: 在 EventType Store 中添加 mergeTypes action

**Files:**
- Modify: `src/store/eventType.ts`

- [ ] **Step 1: 添加 mergeTypes action**

在 `src/store/eventType.ts` 的 `actions` 对象中添加 `mergeTypes` 方法，位置在 `updateType` 方法之后：

```typescript
    /**
     * 合并导入的事件类型数据
     * @param importedTypes 导入的类型数组
     * @returns { added: number, updated: number } 新增和更新的数量
     */
    mergeTypes(importedTypes: EventTypeData[]): { added: number; updated: number } {
      let added = 0
      let updated = 0

      importedTypes.forEach((imported) => {
        const existing = this.types.find((t) => t.id === imported.id)

        if (existing) {
          // 更新已存在的类型
          existing.name = imported.name || existing.name
          existing.color = imported.color || existing.color
          updated++
        } else {
          // 新增类型
          this.types.push({
            id: imported.id,
            name: imported.name || '',
            color: imported.color || '#999999',
            createdAt: imported.createdAt || Date.now()
          })
          added++
        }
      })

      if (added > 0 || updated > 0) {
        this.saveToStorage()
      }

      return { added, updated }
    }
```

- [ ] **Step 2: 验证代码语法**

检查 TypeScript 类型是否正确，确保 `EventTypeData` 类型已定义。

- [ ] **Step 3: Commit**

```bash
git add src/store/eventType.ts
git commit -m "feat(store): 添加 mergeTypes action 支持类型数据合并导入

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: 创建数据管理页面

**Files:**
- Create: `src/pages/data-manager/data-manager.vue`

- [ ] **Step 1: 创建页面文件**

创建 `src/pages/data-manager/data-manager.vue`：

```vue
<template>
  <view class="page-data-manager" :style="{ '--nav-bar-height': navBarHeight + 'px' }">
    <!-- Gradient header -->
    <view class="header">
      <view class="header-bg"></view>
      <view class="header-content glass-card">
        <text class="fa-solid">&#xf0e7;</text>
        <text class="header-title">数据管理</text>
      </view>
    </view>

    <!-- Data statistics -->
    <view class="stats-section fade-in-up" style="animation-delay: 0.1s">
      <view class="stats-card glass-card">
        <view class="stats-row">
          <view class="stat-item">
            <text class="fa-solid">&#xf5fd;</text>
            <text class="stat-value">{{ eventCount }}</text>
            <text class="stat-label">事件总数</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="fa-solid">&#xf02c;</text>
            <text class="stat-value">{{ typeCount }}</text>
            <text class="stat-label">类型总数</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Export section -->
    <view class="section-card glass-card fade-in-up" style="animation-delay: 0.2s">
      <view class="section-header">
        <text class="fa-solid">&#xf56e;</text>
        <text class="section-title">导出数据</text>
      </view>
      <view class="section-desc">
        将所有事件和类型数据导出到粘贴板，可用于备份或分享。
      </view>
      <view class="action-btn export-btn" @click="handleExport">
        <text class="fa-solid">&#xf56e;</text>
        <text class="btn-text">导出到粘贴板</text>
      </view>
    </view>

    <!-- Import section -->
    <view class="section-card glass-card fade-in-up" style="animation-delay: 0.3s">
      <view class="section-header">
        <text class="fa-solid">&#xf56f;</text>
        <text class="section-title">导入数据</text>
      </view>
      <view class="section-desc">
        从粘贴板读取 JSON 数据，合并到本地存储。已存在的数据会被更新，新数据会被添加。
      </view>
      <view class="action-btn import-btn" @click="handleImport">
        <text class="fa-solid">&#xf56f;</text>
        <text class="btn-text">从粘贴板导入</text>
      </view>
    </view>

    <!-- Import preview modal -->
    <view v-if="showPreview" class="preview-modal" @click.self="closePreview">
      <view class="preview-content glass-card">
        <view class="preview-header">
          <text class="fa-solid">&#xf058;</text>
          <text class="preview-title">数据预览</text>
        </view>
        <view class="preview-body">
          <view class="preview-item">
            <text class="fa-solid">&#xf5fd;</text>
            <text class="preview-text">事件：{{ previewData.eventCount }} 条</text>
          </view>
          <view class="preview-item">
            <text class="fa-solid">&#xf02c;</text>
            <text class="preview-text">类型：{{ previewData.typeCount }} 种</text>
          </view>
        </view>
        <view class="preview-actions">
          <view class="preview-btn cancel-btn" @click="closePreview">
            <text class="btn-text">取消</text>
          </view>
          <view class="preview-btn confirm-btn" @click="confirmImport">
            <text class="btn-text">确认导入</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Custom TabBar -->
    <CustomTabBar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import CustomTabBar from '@/components/CustomTabBar.vue'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()

// 动态计算导航栏高度
const navBarHeight = computed(() => {
  const height = uni.getStorageSync('navBarHeight')
  return height || 88
})

// 数据统计
const eventCount = computed(() => eventStore.totalCount)
const typeCount = computed(() => eventTypeStore.typeCount)

// 预览弹窗状态
const showPreview = ref(false)
const previewData = ref({
  eventCount: 0,
  typeCount: 0,
  rawData: null as any
})

// 导出数据类型定义
interface ExportData {
  version: number
  exportedAt: number
  events: any[]
  eventTypes: any[]
}

/**
 * 导出数据到粘贴板
 */
function handleExport() {
  const exportData: ExportData = {
    version: 1,
    exportedAt: Date.now(),
    events: eventStore.events,
    eventTypes: eventTypeStore.types
  }

  const jsonString = JSON.stringify(exportData, null, 2)

  uni.setClipboardData({
    data: jsonString,
    success: () => {
      uni.showToast({
        title: '已复制到粘贴板',
        icon: 'success'
      })
    },
    fail: () => {
      uni.showToast({
        title: '复制失败，请重试',
        icon: 'none'
      })
    }
  })
}

/**
 * 从粘贴板导入数据
 */
function handleImport() {
  uni.getClipboardData({
    success: (res) => {
      const content = res.data

      if (!content || content.trim() === '') {
        uni.showToast({
          title: '粘贴板无内容',
          icon: 'none'
        })
        return
      }

      // 解析并校验 JSON
      try {
        const data: ExportData = JSON.parse(content)

        // 校验版本
        if (data.version !== 1) {
          uni.showToast({
            title: '数据版本不兼容',
            icon: 'none'
          })
          return
        }

        // 校验必要字段
        if (!Array.isArray(data.events) || !Array.isArray(data.eventTypes)) {
          uni.showToast({
            title: '数据格式不完整',
            icon: 'none'
          })
          return
        }

        // 显示预览弹窗
        previewData.value = {
          eventCount: data.events.length,
          typeCount: data.eventTypes.length,
          rawData: data
        }
        showPreview.value = true
      } catch (e) {
        uni.showToast({
          title: '数据格式错误',
          icon: 'none'
        })
      }
    },
    fail: () => {
      uni.showToast({
        title: '无法读取粘贴板',
        icon: 'none'
      })
    }
  })
}

/**
 * 关闭预览弹窗
 */
function closePreview() {
  showPreview.value = false
  previewData.value = {
    eventCount: 0,
    typeCount: 0,
    rawData: null
  }
}

/**
 * 确认导入数据
 */
function confirmImport() {
  const data = previewData.value.rawData

  if (!data) {
    closePreview()
    return
  }

  // 先合并类型，再合并事件（事件依赖类型）
  const typeResult = eventTypeStore.mergeTypes(data.eventTypes)
  const eventResult = eventStore.mergeEvents(data.events)

  closePreview()

  // 显示导入结果
  const totalAdded = typeResult.added + eventResult.added
  const totalUpdated = typeResult.updated + eventResult.updated

  if (totalAdded === 0 && totalUpdated === 0) {
    uni.showToast({
      title: '导入完成，无变化',
      icon: 'success'
    })
  } else {
    uni.showToast({
      title: `导入成功：新增${totalAdded}，更新${totalUpdated}`,
      icon: 'success',
      duration: 2000
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
      background: $gradient-aurora;
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
        color: $accent-cyan;
      }

      .header-title {
        font-size: 36rpx;
        font-weight: 700;
        color: $text-primary;
      }
    }
  }

  .stats-section {
    padding: $spacing-md;

    .stats-card {
      padding: $spacing-lg;

      .stats-row {
        display: flex;
        align-items: center;
        justify-content: space-around;

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: $spacing-sm;

          .fa-solid {
            font-size: 32rpx;
            color: $accent-indigo;
          }

          .stat-value {
            font-size: 40rpx;
            font-weight: 700;
            color: $text-primary;
          }

          .stat-label {
            font-size: 24rpx;
            color: $text-secondary;
          }
        }

        .stat-divider {
          width: 2rpx;
          height: 80rpx;
          background: $border-color;
        }
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
      font-size: 26rpx;
      color: $text-secondary;
      line-height: 1.6;
      margin-bottom: $spacing-lg;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-sm;
      padding: $spacing-lg;
      border-radius: $radius-lg;
      transition: all $transition-fast;

      .fa-solid {
        font-size: 24rpx;
      }

      .btn-text {
        font-size: 28rpx;
        font-weight: 600;
      }

      &:active {
        opacity: 0.8;
        transform: scale(0.98);
      }
    }

    .export-btn {
      background: $gradient-cool;
      color: #ffffff;
    }

    .import-btn {
      background: $gradient-warm;
      color: #ffffff;
    }
  }

  .preview-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;

    .preview-content {
      width: 80%;
      max-width: 600rpx;
      padding: $spacing-xl;
      border-radius: $radius-xl;

      .preview-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: $spacing-sm;
        margin-bottom: $spacing-lg;

        .fa-solid {
          font-size: 32rpx;
          color: $accent-indigo;
        }

        .preview-title {
          font-size: 32rpx;
          font-weight: 700;
          color: $text-primary;
        }
      }

      .preview-body {
        display: flex;
        flex-direction: column;
        gap: $spacing-md;
        margin-bottom: $spacing-xl;

        .preview-item {
          display: flex;
          align-items: center;
          gap: $spacing-sm;
          padding: $spacing-md;
          background: rgba(99, 102, 241, 0.05);
          border-radius: $radius-md;

          .fa-solid {
            font-size: 20rpx;
            color: $accent-indigo;
          }

          .preview-text {
            font-size: 28rpx;
            color: $text-primary;
          }
        }
      }

      .preview-actions {
        display: flex;
        gap: $spacing-md;

        .preview-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: $spacing-lg;
          border-radius: $radius-lg;
          transition: all $transition-fast;

          .btn-text {
            font-size: 28rpx;
            font-weight: 600;
          }

          &:active {
            opacity: 0.8;
          }
        }

        .cancel-btn {
          background: rgba(99, 102, 241, 0.1);
          color: $text-secondary;
        }

        .confirm-btn {
          background: $gradient-cool;
          color: #ffffff;
        }
      }
    }
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/data-manager/data-manager.vue
git commit -m "feat(page): 创建数据管理页面

- 支持导出数据到粘贴板
- 支持从粘贴板导入数据
- 显示数据统计
- 导入前预览确认

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: 更新 pages.json 注册新页面和 TabBar

**Files:**
- Modify: `src/pages.json`

- [ ] **Step 1: 添加新页面配置**

在 `src/pages.json` 的 `pages` 数组中，在 `pages/stats/stats` 之后添加新页面：

```json
{
  "path": "pages/data-manager/data-manager",
  "style": {
    "navigationBarTitleText": "数据管理",
    "navigationBarBackgroundColor": "#FDF4FF",
    "navigationBarTextStyle": "black",
    "navigationStyle": "custom"
  }
}
```

- [ ] **Step 2: 更新 TabBar list**

将 `src/pages.json` 的 `tabBar.list` 数组修改为：

```json
"list": [
  {
    "pagePath": "pages/index/index",
    "text": "事件"
  },
  {
    "pagePath": "pages/stats/stats",
    "text": "统计"
  },
  {
    "pagePath": "pages/data-manager/data-manager",
    "text": "数据"
  }
]
```

- [ ] **Step 3: Commit**

```bash
git add src/pages.json
git commit -m "feat(config): 注册数据管理页面和 TabBar 配置

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: 更新 CustomTabBar 组件

**Files:**
- Modify: `src/components/CustomTabBar.vue`

- [ ] **Step 1: 添加第三个 Tab 项**

修改 `src/components/CustomTabBar.vue` 的模板部分，在第二个 `tab-item` 之后添加第三个：

```vue
    <view
      class="tab-item"
      :class="{ active: currentIndex === 2 }"
      @click="switchTab(2)"
    >
      <text class="fa-solid">&#xf0e7;</text>
      <text class="tab-text">数据</text>
    </view>
```

- [ ] **Step 2: 更新 pages 数组**

修改 script 中的 `pages` 数组：

```typescript
const pages = [
  '/pages/index/index',
  '/pages/stats/stats',
  '/pages/data-manager/data-manager'
]
```

- [ ] **Step 3: 更新 getCurrentPageIndex 函数**

修改 `getCurrentPageIndex` 函数以正确识别数据管理页面：

```typescript
function getCurrentPageIndex(): number {
  const pageStack = getCurrentPages()
  if (pageStack.length === 0) return 0
  const currentPage = pageStack[pageStack.length - 1]
  const route = currentPage.route || ''

  if (route === 'pages/stats/stats') return 1
  if (route === 'pages/data-manager/data-manager') return 2
  return 0
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/CustomTabBar.vue
git commit -m "feat(tabbar): 添加数据管理 Tab 项

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: 最终验证

**Files:**
- None (验证步骤)

- [ ] **Step 1: 检查 TypeScript 类型**

运行类型检查确保无错误：

```bash
npm run type-check
```

Expected: No type errors

- [ ] **Step 2: 运行开发服务器**

启动 H5 开发服务器测试：

```bash
npm run dev:h5
```

Expected: 应用正常运行，TabBar 显示三个选项

- [ ] **Step 3: 手动测试导出功能**

1. 进入数据管理页面
2. 点击「导出到粘贴板」
3. 检查粘贴板内容是否为有效 JSON

- [ ] **Step 4: 手动测试导入功能**

1. 复制导出的 JSON 到粘贴板
2. 点击「从粘贴板导入」
3. 确认预览弹窗显示正确数量
4. 点击确认导入
5. 检查 Toast 提示是否正确

- [ ] **Step 5: 最终 Commit**

```bash
git add -A
git commit -m "feat: 完成数据导入导出功能

- 新增数据管理页面
- 支持 JSON 格式全量导出到粘贴板
- 支持从粘贴板导入并合并数据
- 导入前预览确认
- 更新 TabBar 添加数据入口

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```