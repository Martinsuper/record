# 记录时光应用性能优化设计文档

**日期**: 2026-03-30
**项目**: uni-app (Vue 3 + Vite) 事件追踪移动应用
**目标数据量**: > 2000 条事件记录
**平台**: H5 网页 + 微信小程序

---

## 问题分析

### 当前性能瓶颈

| 优先级 | 问题 | 位置 | 影响 |
|--------|------|------|------|
| 高 | 无虚拟滚动 | EventList.vue | DOM 元素过多，内存占用高 |
| 高 | 颜色计算无缓存 | EventList.vue | 每次渲染重复计算渐变 |
| 高 | 外部字体 CDN | index.html | 阻塞首屏加载 |
| 中 | Store 重复加载 | index.vue, stats.vue | 页面切换重复读取存储 |
| 中 | 过滤/排序未缓存 | event.ts | O(n log n) 每次访问 |
| 低 | 组件未懒加载 | 多个页面 | 初始包体积大 |

---

## 优化策略

采用**渐进式优化**方案，按优先级分阶段实施：

1. **数据层优化** → 2. **渲染层优化** → 3. **资源优化** → 4. **构建优化**

每个阶段独立可验证，降低风险。

---

## 第一阶段：数据层优化

### 1.1 Store 过滤缓存

**文件**: `src/store/event.ts`

**当前代码问题**:
```typescript
filteredEvents: (state): EventData[] => {
  let result = [...state.events]  // 每次创建新数组
  if (state.filterType) {
    result = result.filter(...)    // 过滤操作
  }
  result = filterByTimeRange(...)  // 时间范围过滤
  result.sort((a, b) => b.time - a.time)  // O(n log n) 排序
  return result
}
```

**优化方案**:

引入响应式缓存机制：
- 添加 `_filteredEventsCache` 和 `_cacheKey` 状态
- cacheKey 由 `filterType-filterTimeRange-events.length` 组成
- 仅当 cacheKey 变化时重新计算

```typescript
state: {
  events: [],
  filterType: null,
  filterTimeRange: 'all',
  _filteredEventsCache: null as EventData[] | null,
  _cacheKey: ''
}

getters: {
  filteredEvents: (state) => {
    const cacheKey = `${state.filterType}-${state.filterTimeRange}-${state.events.length}-${state.events[state.events.length-1]?.time || 0}`
    if (state._cacheKey === cacheKey && state._filteredEventsCache) {
      return state._filteredEventsCache
    }
    // 计算并缓存
    let result = [...state.events]
    if (state.filterType) {
      result = result.filter(event => event.typeId === state.filterType)
    }
    result = filterByTimeRange(result, state.filterTimeRange)
    result.sort((a, b) => b.time - a.time)
    state._filteredEventsCache = result
    state._cacheKey = cacheKey
    return result
  }
}
```

### 1.2 recentDaysStats 优化

**当前**: O(7n) - 每天单独遍历所有事件

**优化**: 单次遍历计算所有天数统计

```typescript
recentDaysStats: (state) => {
  const recentDays = getRecentDays(7)
  const counts = new Map<string, number>()

  // 单次遍历
  state.events.forEach(event => {
    const eventDay = recentDays.find(day =>
      event.time >= day.timestamp && event.time < day.timestamp + 24 * 60 * 60 * 1000
    )
    if (eventDay) {
      counts.set(eventDay.date, (counts.get(eventDay.date) || 0) + 1)
    }
  })

  return recentDays.map(day => ({
    date: day.date,
    count: counts.get(day.date) || 0
  }))
}
```

### 1.3 添加 isLoaded 状态

防止重复加载存储数据：

```typescript
state: {
  isLoaded: false,
  // ...
}

actions: {
  loadFromStorage() {
    if (this.isLoaded) return
    // 加载逻辑
    this.isLoaded = true
  }
}
```

---

## 第二阶段：渲染层优化

### 2.1 虚拟滚动实现

**文件**: `src/components/EventList.vue`

**设计要点**:
- 仅渲染可视区域 + 缓冲区的项目
- 使用固定卡片高度（约 120px + 间距 = 140px）
- 计算可视范围：`startIndex` 到 `endIndex`
- 小程序使用 `scroll-view`，H5 使用普通滚动

**核心代码结构**:

```vue
<template>
  <scroll-view
    scroll-y
    :style="{ height: containerHeight + 'px' }"
    @scroll="onScroll"
  >
    <view :style="{ height: totalHeight + 'px', position: 'relative' }">
      <view
        v-for="event in visibleEvents"
        :key="event.id"
        class="event-card-wrapper"
        :style="{ position: 'absolute', top: getEventOffset(event._index) + 'px' }"
      >
        <!-- 卡片内容保持不变 -->
      </view>
    </view>
  </scroll-view>
</template>

<script setup>
const ITEM_HEIGHT = 140 // 卡片高度 + 间距
const BUFFER_SIZE = 5   // 上下缓冲项目数

const scrollTop = ref(0)
const containerHeight = ref(600) // 根据屏幕高度计算

const visibleRange = computed(() => {
  const startIndex = Math.max(0, Math.floor(scrollTop.value / ITEM_HEIGHT) - BUFFER_SIZE)
  const visibleCount = Math.ceil(containerHeight.value / ITEM_HEIGHT) + 2 * BUFFER_SIZE
  const endIndex = Math.min(filteredEvents.length, startIndex + visibleCount)
  return { startIndex, endIndex }
})

const visibleEvents = computed(() => {
  return filteredEvents.slice(visibleRange.value.startIndex, visibleRange.value.endIndex)
    .map((event, i) => ({ ...event, _index: visibleRange.value.startIndex + i }))
})

const totalHeight = computed(() => filteredEvents.length * ITEM_HEIGHT)

function getEventOffset(index: number) {
  return index * ITEM_HEIGHT
}

function onScroll(e: any) {
  scrollTop.value = e.detail.scrollTop
}
</script>
```

### 2.2 颜色计算缓存

**当前问题**: `getTypeGradient(event.typeId)` 在模板中每次渲染都重新计算

**优化方案**: 使用 `computed` 创建类型颜色映射

```typescript
const typeColorMap = computed(() => {
  const map = new Map<string, { gradient: string, textColor: string }>()
  eventTypeStore.types.forEach(type => {
    map.set(type.id, {
      gradient: getTypeGradient(type.color),
      textColor: getContrastColor(type.color)
    })
  })
  return map
})

// 模板中使用
:style="{ background: typeColorMap.get(event.typeId)?.gradient }"
```

---

## 第三阶段：资源与加载优化

### 3.1 字体本地化

**当前**: Font Awesome 6.5.1 从 CDN 加载

**优化**:
1. 下载 Font Awesome 核心图标集（solid 样式）到 `src/static/fonts/`
2. 修改 `index.html`:
   ```html
   <!-- 移除 CDN，使用本地字体 -->
   <link rel="stylesheet" href="/static/fonts/fontawesome.min.css">
   ```
3. 添加 `font-display: swap` 确保文本立即可见

### 3.2 Store 初始化集中化

**文件**: `src/App.vue`

将 store 初始化移到应用启动阶段：

```typescript
onLaunch(() => {
  // 初始化屏幕高度等全局状态
  const systemInfo = uni.getSystemInfoSync()
  containerHeight.value = systemInfo.windowHeight - TAB_BAR_HEIGHT

  // 集中加载 store 数据
  eventStore.loadFromStorage()
  eventTypeStore.loadFromStorage()
})
```

移除各页面 `onMounted` 中的重复加载调用。

### 3.3 组件懒加载

**目标组件**: `EventForm.vue`、`FilterBar.vue`（弹窗/抽屉类）

使用条件渲染而非异步组件（uni-app 兼容性更好）：

```vue
<template>
  <!-- 仅在打开时渲染 -->
  <EventForm v-if="showEventForm" @close="showEventForm = false" />
  <FilterBar v-if="showFilterBar" @close="showFilterBar = false" />
</template>
```

---

## 第四阶段：构建优化

### 4.1 Bundle 分析

添加 `rollup-plugin-visualizer` 分析构建产物：

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

plugins: [
  visualizer({
    filename: 'stats.html',
    gzipSize: true,
    brotliSize: true
  })
]
```

运行 `npm run build` 后打开 `stats.html` 分析：
- uview-plus tree-shaking 效果
- 大体积依赖识别
- 优化导入策略

### 4.2 大组件拆分（可选）

如 Bundle 分析发现问题组件：

| 组件 | 当前行数 | 拆分建议 |
|------|----------|----------|
| TypePicker.vue | 590 | TypePickerHeader + TypePickerList |
| stats.vue | 423 | StatsHeader + StatCard + RecentChart |

---

## 验证方案

每个阶段完成后：

1. **功能测试**: 确认所有功能正常工作
2. **平台测试**: H5 和小程序两端分别验证
3. **性能验证**:
   - H5: Chrome DevTools Performance 和 Lighthouse
   - 小程序: 微信开发者工具性能面板
4. **回归测试**: 确保 2000+ 数据量下流畅运行

---

## 实施顺序

```
阶段 1: 数据层优化
  └── 1.1 Store 过滤缓存
  └── 1.2 recentDaysStats 优化
  └── 1.3 isLoaded 状态
  └── 验证

阶段 2: 渲染层优化
  └── 2.1 虚拟滚动实现
  └── 2.2 颜色计算缓存
  └── 验证

阶段 3: 资源优化
  └── 3.1 字体本地化
  └── 3.2 Store 初始化集中化
  └── 3.3 组件懒加载
  └── 验证

阶段 4: 构建优化
  └── 4.1 Bundle 分析
  └── 4.2 组件拆分（按需）
  └── 最终验证
```

---

## 风险与应对

| 风险 | 应对措施 |
|------|----------|
| 虚拟滚动跨平台兼容性 | 分别测试 H5 scroll 和小程序 scroll-view |
| 缓存导致数据不一致 | 使用 events.length 和最新时间戳作为 cacheKey |
| 字体本地化包体积增加 | 仅保留核心图标，删除未使用样式 |

---

## 成功指标

- **列表渲染**: 2000 条数据滚动帧率 > 50fps
- **首屏加载**: H5 Lighthouse Performance > 80
- **过滤操作**: 切换过滤类型响应时间 < 100ms
- **包体积**: 生产构建 < 600KB（当前 592KB）