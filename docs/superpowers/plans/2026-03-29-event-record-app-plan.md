# 事件记录 UniApp 应用实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个支持 H5 和小程序的事件记录纯前端应用，用户可快速记录事件、时间和自定义类型。

**Architecture:** 单页应用 + 浮层操作模式，Pinia 状态管理，uView UI 组件库，uni.storage 本地持久化。

**Tech Stack:** UniApp (Vue3) + uView UI 2.x + Pinia + SCSS

---

## 文件结构规划

| 文件路径 | 负责内容 |
|----------|----------|
| `src/main.js` | 应用入口，配置 Pinia 和 uView |
| `src/App.vue` | 应用根组件 |
| `src/pages.json` | 页面路由和 tabBar 配置 |
| `src/pages/index/index.vue` | 主页：事件列表 + 添加浮层 |
| `src/pages/stats/stats.vue` | 统计页：概览 + 类型分布 + 趋势 |
| `src/components/EventList.vue` | 事件卡片列表，支持左滑删除 |
| `src/components/EventForm.vue` | 添加事件弹出表单 |
| `src/components/TypePicker.vue` | 类型选择器 + 新建类型功能 |
| `src/components/FilterBar.vue` | 顶部筛选器（类型 + 时间范围） |
| `src/store/event.js` | 事件数据 Pinia store |
| `src/store/eventType.js` | 事件类型 Pinia store |
| `src/utils/storage.js` | uni.storage 封装工具 |
| `src/utils/time.js` | 时间格式化工具函数 |
| `src/static/images/` | 图标等静态资源 |
| `src/uni.scss` | 全局样式变量 |

---

## Task 1: 创建 UniApp 项目并初始化

**Files:**
- Create: 项目根目录结构

- [ ] **Step 1: 使用 HBuilderX 或 CLI 创建 UniApp Vue3 项目**

打开 HBuilderX，选择「新建项目」→「uni-app」→「默认模板(Vue3)」，项目名称为 `event-record`，保存到 `/Users/duanluyao/code/record`。

或使用 CLI：
```bash
npx degit dcloudio/uni-preset-vue#vite-ts /Users/duanluyao/code/record
```

- [ ] **Step 2: 验证项目结构**

```bash
ls -la /Users/duanluyao/code/record/src
```

预期输出包含：`pages/`, `static/`, `main.js`, `App.vue`, `pages.json`

- [ ] **Step 3: 创建必要的目录结构**

```bash
cd /Users/duanluyao/code/record/src
mkdir -p components store utils pages/index pages/stats static/images
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: initialize UniApp project structure

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: 安装依赖 (uView UI + Pinia)

**Files:**
- Modify: `package.json`
- Modify: `src/main.js`

- [ ] **Step 1: 安装 Pinia**

```bash
cd /Users/duanluyao/code/record
npm install pinia
```

- [ ] **Step 2: 安装 uView UI (u-view-plus)**

```bash
npm install u-view-plus
```

- [ ] **Step 3: 配置 main.js 引入 Pinia 和 uView**

创建或修改 `src/main.js`：

```javascript
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import uView from 'u-view-plus'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(uView)

  return {
    app,
    pinia
  }
}
```

- [ ] **Step 4: 在 uni.scss 中引入 uView 样式变量**

修改 `src/uni.scss`，添加：

```scss
/* uView UI 样式变量 */
@import 'u-view-plus/theme.scss';

/* 自定义变量 */
$primary-color: #2979ff;
$bg-color: #ffffff;
$card-bg: #f8f8f8;
$text-main: #333333;
$text-secondary: #999999;
$border-color: #e4e7ed;
$radius-card: 8px;
$radius-btn: 4px;
$spacing-base: 16px;
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/main.js src/uni.scss
git commit -m "feat: install and configure Pinia and uView UI

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: 配置 pages.json 页面路由和 tabBar

**Files:**
- Modify: `src/pages.json`

- [ ] **Step 1: 配置页面路由和底部 tabBar**

修改 `src/pages.json`：

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "我的事件记录",
        "navigationBarBackgroundColor": "#ffffff",
        "navigationBarTextStyle": "black"
      }
    },
    {
      "path": "pages/stats/stats",
      "style": {
        "navigationBarTitleText": "统计概览",
        "navigationBarBackgroundColor": "#ffffff",
        "navigationBarTextStyle": "black"
      }
    }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "事件记录",
    "navigationBarBackgroundColor": "#ffffff",
    "backgroundColor": "#f8f8f8"
  },
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#2979ff",
    "borderStyle": "black",
    "backgroundColor": "#ffffff",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "事件列表",
        "iconPath": "static/images/list.png",
        "selectedIconPath": "static/images/list-active.png"
      },
      {
        "pagePath": "pages/stats/stats",
        "text": "统计",
        "iconPath": "static/images/stats.png",
        "selectedIconPath": "static/images/stats-active.png"
      }
    ]
  }
}
```

- [ ] **Step 2: 创建 tabBar 图标占位文件**

由于图标需要设计，暂时使用占位方式。创建简单的 SVG 图标：

创建 `src/static/images/list.svg`（普通状态）：
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999999" stroke-width="2">
  <line x1="8" y1="6" x2="21" y2="6"></line>
  <line x1="8" y1="12" x2="21" y2="12"></line>
  <line x1="8" y1="18" x2="21" y2="18"></line>
  <line x1="3" y1="6" x2="3.01" y2="6"></line>
  <line x1="3" y1="12" x2="3.01" y2="12"></line>
  <line x1="3" y1="18" x2="3.01" y2="18"></line>
</svg>
```

创建 `src/static/images/list-active.svg`（选中状态）：
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2979ff" stroke-width="2">
  <line x1="8" y1="6" x2="21" y2="6"></line>
  <line x1="8" y1="12" x2="21" y2="12"></line>
  <line x1="8" y1="18" x2="21" y2="18"></line>
  <line x1="3" y1="6" x2="3.01" y2="6"></line>
  <line x1="3" y1="12" x2="3.01" y2="12"></line>
  <line x1="3" y1="18" x2="3.01" y2="18"></line>
</svg>
```

创建 `src/static/images/stats.svg`：
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999999" stroke-width="2">
  <line x1="18" y1="20" x2="18" y2="14"></line>
  <line x1="12" y1="20" x2="12" y2="8"></line>
  <line x1="6" y1="20" x2="6" y2="16"></line>
</svg>
```

创建 `src/static/images/stats-active.svg`：
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2979ff" stroke-width="2">
  <line x1="18" y1="20" x2="18" y2="14"></line>
  <line x1="12" y1="20" x2="12" y2="8"></line>
  <line x1="6" y1="20" x2="6" y2="16"></line>
</svg>
```

注意：小程序 tabBar 图标不支持 SVG，需转换为 PNG。可使用在线工具或暂时用 PNG 占位图。

- [ ] **Step 3: 创建 PNG 图标占位**

如果需要 PNG 图标，可使用简单方式生成或暂时使用 base64 编码的小图标。建议使用设计工具创建 24x24 的 PNG 图标。

- [ ] **Step 4: Commit**

```bash
git add src/pages.json src/static/images/
git commit -m "feat: configure pages and tabBar navigation

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: 创建存储工具 utils/storage.js

**Files:**
- Create: `src/utils/storage.js`

- [ ] **Step 1: 创建 storage 封装工具**

创建 `src/utils/storage.js`：

```javascript
/**
 * 本地存储封装工具
 * 基于 uni.storage API
 */

const STORAGE_KEYS = {
  EVENTS: 'events',
  EVENT_TYPES: 'eventTypes'
}

/**
 * 获取存储数据
 * @param {string} key 存储键名
 * @returns {any} 存储的数据，不存在返回 null
 */
export function getStorage(key) {
  try {
    const value = uni.getStorageSync(key)
    return value || null
  } catch (e) {
    console.error('getStorage error:', e)
    return null
  }
}

/**
 * 设置存储数据
 * @param {string} key 存储键名
 * @param {any} value 要存储的数据
 */
export function setStorage(key, value) {
  try {
    uni.setStorageSync(key, value)
  } catch (e) {
    console.error('setStorage error:', e)
  }
}

/**
 * 删除存储数据
 * @param {string} key 存储键名
 */
export function removeStorage(key) {
  try {
    uni.removeStorageSync(key)
  } catch (e) {
    console.error('removeStorage error:', e)
  }
}

/**
 * 清除所有存储数据
 */
export function clearAllStorage() {
  try {
    uni.clearStorageSync()
  } catch (e) {
    console.error('clearAllStorage error:', e)
  }
}

/**
 * 获取事件列表
 * @returns {Array} 事件数组
 */
export function getEvents() {
  return getStorage(STORAGE_KEYS.EVENTS) || []
}

/**
 * 保存事件列表
 * @param {Array} events 事件数组
 */
export function saveEvents(events) {
  setStorage(STORAGE_KEYS.EVENTS, events)
}

/**
 * 获取事件类型列表
 * @returns {Array} 类型数组
 */
export function getEventTypes() {
  return getStorage(STORAGE_KEYS.EVENT_TYPES) || []
}

/**
 * 保存事件类型列表
 * @param {Array} types 类型数组
 */
export function saveEventTypes(types) {
  setStorage(STORAGE_KEYS.EVENT_TYPES, types)
}

export { STORAGE_KEYS }
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/storage.js
git commit -m "feat: add storage utility for local persistence

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: 创建时间工具 utils/time.js

**Files:**
- Create: `src/utils/time.js`

- [ ] **Step 1: 创建时间格式化工具**

创建 `src/utils/time.js`：

```javascript
/**
 * 时间格式化工具
 */

/**
 * 格式化日期时间
 * @param {number|Date} timestamp 时间戳(ms) 或 Date 对象
 * @param {string} format 格式模板，默认 'YYYY-MM-DD HH:mm'
 * @returns {string} 格式化后的字符串
 */
export function formatTime(timestamp, format = 'YYYY-MM-DD HH:mm') {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp)

  if (isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 获取今天的开始时间戳
 * @returns {number} 今天 00:00:00 的时间戳(ms)
 */
export function getTodayStart() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today.getTime()
}

/**
 * 获取本周开始时间戳（周一）
 * @returns {number} 本周一 00:00:00 的时间戳(ms)
 */
export function getWeekStart() {
  const today = new Date()
  const dayOfWeek = today.getDay() || 7
  today.setHours(0, 0, 0, 0)
  today.setDate(today.getDate() - dayOfWeek + 1)
  return today.getTime()
}

/**
 * 获取本月开始时间戳
 * @returns {number} 本月 1 日 00:00:00 的时间戳(ms)
 */
export function getMonthStart() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  today.setDate(1)
  return today.getTime()
}

/**
 * 根据时间范围筛选事件
 * @param {Array} events 事件列表
 * @param {string} range 范围类型: 'all', 'today', 'week', 'month'
 * @returns {Array} 筛选后的事件列表
 */
export function filterByTimeRange(events, range) {
  if (range === 'all') {
    return events
  }

  let startTime
  switch (range) {
    case 'today':
      startTime = getTodayStart()
      break
    case 'week':
      startTime = getWeekStart()
      break
    case 'month':
      startTime = getMonthStart()
      break
    default:
      return events
  }

  return events.filter(event => event.time >= startTime)
}

/**
 * 获取近 N 天的日期列表
 * @param {number} n 天数
 * @returns {Array<{date: string, timestamp: number}>} 日期列表
 */
export function getRecentDays(n = 7) {
  const result = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    result.push({
      date: formatTime(date, 'MM-DD'),
      timestamp: date.getTime(),
      label: i === 0 ? '今天' : i === 1 ? '昨天' : formatTime(date, 'MM-DD')
    })
  }

  return result
}

/**
 * 检查时间戳是否在指定日期内
 * @param {number} timestamp 时间戳(ms)
 * @param {number} dateTimestamp 日期开始时间戳(ms)
 * @returns {boolean}
 */
export function isSameDay(timestamp, dateTimestamp) {
  const dateEnd = dateTimestamp + 24 * 60 * 60 * 1000
  return timestamp >= dateTimestamp && timestamp < dateEnd
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/time.js
git commit -m "feat: add time utility for formatting and filtering

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: 创建 EventType Store

**Files:**
- Create: `src/store/eventType.js`

- [ ] **Step 1: 创建事件类型 Pinia store**

创建 `src/store/eventType.js`：

```javascript
import { defineStore } from 'pinia'
import { getEventTypes, saveEventTypes } from '@/utils/storage'

/**
 * 事件类型状态管理
 */
export const useEventTypeStore = defineStore('eventType', {
  state: () => ({
    types: []
  }),

  getters: {
    /**
     * 获取类型数量
     */
    typeCount: (state) => state.types.length,

    /**
     * 根据 ID 获取类型
     */
    getTypeById: (state) => (id) => {
      return state.types.find(t => t.id === id) || null
    },

    /**
     * 获取类型名称
     */
    getTypeName: (state) => (id) => {
      const type = state.types.find(t => t.id === id)
      return type ? type.name : '未分类'
    },

    /**
     * 获取类型颜色
     */
    getTypeColor: (state) => (id) => {
      const type = state.types.find(t => t.id === id)
      return type ? type.color : '#999999'
    },

    /**
     * 类型选项列表（用于 picker）
     */
    typeOptions: (state) => {
      return state.types.map(t => ({
        value: t.id,
        label: t.name,
        color: t.color
      }))
    }
  },

  actions: {
    /**
     * 从本地存储加载类型
     */
    loadFromStorage() {
      this.types = getEventTypes()
    },

    /**
     * 保存到本地存储
     */
    saveToStorage() {
      saveEventTypes(this.types)
    },

    /**
     * 添加新类型
     * @param {Object} type 类型对象 { name, color }
     * @returns {Object} 创建的类型对象
     */
    addType(type) {
      const newType = {
        id: `type_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: type.name,
        color: type.color,
        createdAt: Date.now()
      }
      this.types.push(newType)
      this.saveToStorage()
      return newType
    },

    /**
     * 删除类型
     * @param {string} id 类型 ID
     * @returns {boolean} 是否成功删除
     */
    deleteType(id) {
      const index = this.types.findIndex(t => t.id === id)
      if (index > -1) {
        this.types.splice(index, 1)
        this.saveToStorage()
        return true
      }
      return false
    },

    /**
     * 更新类型
     * @param {string} id 类型 ID
     * @param {Object} data 更新数据 { name?, color? }
     */
    updateType(id, data) {
      const type = this.types.find(t => t.id === id)
      if (type) {
        if (data.name) type.name = data.name
        if (data.color) type.color = data.color
        this.saveToStorage()
      }
    }
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add src/store/eventType.js
git commit -m "feat: add eventType Pinia store

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: 创建 Event Store

**Files:**
- Create: `src/store/event.js`

- [ ] **Step 1: 创建事件 Pinia store**

创建 `src/store/event.js`：

```javascript
import { defineStore } from 'pinia'
import { getEvents, saveEvents } from '@/utils/storage'
import { filterByTimeRange } from '@/utils/time'

/**
 * 事件状态管理
 */
export const useEventStore = defineStore('event', {
  state: () => ({
    events: [],
    filterType: null,      // 筛选类型 ID (null = 全部)
    filterTimeRange: 'all' // 筛选时间范围: all, today, week, month
  }),

  getters: {
    /**
     * 筛选后的事件列表（按时间倒序）
     */
    filteredEvents: (state) => {
      let result = state.events

      // 按类型筛选
      if (state.filterType) {
        result = result.filter(e => e.typeId === state.filterType)
      }

      // 按时间范围筛选
      result = filterByTimeRange(result, state.filterTimeRange)

      // 按时间倒序排列
      return result.sort((a, b) => b.time - a.time)
    },

    /**
     * 总事件数
     */
    totalCount: (state) => state.events.length,

    /**
     * 本月事件数
     */
    monthCount: (state) => {
      const monthStart = new Date()
      monthStart.setHours(0, 0, 0, 0)
      monthStart.setDate(1)
      return state.events.filter(e => e.time >= monthStart.getTime()).length
    },

    /**
     * 按类型统计
     */
    statsByType: (state) => {
      const stats = {}
      state.events.forEach(event => {
        const typeId = event.typeId || 'uncategorized'
        stats[typeId] = (stats[typeId] || 0) + 1
      })
      return stats
    },

    /**
     * 近 7 天事件统计
     */
    recentDaysStats: (state) => {
      const result = []
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(today)
        dayStart.setDate(dayStart.getDate() - i)
        const dayEnd = new Date(dayStart)
        dayEnd.setDate(dayEnd.getDate() + 1)

        const count = state.events.filter(e =>
          e.time >= dayStart.getTime() && e.time < dayEnd.getTime()
        ).length

        result.push({
          date: dayStart.getTime(),
          count
        })
      }

      return result
    }
  },

  actions: {
    /**
     * 从本地存储加载事件
     */
    loadFromStorage() {
      this.events = getEvents()
    },

    /**
     * 保存到本地存储
     */
    saveToStorage() {
      saveEvents(this.events)
    },

    /**
     * 添加新事件
     * @param {Object} event 事件对象 { name, typeId, time }
     * @returns {Object} 创建的事件对象
     */
    addEvent(event) {
      const newEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: event.name,
        typeId: event.typeId,
        time: event.time,
        createdAt: Date.now()
      }
      this.events.push(newEvent)
      this.saveToStorage()
      return newEvent
    },

    /**
     * 删除事件
     * @param {string} id 事件 ID
     * @returns {boolean} 是否成功删除
     */
    deleteEvent(id) {
      const index = this.events.findIndex(e => e.id === id)
      if (index > -1) {
        this.events.splice(index, 1)
        this.saveToStorage()
        return true
      }
      return false
    },

    /**
     * 设置类型筛选
     * @param {string|null} typeId 类型 ID
     */
    setFilterType(typeId) {
      this.filterType = typeId
    },

    /**
     * 设置时间范围筛选
     * @param {string} range 范围值: all, today, week, month
     */
    setFilterTimeRange(range) {
      this.filterTimeRange = range
    },

    /**
     * 清除所有筛选
     */
    clearFilters() {
      this.filterType = null
      this.filterTimeRange = 'all'
    }
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add src/store/event.js
git commit -m "feat: add event Pinia store with filtering and stats

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: 创建 FilterBar 组件

**Files:**
- Create: `src/components/FilterBar.vue`

- [ ] **Step 1: 创建筛选器组件**

创建 `src/components/FilterBar.vue`：

```vue
<template>
  <view class="filter-bar">
    <view class="filter-item">
      <u-dropdown ref="typeDropdown" :title="typeTitle" @change="onTypeChange">
        <u-dropdown-item :title="'全部类型'" :value="null" />
        <u-dropdown-item
          v-for="type in typeOptions"
          :key="type.value"
          :title="type.label"
          :value="type.value"
        />
      </u-dropdown>
    </view>

    <view class="filter-item">
      <u-dropdown ref="timeDropdown" :title="timeTitle" @change="onTimeChange">
        <u-dropdown-item title="全部" value="all" />
        <u-dropdown-item title="今天" value="today" />
        <u-dropdown-item title="本周" value="week" />
        <u-dropdown-item title="本月" value="month" />
      </u-dropdown>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useEventTypeStore } from '@/store/eventType'
import { useEventStore } from '@/store/event'

const eventTypeStore = useEventTypeStore()
const eventStore = useEventStore()

const typeDropdown = ref(null)
const timeDropdown = ref(null)

const typeOptions = computed(() => eventTypeStore.typeOptions)

const typeTitle = computed(() => {
  if (!eventStore.filterType) return '全部类型'
  const type = eventTypeStore.getTypeById(eventStore.filterType)
  return type ? type.name : '全部类型'
})

const timeTitle = computed(() => {
  const titles = {
    all: '全部',
    today: '今天',
    week: '本周',
    month: '本月'
  }
  return titles[eventStore.filterTimeRange] || '全部'
})

function onTypeChange(value) {
  eventStore.setFilterType(value)
}

function onTimeChange(value) {
  eventStore.setFilterTimeRange(value)
}
</script>

<style lang="scss" scoped>
.filter-bar {
  display: flex;
  padding: 12px 16px;
  background-color: $bg-color;
  border-bottom: 1px solid $border-color;

  .filter-item {
    flex: 1;
    margin-right: 16px;

    &:last-child {
      margin-right: 0;
    }
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FilterBar.vue
git commit -m "feat: add FilterBar component for type and time filtering

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: 创建 EventList 组件（基础版）

**Files:**
- Create: `src/components/EventList.vue`

- [ ] **Step 1: 创建事件列表组件（基础显示）**

创建 `src/components/EventList.vue`：

```vue
<template>
  <view class="event-list">
    <!-- 空状态 -->
    <view v-if="filteredEvents.length === 0" class="empty-state">
      <u-empty text="暂无事件记录" mode="list" />
    </view>

    <!-- 事件列表 -->
    <view v-else class="list-content">
      <u-swipe-action
        v-for="event in filteredEvents"
        :key="event.id"
        :options="swipeOptions"
        @click="onSwipeClick($event, event.id)"
      >
        <view class="event-card">
          <view class="event-header">
            <view
              class="type-tag"
              :style="{ backgroundColor: getTypeColor(event.typeId) }"
            >
              {{ getTypeName(event.typeId) }}
            </view>
            <text class="event-name">{{ event.name }}</text>
          </view>
          <view class="event-time">
            {{ formatTime(event.time) }}
          </view>
        </view>
      </u-swipe-action>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import { formatTime } from '@/utils/time'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()

const filteredEvents = computed(() => eventStore.filteredEvents)

const swipeOptions = [
  {
    text: '删除',
    style: {
      backgroundColor: '#ff4d4f'
    }
  }
]

function getTypeName(typeId) {
  return eventTypeStore.getTypeName(typeId)
}

function getTypeColor(typeId) {
  return eventTypeStore.getTypeColor(typeId)
}

function onSwipeClick(index, eventId) {
  if (index === 0) {
    // 触发删除确认
    uni.showModal({
      title: '确认删除',
      content: '确定要删除这条事件记录吗？',
      success: (res) => {
        if (res.confirm) {
          eventStore.deleteEvent(eventId)
          uni.showToast({
            title: '已删除',
            icon: 'success'
          })
        }
      }
    })
  }
}
</script>

<style lang="scss" scoped>
.event-list {
  padding: 16px;
  min-height: calc(100vh - 200px);

  .empty-state {
    display: flex;
    justify-content: center;
    padding: 60px 0;
  }

  .list-content {
    .event-card {
      background-color: $card-bg;
      border-radius: $radius-card;
      padding: 16px;
      margin-bottom: 12px;

      .event-header {
        display: flex;
        align-items: center;
        margin-bottom: 8px;

        .type-tag {
          font-size: 12px;
          color: #ffffff;
          padding: 2px 8px;
          border-radius: 4px;
          margin-right: 12px;
        }

        .event-name {
          font-size: 16px;
          color: $text-main;
          font-weight: 500;
        }
      }

      .event-time {
        font-size: 14px;
        color: $text-secondary;
      }
    }
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/EventList.vue
git commit -m "feat: add EventList component with swipe-to-delete

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 10: 创建 TypePicker 组件

**Files:**
- Create: `src/components/TypePicker.vue`

- [ ] **Step 1: 创建类型选择器组件（含新建功能）**

创建 `src/components/TypePicker.vue`：

```vue
<template>
  <view class="type-picker">
    <!-- 类型选择区域 -->
    <view class="picker-section">
      <u-picker
        :show="showPicker"
        :columns="pickerColumns"
        keyName="label"
        @confirm="onPickerConfirm"
        @cancel="onPickerCancel"
      />

      <!-- 当前选中显示 -->
      <view class="current-type" @click="openPicker">
        <text class="type-label">{{ displayTypeName }}</text>
        <u-icon name="arrow-down" size="16" color="#999999" />
      </view>

      <!-- 新建类型按钮 -->
      <view class="new-type-btn" @click="openNewTypePopup">
        <u-icon name="plus" size="16" color="#2979ff" />
        <text class="btn-text">新建类型</text>
      </view>
    </view>

    <!-- 新建类型浮层 -->
    <u-popup :show="showNewTypePopup" mode="bottom" @close="closeNewTypePopup">
      <view class="new-type-popup">
        <view class="popup-header">
          <text class="popup-title">新建类型</text>
          <u-icon name="close" size="20" @click="closeNewTypePopup" />
        </view>

        <view class="popup-body">
          <!-- 类型名称 -->
          <view class="form-item">
            <text class="form-label">类型名称</text>
            <u-input
              v-model="newTypeName"
              placeholder="请输入类型名称"
              border="surround"
            />
          </view>

          <!-- 类型颜色 -->
          <view class="form-item">
            <text class="form-label">类型颜色</text>
            <view class="color-options">
              <view
                v-for="color in colorOptions"
                :key="color.value"
                class="color-item"
                :class="{ active: newTypeColor === color.value }"
                :style="{ backgroundColor: color.value }"
                @click="newTypeColor = color.value"
              >
                <u-icon v-if="newTypeColor === color.value" name="checkmark" color="#ffffff" size="16" />
              </view>
            </view>
          </view>
        </view>

        <view class="popup-footer">
          <u-button text="取消" type="default" @click="closeNewTypePopup" />
          <u-button text="保存" type="primary" @click="saveNewType" />
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useEventTypeStore } from '@/store/eventType'

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const eventTypeStore = useEventTypeStore()

const showPicker = ref(false)
const showNewTypePopup = ref(false)
const newTypeName = ref('')
const newTypeColor = ref('#2979ff')

const colorOptions = [
  { label: '红色', value: '#ff4d4f' },
  { label: '蓝色', value: '#2979ff' },
  { label: '绿色', value: '#52c41a' },
  { label: '紫色', value: '#722ed1' },
  { label: '橙色', value: '#fa8c16' },
  { label: '青色', value: '#13c2c2' }
]

const pickerColumns = computed(() => {
  return [eventTypeStore.typeOptions]
})

const displayTypeName = computed(() => {
  if (!props.modelValue) return '请选择类型'
  return eventTypeStore.getTypeName(props.modelValue)
})

function openPicker() {
  if (eventTypeStore.typeCount === 0) {
    uni.showToast({
      title: '请先创建类型',
      icon: 'none'
    })
    return
  }
  showPicker.value = true
}

function onPickerConfirm({ value }) {
  emit('update:modelValue', value[0].value)
  emit('change', value[0].value)
  showPicker.value = false
}

function onPickerCancel() {
  showPicker.value = false
}

function openNewTypePopup() {
  newTypeName.value = ''
  newTypeColor.value = '#2979ff'
  showNewTypePopup.value = true
}

function closeNewTypePopup() {
  showNewTypePopup.value = false
}

function saveNewType() {
  if (!newTypeName.value.trim()) {
    uni.showToast({
      title: '请输入类型名称',
      icon: 'none'
    })
    return
  }

  const newType = eventTypeStore.addType({
    name: newTypeName.value.trim(),
    color: newTypeColor.value
  })

  emit('update:modelValue', newType.id)
  emit('change', newType.id)

  closeNewTypePopup()

  uni.showToast({
    title: '类型已创建',
    icon: 'success'
  })
}
</script>

<style lang="scss" scoped>
.type-picker {
  .picker-section {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .current-type {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      background-color: $card-bg;
      border-radius: $radius-btn;

      .type-label {
        font-size: 14px;
        color: $text-main;
        margin-right: 8px;
      }
    }

    .new-type-btn {
      display: flex;
      align-items: center;
      padding: 10px 12px;

      .btn-text {
        font-size: 14px;
        color: #2979ff;
        margin-left: 4px;
      }
    }
  }

  .new-type-popup {
    padding: 20px;

    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .popup-title {
        font-size: 18px;
        font-weight: 600;
        color: $text-main;
      }
    }

    .popup-body {
      .form-item {
        margin-bottom: 20px;

        .form-label {
          font-size: 14px;
          color: $text-secondary;
          margin-bottom: 8px;
        }

        .color-options {
          display: flex;
          gap: 12px;

          .color-item {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;

            &.active {
              box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px $text-main;
            }
          }
        }
      }
    }

    .popup-footer {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TypePicker.vue
git commit -m "feat: add TypePicker component with create new type

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 11: 创建 EventForm 组件

**Files:**
- Create: `src/components/EventForm.vue`

- [ ] **Step 1: 创建添加事件弹出表单组件**

创建 `src/components/EventForm.vue`：

```vue
<template>
  <u-popup :show="visible" mode="bottom" @close="onClose">
    <view class="event-form">
      <view class="form-header">
        <text class="form-title">添加事件</text>
        <u-icon name="close" size="20" @click="onClose" />
      </view>

      <view class="form-body">
        <!-- 事件名称 -->
        <view class="form-item">
          <text class="form-label">事件名称</text>
          <u-input
            v-model="eventName"
            placeholder="请输入事件名称"
            border="surround"
          />
        </view>

        <!-- 事件类型 -->
        <view class="form-item">
          <text class="form-label">事件类型</text>
          <TypePicker v-model="eventTypeId" @change="onTypeChange" />
        </view>

        <!-- 事件时间 -->
        <view class="form-item">
          <text class="form-label">事件时间</text>
          <view class="time-picker-section">
            <text class="time-display">{{ formatTime(eventTime, 'YYYY-MM-DD HH:mm') }}</text>
            <u-button
              text="选择时间"
              type="primary"
              size="small"
              @click="showTimePicker = true"
            />
          </view>
          <u-datetime-picker
            :show="showTimePicker"
            v-model="eventTime"
            mode="date-time"
            @confirm="onTimeConfirm"
            @cancel="showTimePicker = false"
          />
        </view>
      </view>

      <view class="form-footer">
        <u-button text="取消" type="default" @click="onClose" />
        <u-button text="保存" type="primary" @click="onSave" />
      </view>
    </view>
  </u-popup>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useEventStore } from '@/store/event'
import { formatTime } from '@/utils/time'
import TypePicker from './TypePicker.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'save'])

const eventStore = useEventStore()

const eventName = ref('')
const eventTypeId = ref(null)
const eventTime = ref(Date.now())
const showTimePicker = ref(false)

// 每次打开表单时重置
watch(() => props.visible, (val) => {
  if (val) {
    eventName.value = ''
    eventTypeId.value = null
    eventTime.value = Date.now()
  }
})

function onTypeChange(typeId) {
  eventTypeId.value = typeId
}

function onTimeConfirm({ value }) {
  eventTime.value = value
  showTimePicker.value = false
}

function onClose() {
  emit('close')
}

function onSave() {
  // 验证
  if (!eventName.value.trim()) {
    uni.showToast({
      title: '请输入事件名称',
      icon: 'none'
    })
    return
  }

  if (!eventTypeId.value) {
    uni.showToast({
      title: '请选择事件类型',
      icon: 'none'
    })
    return
  }

  // 添加事件
  eventStore.addEvent({
    name: eventName.value.trim(),
    typeId: eventTypeId.value,
    time: eventTime.value
  })

  emit('save')
  emit('close')

  uni.showToast({
    title: '事件已添加',
    icon: 'success'
  })
}
</script>

<style lang="scss" scoped>
.event-form {
  padding: 20px;

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .form-title {
      font-size: 18px;
      font-weight: 600;
      color: $text-main;
    }
  }

  .form-body {
    .form-item {
      margin-bottom: 20px;

      .form-label {
        font-size: 14px;
        color: $text-secondary;
        margin-bottom: 8px;
        display: block;
      }

      .time-picker-section {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        background-color: $card-bg;
        border-radius: $radius-btn;

        .time-display {
          font-size: 14px;
          color: $text-main;
        }
      }
    }
  }

  .form-footer {
    display: flex;
    gap: 12px;
    margin-top: 20px;
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/EventForm.vue
git commit -m "feat: add EventForm popup component

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 12: 创建主页面 index/index.vue

**Files:**
- Create: `src/pages/index/index.vue`

- [ ] **Step 1: 创建主页面整合所有组件**

创建 `src/pages/index/index.vue`：

```vue
<template>
  <view class="page-index">
    <!-- 筛选器栏 -->
    <FilterBar />

    <!-- 事件列表 -->
    <EventList />

    <!-- 添加按钮（浮动） -->
    <view class="add-btn" @click="showEventForm = true">
      <u-icon name="plus" color="#ffffff" size="24" />
    </view>

    <!-- 添加事件浮层 -->
    <EventForm
      :visible="showEventForm"
      @close="showEventForm = false"
      @save="onEventSaved"
    />
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import FilterBar from '@/components/FilterBar.vue'
import EventList from '@/components/EventList.vue'
import EventForm from '@/components/EventForm.vue'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()

const showEventForm = ref(false)

// 页面加载时从存储读取数据
onMounted(() => {
  eventStore.loadFromStorage()
  eventTypeStore.loadFromStorage()
})

function onEventSaved() {
  // 事件保存后，列表会自动更新（响应式）
  showEventForm.value = false
}
</script>

<style lang="scss" scoped>
.page-index {
  min-height: 100vh;
  background-color: $bg-color;

  .add-btn {
    position: fixed;
    right: 24px;
    bottom: calc(var(--window-bottom) + 24px);
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-color: $primary-color;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(41, 121, 255, 0.4);

    &:active {
      transform: scale(0.95);
    }
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/index/index.vue
git commit -m "feat: add main index page integrating all components

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 13: 创建统计页面 stats/stats.vue

**Files:**
- Create: `src/pages/stats/stats.vue`

- [ ] **Step 1: 创建统计页面**

创建 `src/pages/stats/stats.vue`：

```vue
<template>
  <view class="page-stats">
    <!-- 概览卡片 -->
    <view class="overview-card">
      <view class="stat-item">
        <text class="stat-value">{{ totalCount }}</text>
        <text class="stat-label">总事件数</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ monthCount }}</text>
        <text class="stat-label">本月新增</text>
      </view>
    </view>

    <!-- 按类型分布 -->
    <view class="section-card">
      <text class="section-title">按类型分布</text>

      <view v-if="typeStats.length === 0" class="empty-tip">
        <text>暂无数据</text>
      </view>

      <view v-else class="type-stats">
        <view
          v-for="stat in typeStats"
          :key="stat.typeId"
          class="type-stat-item"
        >
          <view class="type-info">
            <view
              class="type-color-dot"
              :style="{ backgroundColor: stat.color }"
            />
            <text class="type-name">{{ stat.name }}</text>
          </view>

          <view class="stat-bar-section">
            <view class="stat-bar-bg">
              <view
                class="stat-bar"
                :style="{
                  width: stat.percent + '%',
                  backgroundColor: stat.color
                }"
              />
            </view>
            <text class="stat-count">{{ stat.count }} ({{ stat.percent }}%)</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 近7天趋势 -->
    <view class="section-card">
      <text class="section-title">近7天趋势</text>

      <view v-if="recentStats.length === 0" class="empty-tip">
        <text>暂无数据</text>
      </view>

      <view v-else class="trend-chart">
        <view class="chart-bars">
          <view
            v-for="(day, index) in recentStats"
            :key="index"
            class="chart-bar-item"
          >
            <view class="bar-value">{{ day.count }}</view>
            <view
              class="bar-visual"
              :style="{ height: getBarHeight(day.count) + 'px' }"
            />
            <text class="bar-label">{{ day.label }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import { getRecentDays, isSameDay } from '@/utils/time'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()

// 页面加载时从存储读取数据
onMounted(() => {
  eventStore.loadFromStorage()
  eventTypeStore.loadFromStorage()
})

const totalCount = computed(() => eventStore.totalCount)
const monthCount = computed(() => eventStore.monthCount)

// 按类型统计
const typeStats = computed(() => {
  const stats = eventStore.statsByType
  const total = eventStore.totalCount

  if (total === 0) return []

  return Object.entries(stats).map(([typeId, count]) => {
    const type = eventTypeStore.getTypeById(typeId)
    return {
      typeId,
      name: type ? type.name : '未分类',
      color: type ? type.color : '#999999',
      count,
      percent: Math.round((count / total) * 100)
    }
  }).sort((a, b) => b.count - a.count)
})

// 近7天统计
const recentStats = computed(() => {
  const days = getRecentDays(7)
  const events = eventStore.events

  return days.map(day => {
    const count = events.filter(e => isSameDay(e.time, day.timestamp)).length
    return {
      ...day,
      count
    }
  })
})

// 计算柱状图高度（最大60px）
function getBarHeight(count) {
  const maxCount = Math.max(...recentStats.value.map(d => d.count), 1)
  return Math.round((count / maxCount) * 60)
}
</script>

<style lang="scss" scoped>
.page-stats {
  min-height: 100vh;
  background-color: $bg-color;
  padding: 16px;

  .overview-card {
    display: flex;
    background-color: $card-bg;
    border-radius: $radius-card;
    padding: 20px;
    margin-bottom: 16px;

    .stat-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;

      .stat-value {
        font-size: 28px;
        font-weight: 600;
        color: $primary-color;
      }

      .stat-label {
        font-size: 14px;
        color: $text-secondary;
        margin-top: 4px;
      }
    }

    .stat-divider {
      width: 1px;
      background-color: $border-color;
      margin: 0 20px;
    }
  }

  .section-card {
    background-color: $card-bg;
    border-radius: $radius-card;
    padding: 16px;
    margin-bottom: 16px;

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: $text-main;
      margin-bottom: 12px;
    }

    .empty-tip {
      text-align: center;
      padding: 20px;
      color: $text-secondary;
    }

    .type-stats {
      .type-stat-item {
        display: flex;
        align-items: center;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        .type-info {
          display: flex;
          align-items: center;
          width: 100px;

          .type-color-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
          }

          .type-name {
            font-size: 14px;
            color: $text-main;
          }
        }

        .stat-bar-section {
          flex: 1;
          display: flex;
          align-items: center;

          .stat-bar-bg {
            flex: 1;
            height: 8px;
            background-color: #e8e8e8;
            border-radius: 4px;
            overflow: hidden;

            .stat-bar {
              height: 100%;
              border-radius: 4px;
            }
          }

          .stat-count {
            font-size: 12px;
            color: $text-secondary;
            margin-left: 8px;
            width: 80px;
          }
        }
      }
    }

    .trend-chart {
      .chart-bars {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        height: 100px;
        padding-top: 20px;

        .chart-bar-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;

          .bar-value {
            font-size: 12px;
            color: $text-main;
            margin-bottom: 4px;
          }

          .bar-visual {
            width: 20px;
            background-color: $primary-color;
            border-radius: 4px 4px 0 0;
            min-height: 4px;
          }

          .bar-label {
            font-size: 12px;
            color: $text-secondary;
            margin-top: 8px;
          }
        }
      }
    }
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/stats/stats.vue
git commit -m "feat: add stats page with overview and charts

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 14: 更新 App.vue 初始化

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: 更新 App.vue 根组件**

修改 `src/App.vue`：

```vue
<script>
export default {
  onLaunch() {
    console.log('App Launch')
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  }
}
</script>

<style lang="scss">
/* 全局样式 */
@import '@/uni.scss';

/* 页面基础样式 */
page {
  background-color: $bg-color;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 全局文本样式 */
text {
  color: $text-main;
}

/* 全局按钮样式 */
button {
  border-radius: $radius-btn;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/App.vue
git commit -m "feat: update App.vue with global styles

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 15: 创建 tabBar PNG 图标

**Files:**
- Create: PNG 图标文件

- [ ] **Step 1: 创建 tabBar PNG 图标**

由于小程序 tabBar 不支持 SVG，需要创建 PNG 格式图标。

使用设计工具或在线工具创建以下图标（24x24 px）：
- `src/static/images/list.png` - 列表图标（灰色 #999999）
- `src/static/images/list-active.png` - 列表图标选中（蓝色 #2979ff）
- `src/static/images/stats.png` - 统计图标（灰色 #999999）
- `src/static/images/stats-active.png` - 统计图标选中（蓝色 #2979ff）

可以使用在线工具如：
- https://www.flaticon.com
- https://iconpark.oceanengine.com
- 或使用 HBuilderX 内置图标资源

临时方案：可使用简单的纯色 PNG 占位图。

- [ ] **Step 2: 更新 pages.json 使用 PNG 图标**

确认 `src/pages.json` 中 tabBar 配置使用 `.png` 扩展名。

- [ ] **Step 3: Commit**

```bash
git add src/static/images/*.png
git commit -m "feat: add tabBar PNG icons

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 16: H5 端运行测试

**Files:**
- 无新文件，运行测试

- [ ] **Step 1: 运行 H5 开发模式**

```bash
cd /Users/duanluyao/code/record
npm run dev:h5
```

或在 HBuilderX 中选择「运行」→「运行到浏览器」→「Chrome」

- [ ] **Step 2: 验证功能清单**

在浏览器中测试以下功能：

1. **页面加载**: 主页正常显示，底部 tabBar 显示
2. **添加类型**: 点击添加事件 → 新建类型 → 输入名称和颜色 → 保存成功
3. **添加事件**: 选择类型 → 输入事件名称 → 选择时间 → 保存成功
4. **事件列表**: 新添加的事件正确显示在列表中
5. **筛选功能**: 类型筛选和日期筛选正常工作
6. **删除事件**: 左滑事件卡片 → 点击删除 → 确认后事件消失
7. **统计页面**: 切换到统计页 → 显示总数、本月数、类型分布、趋势图

记录任何问题并修复。

- [ ] **Step 3: Commit（如有修复）**

```bash
git add .
git commit -m "fix: resolve H5 testing issues

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 17: 微信小程序端测试

**Files:**
- 无新文件，运行测试

- [ ] **Step 1: 运行微信小程序开发模式**

在 HBuilderX 中选择「运行」→「运行到小程序模拟器」→「微信开发者工具」

或在微信开发者工具中导入项目 `dist/dev/mp-weixin` 目录。

- [ ] **Step 2: 验证功能清单**

同 Task 16 的功能验证清单，在微信小程序模拟器中测试。

特别注意：
- tabBar 图标是否正常显示
- uView 组件在小程序中的渲染效果
- 时间选择器在小程序中的交互体验

- [ ] **Step 3: Commit（如有修复）**

```bash
git add .
git commit -m "fix: resolve mini-program testing issues

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 18: 最终提交和版本标记

**Files:**
- 无新文件

- [ ] **Step 1: 确认所有功能正常**

运行最终检查：
- H5 端运行正常
- 微信小程序端运行正常
- 数据持久化正常（刷新后数据保留）

- [ ] **Step 2: 合并所有提交并打版本标签**

```bash
git log --oneline -20
git tag v1.0.0
git push origin master --tags
```

- [ ] **Step 3: 完成**

应用已完成开发，可发布使用。

---

## Spec Coverage 检查

| 规格要求 | 实现任务 |
|----------|----------|
| 极简字段（名称+时间+类型） | Task 7 (Event Store), Task 11 (EventForm) |
| 完全自定义类型 | Task 6 (EventType Store), Task 10 (TypePicker) |
| 本地存储 | Task 4 (storage.js), Task 7/6 (saveToStorage) |
| 清爽简洁风格 | Task 2 (uni.scss), 各组件样式 |
| 单页应用+浮层操作 | Task 12 (index.vue), Task 11 (EventForm) |
| 事件列表+左滑删除 | Task 9 (EventList) |
| 筛选功能 | Task 8 (FilterBar), Task 7 (setFilterType) |
| 统计页面 | Task 13 (stats.vue) |
| uView UI | Task 2 (安装配置), 各组件使用 |
| Pinia 状态管理 | Task 6/7 (Store), Task 2 (配置) |
| H5/小程序双端 | Task 16/17 (测试验证) |

---

## Placeholder 检查

- ✅ 无 TBD/TODO
- ✅ 无 "implement later"
- ✅ 无 "add appropriate error handling"
- ✅ 无 "write tests for above"
- ✅ 无 "similar to Task N"
- ✅ 所有代码步骤包含完整代码
- ✅ 所有命令步骤包含完整命令

---

## Type 一致性检查

- Event.id: `event_${timestamp}_${random}` — Task 7 定义，Task 11 使用
- EventType.id: `type_${timestamp}_${random}` — Task 6 定义，Task 10 使用
- filteredEvents getter — Task 7 定义，Task 9 使用
- typeOptions getter — Task 6 定义，Task 8/10 使用
- addEvent/addType 方法签名一致

---

计划完成。请查阅后选择执行方式。