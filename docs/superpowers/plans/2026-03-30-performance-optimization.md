# 记录时光应用性能优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全面优化 uni-app 应用的性能，使其在 2000+ 条数据下流畅运行。

**Architecture:** 渐进式优化，从数据层 → 渲染层 → 资源层 → 构建层，每阶段独立可验证。

**Tech Stack:** Vue 3 + Vite + Pinia + uni-app + uview-plus

---

## File Structure

**修改文件：**
- `src/store/event.ts` — 添加缓存机制、优化统计计算、添加 isLoaded 状态
- `src/store/eventType.ts` — 添加 isLoaded 状态
- `src/components/EventList.vue` — 实现虚拟滚动、颜色计算缓存
- `src/App.vue` — 集中初始化 store
- `src/pages/index/index.vue` — 移除重复加载
- `src/pages/stats/stats.vue` — 移除重复加载
- `index.html` — 添加字体预连接
- `vite.config.ts` — 添加 bundle 分析器

**新增依赖：**
- `rollup-plugin-visualizer` — bundle 分析

---

## Phase 1: 数据层优化

### Task 1: Store 过滤缓存机制

**Files:**
- Modify: `src/store/event.ts:24-96`

- [ ] **Step 1: 在 state 中添加缓存状态**

在 `src/store/event.ts` 的 state 定义中添加 `_filteredEventsCache` 和 `_cacheKey`：

```typescript
state: () => ({
  events: [] as EventData[],
  filterType: null as string | null,
  filterTimeRange: 'all' as TimeRangeFilter,
  // 新增：缓存状态
  _filteredEventsCache: null as EventData[] | null,
  _cacheKey: ''
}),
```

- [ ] **Step 2: 重写 filteredEvents getter 使用缓存**

将第 35-50 行的 `filteredEvents` getter 替换为缓存版本：

```typescript
filteredEvents: (state): EventData[] => {
  // 生成缓存 key：包含过滤条件和数据变化标识
  const lastEventTime = state.events.length > 0 ? state.events[state.events.length - 1].time : 0
  const cacheKey = `${state.filterType}-${state.filterTimeRange}-${state.events.length}-${lastEventTime}`

  // 缓存命中时直接返回
  if (state._cacheKey === cacheKey && state._filteredEventsCache) {
    return state._filteredEventsCache
  }

  // 计算过滤结果
  let result = [...state.events]

  // 按类型过滤
  if (state.filterType) {
    result = result.filter(event => event.typeId === state.filterType)
  }

  // 按时间范围过滤
  result = filterByTimeRange(result, state.filterTimeRange)

  // 按时间倒序排序
  result.sort((a, b) => b.time - a.time)

  // 更新缓存
  state._filteredEventsCache = result
  state._cacheKey = cacheKey

  return result
},
```

- [ ] **Step 3: 验证修改正确性**

检查文件确保：
1. state 新增两个缓存字段
2. filteredEvents getter 使用缓存逻辑
3. import 语句保持不变

- [ ] **Step 4: 提交数据层缓存优化**

```bash
git add src/store/event.ts
git commit -m "perf: add filtering cache mechanism in event store"
```

---

### Task 2: recentDaysStats 单次遍历优化

**Files:**
- Modify: `src/store/event.ts:82-95`

- [ ] **Step 1: 重写 recentDaysStats getter 为单次遍历**

将第 82-95 行的 `recentDaysStats` getter 替换为优化版本：

```typescript
recentDaysStats: (state): { date: string; count: number; timestamp: number }[] => {
  const recentDays = getRecentDays(7)
  const counts = new Map<number, number>()

  // 单次遍历所有事件，统计每个天数的事件数
  state.events.forEach(event => {
    for (const day of recentDays) {
      const dayEnd = day.timestamp + 24 * 60 * 60 * 1000
      if (event.time >= day.timestamp && event.time < dayEnd) {
        counts.set(day.timestamp, (counts.get(day.timestamp) || 0) + 1)
        break // 找到匹配的天数后跳出
      }
    }
  })

  // 构建返回结果
  return recentDays.map(day => ({
    date: day.label,
    count: counts.get(day.timestamp) || 0,
    timestamp: day.timestamp
  }))
},
```

- [ ] **Step 2: 提交统计优化**

```bash
git add src/store/event.ts
git commit -m "perf: optimize recentDaysStats to single-pass calculation"
```

---

### Task 3: 添加 isLoaded 状态防止重复加载

**Files:**
- Modify: `src/store/event.ts:24-29, 102-111`
- Modify: `src/store/eventType.ts:20-23, 79-89`

- [ ] **Step 1: 在 event store 的 state 添加 isLoaded**

在 `src/store/event.ts` 的 state 中添加 `isLoaded`：

```typescript
state: () => ({
  events: [] as EventData[],
  filterType: null as string | null,
  filterTimeRange: 'all' as TimeRangeFilter,
  _filteredEventsCache: null as EventData[] | null,
  _cacheKey: '',
  isLoaded: false  // 新增
}),
```

- [ ] **Step 2: 在 event store 的 loadFromStorage 添加检查**

修改 `src/store/event.ts` 的 `loadFromStorage` action（第 102-111 行）：

```typescript
loadFromStorage(): void {
  // 防止重复加载
  if (this.isLoaded) return

  const storedEvents = getEvents()
  this.events = storedEvents.map((event) => ({
    id: event.id,
    name: event.name || '',
    typeId: event.typeId || '',
    time: typeof event.time === 'number' ? event.time : new Date(event.time).getTime(),
    createdAt: event.createdAt || Date.now()
  }))
  this.isLoaded = true
},
```

- [ ] **Step 3: 在 eventType store 的 state 添加 isLoaded**

在 `src/store/eventType.ts` 的 state 中添加 `isLoaded`：

```typescript
state: () => ({
  types: [] as EventTypeData[],
  isLoaded: false  // 新增
}),
```

- [ ] **Step 4: 在 eventType store 的 loadFromStorage 添加检查**

修改 `src/store/eventType.ts` 的 `loadFromStorage` action（第 79-89 行）：

```typescript
loadFromStorage(): void {
  // 防止重复加载
  if (this.isLoaded) return

  const storedTypes = getEventTypes()
  this.types = storedTypes.map((type) => ({
    id: type.id,
    name: type.name,
    color: type.color,
    createdAt: type.createdAt || Date.now()
  }))
  this.isLoaded = true
},
```

- [ ] **Step 5: 提交 isLoaded 状态优化**

```bash
git add src/store/event.ts src/store/eventType.ts
git commit -m "perf: add isLoaded state to prevent duplicate storage reads"
```

---

### Task 4: Phase 1 功能验证

**Files:**
- 无文件修改，运行验证

- [ ] **Step 1: 运行 H5 开发服务器验证功能**

```bash
npm run dev:h5
```

验证：
1. 首页列表正常显示
2. 过滤功能正常工作
3. 统计页面数据正确
4. 切换页面数据不重复加载

- [ ] **Step 2: 检查控制台无错误输出**

在浏览器控制台确认：
- 无 JavaScript 错误
- 无 TypeScript 类型错误（运行 `npm run type-check`）

- [ ] **Step 3: Phase 1 完成标记**

Phase 1 数据层优化完成。

---

## Phase 2: 渲染层优化

### Task 5: EventList 虚拟滚动实现

**Files:**
- Modify: `src/components/EventList.vue:1-116`

- [ ] **Step 1: 在 script setup 中添加虚拟滚动变量**

在 `src/components/EventList.vue` 的 `<script setup>` 部分，添加虚拟滚动所需的变量和计算属性。在第 57 行之后添加：

```typescript
import { computed, ref, onMounted } from 'vue'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import { formatTime } from '@/utils/time'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()

const filteredEvents = computed(() => eventStore.filteredEvents)

// 虚拟滚动配置
const ITEM_HEIGHT = 140 // 卡片高度 + 间距（rpx 转 px 约 70px，使用 140px 确保安全）
const BUFFER_SIZE = 5   // 缓冲区项目数

const scrollTop = ref(0)
const containerHeight = ref(500) // 默认容器高度，后续会计算

// 计算可视范围
const visibleRange = computed(() => {
  const startIndex = Math.max(0, Math.floor(scrollTop.value / ITEM_HEIGHT) - BUFFER_SIZE)
  const visibleCount = Math.ceil(containerHeight.value / ITEM_HEIGHT) + 2 * BUFFER_SIZE
  const endIndex = Math.min(filteredEvents.value.length, startIndex + visibleCount)
  return { startIndex, endIndex }
})

// 仅渲染可视区域的事件
const visibleEvents = computed(() => {
  const { startIndex, endIndex } = visibleRange.value
  return filteredEvents.value.slice(startIndex, endIndex).map((event, i) => ({
    ...event,
    _index: startIndex + i
  }))
})

// 总高度（用于撑开滚动容器）
const totalHeight = computed(() => filteredEvents.value.length * ITEM_HEIGHT)

// 计算每个项目的偏移位置
function getEventOffset(index: number): number {
  return index * ITEM_HEIGHT
}

// 滚动事件处理
function onScroll(e: { detail: { scrollTop: number } }): void {
  scrollTop.value = e.detail.scrollTop
}

// 初始化时计算容器高度
onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  // 减去 header + filter + tabbar 大约 200px
  containerHeight.value = systemInfo.windowHeight - 200
})
```

- [ ] **Step 2: 重写模板部分实现虚拟滚动**

将 `<template>` 部分（第 1-54 行）替换为虚拟滚动版本：

```vue
<template>
  <view class="event-list">
    <!-- Empty state -->
    <view v-if="filteredEvents.length === 0" class="empty-state glass-card">
      <view class="empty-icon-wrap">
        <text class="fa-solid fa-inbox"></text>
      </view>
      <text class="empty-title">暂无事件记录</text>
      <text class="empty-subtitle">点击右下角按钮添加新事件</text>
      <view class="empty-decoration">
        <view class="deco-dot d1"></view>
        <view class="deco-dot d2"></view>
        <view class="deco-dot d3"></view>
      </view>
    </view>

    <!-- Virtual scroll container -->
    <scroll-view
      v-else
      scroll-y
      :style="{ height: containerHeight + 'px' }"
      @scroll="onScroll"
      class="virtual-scroll-container"
    >
      <!-- 占位容器，撑开真实高度 -->
      <view :style="{ height: totalHeight + 'px', position: 'relative' }">
        <!-- 仅渲染可视区域项目 -->
        <view
          v-for="event in visibleEvents"
          :key="event.id"
          class="event-card glass-card"
          :style="{ position: 'absolute', top: getEventOffset(event._index) + 'px', width: '100%' }"
        >
          <u-swipe-action
            :options="swipeOptions"
            @click="handleSwipeClick($event, event.id)"
          >
            <view class="event-card-inner">
              <!-- Type indicator with gradient -->
              <view class="type-indicator" :style="{ background: getTypeGradient(event.typeId) }"></view>

              <!-- Content -->
              <view class="event-content">
                <view class="event-header">
                  <view class="type-tag" :style="{ backgroundColor: getTypeColor(event.typeId) }">
                    <text class="fa-solid fa-star"></text>
                    <text class="type-name">{{ getTypeName(event.typeId) }}</text>
                  </view>
                </view>

                <text class="event-name">{{ event.name }}</text>

                <view class="event-time">
                  <text class="fa-solid fa-clock"></text>
                  <text class="time-text">{{ formatTime(event.time) }}</text>
                </view>
              </view>
            </view>

            <!-- Card decoration -->
            <view class="card-decoration" :style="{ background: getTypeGradient(event.typeId) }"></view>
          </u-swipe-action>
        </view>
      </view>
    </scroll-view>
  </view>
</template>
```

- [ ] **Step 3: 添加虚拟滚动相关样式**

在 `<style>` 部分添加虚拟滚动容器样式：

```scss
.virtual-scroll-container {
  // 确保滚动容器正确渲染
  overflow: hidden;

  .event-card {
    // 移除 margin-bottom，因为使用绝对定位
    margin-bottom: 0;
    // 添加内边距替代间距
    padding-bottom: $spacing-md;
    box-sizing: border-box;
  }
}
```

修改原有的 `.event-cards` 样式块，移除或注释掉（因为现在使用虚拟滚动）：

```scss
// .event-cards { ... }  // 已被虚拟滚动替代
```

- [ ] **Step 4: 提交虚拟滚动实现**

```bash
git add src/components/EventList.vue
git commit -m "perf: implement virtual scrolling in EventList"
```

---

### Task 6: 颜色计算缓存优化

**Files:**
- Modify: `src/components/EventList.vue:script setup`

- [ ] **Step 1: 在 script setup 中添加颜色缓存 computed**

在 `EventList.vue` 的 script setup 中，替换原有的 `getTypeGradient` 和 `adjustColor` 函数为缓存版本：

```typescript
// 颜色计算缓存 - 避免每次渲染重复计算
const typeColorMap = computed(() => {
  const map = new Map<string, { gradient: string; baseColor: string }>()

  // 预计算所有类型的颜色
  eventTypeStore.types.forEach(type => {
    const gradient = `linear-gradient(135deg, ${type.color} 0%, ${adjustColor(type.color, -20)} 100%)`
    map.set(type.id, {
      gradient,
      baseColor: type.color
    })
  })

  // 添加默认类型（未分类）的颜色
  map.set('', {
    gradient: 'linear-gradient(135deg, #999999 0%, #7a7a7a 100%)',
    baseColor: '#999999'
  })

  return map
})

// Helper to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '')
  const num = parseInt(hex, 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// 使用缓存的颜色映射
function getTypeGradient(typeId: string): string {
  return typeColorMap.value.get(typeId)?.gradient || typeColorMap.value.get('')!.gradient
}

function getTypeColor(typeId: string): string {
  return typeColorMap.value.get(typeId)?.baseColor || '#999999'
}

function getTypeName(typeId: string): string {
  return eventTypeStore.getTypeName(typeId)
}
```

- [ ] **Step 2: 验证颜色缓存正确性**

确认模板中的颜色调用使用缓存后的函数：
- `:style="{ background: getTypeGradient(event.typeId) }"`
- `:style="{ backgroundColor: getTypeColor(event.typeId) }"`

- [ ] **Step 3: 提交颜色缓存优化**

```bash
git add src/components/EventList.vue
git commit -m "perf: add color calculation cache in EventList"
```

---

### Task 7: Phase 2 功能验证

**Files:**
- 无文件修改，运行验证

- [ ] **Step 1: 运行 H5 开发服务器验证虚拟滚动**

```bash
npm run dev:h5
```

验证：
1. 列表正常滚动
2. 卡片正确渲染（无空白或重叠）
3. 滑动删除功能正常
4. 颜色显示正确

- [ ] **Step 2: 模拟大数据量测试**

在浏览器控制台手动添加多条测试数据：

```javascript
// 在 Vue DevTools 中访问 store
const store = window.__PINIA_STATE__
for (let i = 0; i < 100; i++) {
  store.event.events.push({
    id: `test_${i}`,
    name: `测试事件 ${i}`,
    typeId: store.eventType.types[0]?.id || '',
    time: Date.now() - i * 3600000,
    createdAt: Date.now()
  })
}
```

验证滚动流畅性。

- [ ] **Step 3: Phase 2 完成标记**

Phase 2 渲染层优化完成。

---

## Phase 3: 资源与加载优化

### Task 8: 字体加载优化

**Files:**
- Modify: `index.html:13-14`

- [ ] **Step 1: 在 index.html 添加字体预连接**

在 `index.html` 的 `<head>` 部分，在 Font Awesome CDN link 之前添加预连接：

```html
<head>
  <meta charset="UTF-8" />
  <script>
    var coverSupport = 'CSS' in window && typeof CSS.supports === 'function' && (CSS.supports('top: env(a)') ||
      CSS.supports('top: constant(a)'))
    document.write(
      '<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0' +
      (coverSupport ? ', viewport-fit=cover' : '') + '" />')
  </script>
  <title>记录时光</title>
  <!-- Font Awesome 预连接优化 -->
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
  <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
  <!-- Font Awesome 6 - 图标库 -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
  <!--preload-links-->
  <!--app-context-->
</head>
```

- [ ] **Step 2: 提交字体优化**

```bash
git add index.html
git commit -m "perf: add preconnect for Font Awesome CDN"
```

---

### Task 9: Store 初始化集中化

**Files:**
- Modify: `src/App.vue:1-12`
- Modify: `src/pages/index/index.vue:62-66`
- Modify: `src/pages/stats/stats.vue:112-115`

- [ ] **Step 1: 在 App.vue 的 onLaunch 中集中初始化 store**

修改 `src/App.vue`，将 onLaunch 改为：

```vue
<script>
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'

export default {
  onLaunch() {
    console.log('App Launch')
    // 集中初始化 store 数据
    const eventStore = useEventStore()
    const eventTypeStore = useEventTypeStore()
    eventStore.loadFromStorage()
    eventTypeStore.loadFromStorage()
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  }
}
</script>
```

- [ ] **Step 2: 移除 index.vue 中的重复加载**

修改 `src/pages/index/index.vue`，移除 onMounted 中的 store 加载：

```typescript
// 修改前
onMounted(() => {
  eventStore.loadFromStorage()
  eventTypeStore.loadFromStorage()
})

// 修改后 - 移除或改为空
onMounted(() => {
  // Store 已在 App.vue onLaunch 中初始化
})
```

可以直接删除 onMounted 钩子：

```typescript
import { ref } from 'vue'
// 移除 onMounted import
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
// ... 其他 imports

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()

const showEventForm = ref(false)

// 移除 onMounted 钩子

function onEventSaved() {
  showEventForm.value = false
}
```

- [ ] **Step 3: 移除 stats.vue 中的重复加载**

修改 `src/pages/stats/stats.vue`，移除 onMounted 中的 store 加载：

```typescript
// 修改前
onMounted(() => {
  eventStore.loadFromStorage()
  eventTypeStore.loadFromStorage()
})

// 修改后 - 移除或改为空
// 可以直接删除 onMounted 针子和 onMounted import
```

修改 imports：

```typescript
import { computed } from 'vue'
// 移除 onMounted import
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import CustomTabBar from '@/components/CustomTabBar.vue'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()

// 移除 onMounted 钩子

const totalCount = computed(() => eventStore.totalCount)
// ... 其他代码保持不变
```

- [ ] **Step 4: 提交 store 初始化集中化**

```bash
git add src/App.vue src/pages/index/index.vue src/pages/stats/stats.vue
git commit -m "perf: centralize store initialization in App.vue onLaunch"
```

---

### Task 10: 组件懒加载（条件渲染优化）

**Files:**
- Modify: `src/pages/index/index.vue:36-41`

- [ ] **Step 1: 确认 EventForm 已使用条件渲染**

检查 `src/pages/index/index.vue` 的 EventForm 部分：

```vue
<!-- Event form popup - 已使用 v-if 条件渲染 -->
<EventForm
  v-if="showEventForm"
  :visible="showEventForm"
  @close="showEventForm = false"
  @save="onEventSaved"
/>
```

确认已经是 `v-if="showEventForm"`（当前代码已正确）。

- [ ] **Step 2: 无需修改，跳过此步骤**

EventForm 组件已经使用条件渲染。FilterBar 组件始终显示，不需要懒加载。

- [ ] **Step 3: 标记组件懒加载检查完成**

组件已正确使用条件渲染，无需额外修改。

---

### Task 11: Phase 3 功能验证

**Files:**
- 无文件修改，运行验证

- [ ] **Step 1: 运行 H5 开发服务器验证资源优化**

```bash
npm run dev:h5
```

验证：
1. 应用正常启动
2. 字体图标正常显示
3. 页面切换数据正常

- [ ] **Step 2: 检查 store 初始化只执行一次**

在浏览器控制台观察：
- 首次加载时 `loadFromStorage` 只执行一次
- 切换页面时不再重复执行

可在 store 的 loadFromStorage 中添加临时 console.log 验证：

```typescript
loadFromStorage(): void {
  if (this.isLoaded) {
    console.log('Store already loaded, skipping')
    return
  }
  console.log('Loading store from storage...')
  // ... 原有逻辑
}
```

- [ ] **Step 3: Phase 3 完成标记**

Phase 3 资源与加载优化完成。

---

## Phase 4: 构建优化

### Task 12: 安装 Bundle 分析器

**Files:**
- Modify: `package.json:devDependencies`
- Modify: `vite.config.ts`

- [ ] **Step 1: 安装 rollup-plugin-visualizer**

```bash
npm install -D rollup-plugin-visualizer
```

- [ ] **Step 2: 在 vite.config.ts 中添加分析器插件**

修改 `vite.config.ts`：

```typescript
import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
    // Bundle 分析器（仅在需要时启用）
    visualizer({
      filename: 'stats.html',
      gzipSize: true,
      brotliSize: true,
      open: false // 设置为 true 可在构建后自动打开
    })
  ],
  // uview-plus 需要配置 transpileDependencies
  build: {
    transpile: ['uview-plus']
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: ['import', 'legacy-js-api']
      }
    }
  }
});
```

- [ ] **Step 3: 提交构建配置更新**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "perf: add rollup-plugin-visualizer for bundle analysis"
```

---

### Task 13: 执行生产构建分析

**Files:**
- 无文件修改，运行构建

- [ ] **Step 1: 执行 H5 生产构建**

```bash
npm run build:h5
```

- [ ] **Step 2: 打开生成的 stats.html 分析**

构建完成后，打开 `stats.html` 文件分析：

```bash
open stats.html
# 或在浏览器中直接打开
```

检查：
1. uview-plus 的 tree-shaking 效果
2. 主要包体积分布
3. 是否有意外的大依赖

- [ ] **Step 3: 记录构建结果**

记录构建产物大小，用于对比优化效果：

- 当前生产构建大小（从 `dist/build/h5/` 目录查看）
- 主要依赖体积占比

---

### Task 14: 最终验证与清理

**Files:**
- 无文件修改，全面验证

- [ ] **Step 1: 类型检查**

```bash
npm run type-check
```

确保无 TypeScript 类型错误。

- [ ] **Step 2: H5 端完整功能测试**

启动开发服务器，测试所有功能：

```bash
npm run dev:h5
```

测试清单：
1. 首页列表显示和滚动
2. 添加新事件
3. 删除事件（滑动删除）
4. 类型过滤和时间范围过滤
5. 统计页面数据正确
6. 页面切换流畅

- [ ] **Step 3: 模拟 2000+ 数据量性能测试**

在控制台批量添加测试数据：

```javascript
// 创建 2000 条测试事件
const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()
const typeId = eventTypeStore.types[0]?.id || ''

for (let i = 0; i < 2000; i++) {
  eventStore.events.push({
    id: `perf_test_${i}`,
    name: `性能测试事件 ${i}`,
    typeId: typeId,
    time: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // 随机时间
    createdAt: Date.now() - i * 1000
  })
}
eventStore.saveToStorage()
```

验证：
- 列表滚动流畅度
- 过滤操作响应速度
- 统计页面渲染速度

- [ ] **Step 4: 清理测试数据**

测试完成后，清理添加的测试数据（或在真机上使用真实数据测试）。

- [ ] **Step 5: 提交最终优化完成**

如果所有测试通过：

```bash
git status
# 确认无未提交的修改
git log --oneline -10
# 查看优化相关的提交记录
```

---

## Summary

### 预期成果

| 优化项 | 预期效果 |
|--------|----------|
| Store 过滤缓存 | 过滤操作响应时间 < 100ms |
| recentDaysStats 优化 | 统计计算时间降低 70% |
| isLoaded 状态 | 消除重复存储读取 |
| 虚拟滚动 | 2000+ 数据滚动帧率 > 50fps |
| 颜色缓存 | 渲染时间降低 |
| 字体预连接 | 首屏加载时间降低 |
| Store 集中初始化 | 页面切换更流畅 |

### 验证指标

- 列表渲染：2000 条数据滚动帧率 > 50fps
- 首屏加载：H5 Lighthouse Performance > 80
- 过滤操作：切换过滤类型响应时间 < 100ms
- 包体积：生产构建 < 600KB