# 事件列表长按菜单实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 将事件列表的左滑编辑/删除菜单改为长按 800ms 后弹出气泡菜单

**架构：** 使用自定义 View 实现气泡菜单，通过 position: absolute 定位在长按位置上方。利用 uni.onTouchStart/onTouchEnd 原生事件实现长按计时。

**技术栈：** Vue 3 + uni-app + uView Plus

---

## 文件结构

- 修改: `src/components/EventList.vue` — 移除 u-swipe-action，实现长按气泡菜单

---

## Task 1: 移除左滑组件，添加长按状态变量

**Files:**
- Modify: `src/components/EventList.vue`

- [ ] **Step 1: 添加长按相关状态变量**

在 `<script setup>` 中添加以下状态：

```typescript
// 长按相关状态
const LONG_PRESS_DURATION = 800 // 长按时长 ms
const CANCEL_DISTANCE = 20 // 取消滑动距离 px

const isLongPressing = ref(false)
const menuVisible = ref(false)
const menuPosition = ref({ x: 0, y: 0 })
const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const touchStartPos = ref({ x: 0, y: 0 })
```

- [ ] **Step 2: 提交**

```bash
git add src/components/EventList.vue
git commit -m "feat: 添加长按菜单状态变量"
```

---

## Task 2: 实现长按事件处理

**Files:**
- Modify: `src/components/EventList.vue:29-65` — 卡片模板区域

- [ ] **Step 1: 在卡片上添加触摸事件**

将原来的 `u-swipe-action` 包裹的卡片改为使用 view + 触摸事件：

```vue
<!-- 原来的 u-swipe-action 替换为普通 view + 触摸事件 -->
<view
  class="event-card glass-card"
  :style="{ position: 'absolute', top: getEventOffset(event._index) + 'px', width: '100%' }"
  @touchstart="(e: any) => onTouchStart(e, event.id)"
  @touchend="onTouchEnd"
  @touchmove="onTouchMove"
  @touchcancel="onTouchEnd"
>
  <view class="event-card-inner">
    <!-- ... 现有内容 ... -->
  </view>
  <!-- ... -->
</view>
```

- [ ] **Step 2: 实现触摸事件处理函数**

在 `<script setup>` 中添加：

```typescript
// 触摸开始
function onTouchStart(e: any, eventId: string) {
  const touch = e.touches[0]
  touchStartPos.value = { x: touch.clientX, y: touch.clientY }
  isLongPressing.value = true

  // 开始长按计时
  longPressTimer.value = setTimeout(() => {
    if (isLongPressing.value) {
      // 长按触发，显示菜单
      menuPosition.value = {
        x: touchStartPos.value.x,
        y: touchStartPos.value.y - 60 // 在长按位置上方 60px
      }
      menuVisible.value = true
    }
  }, LONG_PRESS_DURATION)
}

// 触摸结束
function onTouchEnd() {
  isLongPressing.value = false
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

// 触摸移动（取消长按）
function onTouchMove(e: any) {
  const touch = e.touches[0]
  const distance = Math.sqrt(
    Math.pow(touch.clientX - touchStartPos.value.x, 2) +
    Math.pow(touch.clientY - touchStartPos.value.y, 2)
  )
  if (distance > CANCEL_DISTANCE) {
    // 移动超过阈值，取消长按
    isLongPressing.value = false
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
      longPressTimer.value = null
    }
  }
}
```

- [ ] **Step 3: 移除 u-swipe-action 相关代码**

从 template 中删除：
- `<u-swipe-action>` 包裹
- `<u-swipe-action-item>` 组件

- [ ] **Step 4: 提交**

```bash
git add src/components/EventList.vue
git commit -m "feat: 实现长按事件处理逻辑"
```

---

## Task 3: 实现气泡菜单 UI

**Files:**
- Modify: `src/components/EventList.vue:1-70` — template 结束前添加气泡菜单

- [ ] **Step 1: 添加气泡菜单 HTML**

在 `</scroll-view>` 之后、`</view>` (event-list) 之前添加：

```vue
<!-- 气泡菜单 -->
<view
  v-if="menuVisible"
  class="bubble-menu"
  :style="{
    left: menuPosition.x + 'px',
    top: menuPosition.y + 'px'
  }"
  @click.stop
>
  <view class="menu-item edit" @click="handleMenuEdit">
    <text class="fa-solid">&#xf044;</text>
    <text class="menu-text">编辑</text>
  </view>
  <view class="menu-item delete" @click="handleMenuDelete">
    <text class="fa-solid">&#xf1f8;</text>
    <text class="menu-text">删除</text>
  </view>
</view>

<!-- 点击外部关闭菜单的遮罩 -->
<view
  v-if="menuVisible"
  class="menu-mask"
  @click="closeMenu"
></view>
```

- [ ] **Step 2: 添加菜单操作函数**

```typescript
// 关闭菜单
function closeMenu() {
  menuVisible.value = false
}

// 处理编辑
const handleMenuEdit = (eventId: string) => {
  const event = eventStore.events.find(e => e.id === eventId)
  if (event) {
    emit('edit', {
      id: event.id,
      name: event.name,
      typeId: event.typeId,
      time: event.time
    })
  }
  closeMenu()
}

// 处理删除
const handleMenuDelete = (eventId: string) => {
  const event = eventStore.events.find(e => e.id === eventId)
  if (!event) return

  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个事件吗？',
    confirmColor: '#EF4444',
    success: (res) => {
      if (res.confirm) {
        eventStore.deleteEvent(event.id)
        uni.showToast({
          title: '已删除',
          icon: 'success'
        })
      }
    }
  })
  closeMenu()
}
```

- [ ] **Step 3: 添加气泡菜单样式**

在 `<style lang="scss" scoped>` 中添加：

```scss
.bubble-menu {
  position: fixed;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 32rpx;
  padding: 20rpx 32rpx;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateX(-50%); // 居中定位

  .menu-item {
    display: flex;
    align-items: center;
    gap: 8rpx;

    .fa-solid {
      font-size: 28rpx;
    }

    .menu-text {
      font-size: 26rpx;
      font-weight: 500;
    }

    &.edit {
      color: #3B82F6;
    }

    &.delete {
      color: #EF4444;
    }
  }
}

.menu-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
}
```

- [ ] **Step 4: 修复 handleSwipeClick 调用**

修改模板中的菜单点击调用，从 `@click="(e: { index: number }) => handleSwipeClick(e.index, event.id)"` 改为新的菜单处理函数。

需要追踪当前选中的 eventId：

```typescript
const selectedEventId = ref<string | null>(null)

function onTouchStart(e: any, eventId: string) {
  selectedEventId.value = eventId
  // ... 现有逻辑
}

// 修改菜单点击处理
function handleMenuEdit() {
  if (!selectedEventId.value) return
  const event = eventStore.events.find(e => e.id === selectedEventId.value)
  // ... 现有逻辑
}

function handleMenuDelete() {
  if (!selectedEventId.value) return
  const event = eventStore.events.find(e => e.id === selectedEventId.value)
  // ... 现有逻辑
}
```

- [ ] **Step 5: 提交**

```bash
git add src/components/EventList.vue
git commit -m "feat: 实现气泡菜单 UI 和交互"
```

---

## Task 4: 边界情况处理

**Files:**
- Modify: `src/components/EventList.vue`

- [ ] **Step 1: 菜单超出屏幕边界处理**

在显示菜单前添加边界检测：

```typescript
// 在 showMenu 逻辑中添加
function adjustMenuPosition(x: number, y: number) {
  const systemInfo = uni.getSystemInfoSync()
  const menuWidth = 200 // 约等于 rpx 转 px
  const menuHeight = 50

  // 水平边界
  if (x - menuWidth / 2 < 0) {
    x = menuWidth / 2 + 10
  } else if (x + menuWidth / 2 > systemInfo.windowWidth) {
    x = systemInfo.windowWidth - menuWidth / 2 - 10
  }

  // 垂直边界
  if (y < 0) {
    y = touchStartPos.value.y + 60 // 改到下方
  }

  return { x, y }
}
```

在 onTouchStart 中调用 adjustMenuPosition。

- [ ] **Step 2: 页面滚动时关闭菜单**

在 onScroll 中添加：

```typescript
function onScroll(e: { detail: { scrollTop: number } }): void {
  scrollTop.value = e.detail.scrollTop
  // 滚动时关闭菜单
  if (menuVisible.value) {
    closeMenu()
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add src/components/EventList.vue
git commit -m "feat: 添加边界情况处理"
```

---

## Task 5: 测试验证

**Files:**
- 无 (手动测试)

- [ ] **Step 1: 验证长按触发**

在真机或模拟器上测试：
- 短按卡片（< 800ms）：不应弹出菜单
- 长按卡片（≥ 800ms）：应弹出气泡菜单

- [ ] **Step 2: 验证菜单功能**

- 点击编辑：应打开编辑表单
- 点击删除：应弹出确认对话框
- 点击菜单外部：应关闭菜单

- [ ] **Step 3: 验证边界情况**

- 列表滚动时菜单应关闭
- 菜单位置不应超出屏幕边界

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: 完成长按菜单功能"
```

---

## 验收标准检查

- [x] 长按 800ms 后菜单出现，短按（< 800ms）不触发
- [x] 菜单位置在长按位置上方，不超出屏幕
- [x] 点击编辑/删除选项可正常执行对应操作
- [x] 点击菜单外部区域可关闭菜单
- [x] 列表正常滚动不受影响