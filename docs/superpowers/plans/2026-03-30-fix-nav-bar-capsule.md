# 修复胶囊按钮遮挡问题实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-step. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用胶囊按钮位置信息动态计算导航栏高度，解决顶部内容被胶囊按钮遮挡问题。

**Architecture:** 在 App.vue onLaunch 中计算导航栏高度并存储到全局 storage；页面组件通过 computed 属性获取高度，使用 :style 动态绑定到根元素设置 CSS 变量 `--nav-bar-height`。

**Tech Stack:** uni-app、Vue 3 (Composition API)、SCSS

---

### Task 1: 在 App.vue 中计算并存储导航栏高度

**Files:**
- Modify: `src/App.vue:22-49` (onLaunch 方法中的 MP-WEIXIN 条件编译块)

- [ ] **Step 1: 在 onLaunch 的 MP-WEIXIN 块开头添加导航栏高度计算代码**

在第 22 行 `// #ifdef MP-WEIXIN` 后，第 23 行 `wx.loadFontFace` 前插入：

```javascript
// 计算导航栏高度（胶囊按钮底部 + 胶囊按钮距状态栏的间距）
const menuButton = uni.getMenuButtonBoundingClientRect()
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight
const navBarHeight = menuButton.bottom + (menuButton.top - statusBarHeight)
console.log('导航栏高度:', navBarHeight)
uni.setStorageSync('navBarHeight', navBarHeight)
```

- [ ] **Step 2: 在全局样式 page 中添加默认 CSS 变量**

在 `src/App.vue` 第 70 行 `page {` 块中添加默认值：

```scss
page {
  --nav-bar-height: 88px; // 默认值，页面会动态覆盖
  background: linear-gradient(180deg, $bg-primary 0%, $bg-secondary 50%, #F0F9FF 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}
```

---

### Task 2: 修改首页动态应用导航栏高度

**Files:**
- Modify: `src/pages/index/index.vue` (script 和 template 部分)

- [ ] **Step 1: 在 script setup 中添加 computed 属性获取导航栏高度**

在第 57-82 行的 `<script setup>` 块中，添加：

```typescript
import { ref, computed, onMounted } from 'vue'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import FilterBar from '@/components/FilterBar.vue'
import EventList from '@/components/EventList.vue'
import EventForm from '@/components/EventForm.vue'
import CustomTabBar from '@/components/CustomTabBar.vue'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()

const showEventForm = ref(false)
const showEditForm = ref(false)
const editingEvent = ref<{ id: string; name: string; typeId: string; time: number } | null>(null)

// 动态计算导航栏高度
const navBarHeight = computed(() => {
  const height = uni.getStorageSync('navBarHeight')
  return height || 88 // 默认值
})

function onEventSaved() {
  showEventForm.value = false
  showEditForm.value = false
  editingEvent.value = null
}

function onEditEvent(event: { id: string; name: string; typeId: string; time: number }) {
  editingEvent.value = event
  showEditForm.value = true
}
```

- [ ] **Step 2: 在 template 中添加动态 style 绑定**

将第 2 行 `<view class="page-index">` 改为：

```vue
<view class="page-index" :style="{ '--nav-bar-height': navBarHeight + 'px' }">
```

- [ ] **Step 3: 将样式中的 --status-bar-height 改为 --nav-bar-height**

将第 92 行的 margin-top 样式从：
```scss
margin-top: calc(var(--status-bar-height) + $spacing-lg);
```

改为：
```scss
margin-top: calc(var(--nav-bar-height) + $spacing-lg);
```

---

### Task 3: 修改统计页动态应用导航栏高度

**Files:**
- Modify: `src/pages/stats/stats.vue` (script 和 template 部分)

- [ ] **Step 1: 在 script setup 中添加 computed 属性获取导航栏高度**

在第 103-143 行的 `<script setup>` 块中，添加：

```typescript
import { computed, onMounted } from 'vue'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import CustomTabBar from '@/components/CustomTabBar.vue'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()

// 动态计算导航栏高度
const navBarHeight = computed(() => {
  const height = uni.getStorageSync('navBarHeight')
  return height || 88 // 默认值
})

const totalCount = computed(() => eventStore.totalCount)
// ... 其他 computed 和函数保持不变
```

- [ ] **Step 2: 在 template 中添加动态 style 绑定**

将第 2 行 `<view class="page-stats">` 改为：

```vue
<view class="page-stats" :style="{ '--nav-bar-height': navBarHeight + 'px' }">
```

- [ ] **Step 3: 将样式中的 --status-bar-height 改为 --nav-bar-height**

将第 154 行的 padding-top 样式从：
```scss
padding-top: calc(var(--status-bar-height) + $spacing-xl);
```

改为：
```scss
padding-top: calc(var(--nav-bar-height) + $spacing-xl);
```

将第 161 行的 height 样式从：
```scss
height: calc(var(--status-bar-height) + 200rpx);
```

改为：
```scss
height: calc(var(--nav-bar-height) + 200rpx);
```

---

### Task 4: 提交代码

- [ ] **Step 1: 提交修改**

```bash
git add src/App.vue src/pages/index/index.vue src/pages/stats/stats.vue
git commit -m "fix: 使用胶囊按钮位置计算导航栏高度解决遮挡问题

- 在 App.vue onLaunch 中计算导航栏高度并存储
- 首页和统计页动态读取高度并设置 CSS 变量
- 使用 --nav-bar-height 替代 --status-bar-height

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

- [ ] **Step 2: 确认提交成功**

运行 `git log -1` 确认提交信息正确。