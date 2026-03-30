# 修复顶部状态栏遮挡问题实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为小程序页面 header 添加状态栏高度间距，解决顶部被遮挡问题。

**Architecture:** 使用 uni-app 内置 CSS 变量 `--status-bar-height`，通过 `calc()` 函数与原有间距叠加。

**Tech Stack:** uni-app、Vue 3、SCSS

---

### Task 1: 修改首页 header 样式

**Files:**
- Modify: `src/pages/index/index.vue:90-170` (`.header` 样式部分)

- [ ] **Step 1: 修改 index.vue 的 .header 样式**

将第 91 行的 `margin: $spacing-lg $spacing-md;` 改为：

```scss
.header {
  margin: $spacing-lg $spacing-md;
  margin-top: calc(var(--status-bar-height) + $spacing-lg);
  padding: $spacing-xl $spacing-lg;
  position: relative;
  overflow: hidden;
  // ... 其他样式保持不变
```

- [ ] **Step 2: 验证首页修改**

在微信开发者工具中预览首页，确认 header 标题"记录时光"完整显示在状态栏下方。

---

### Task 2: 修改统计页 header 样式

**Files:**
- Modify: `src/pages/stats/stats.vue:151-184` (`.header` 样式部分)

- [ ] **Step 1: 修改 stats.vue 的 .header 样式**

将第 153 行的 `padding: $spacing-xl $spacing-md;` 改为：

```scss
.header {
  position: relative;
  padding: $spacing-xl $spacing-md;
  padding-top: calc(var(--status-bar-height) + $spacing-xl);
```

- [ ] **Step 2: 修改 stats.vue 的 .header-bg 样式**

将第 160 行的 `height: 200rpx;` 改为：

```scss
.header-bg {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: calc(var(--status-bar-height) + 200rpx);
  background: $gradient-primary;
  opacity: 0.15;
  border-radius: 0 0 $radius-xl $radius-xl;
}
```

- [ ] **Step 3: 验证统计页修改**

在微信开发者工具中预览统计页，确认 header 标题"统计概览"完整显示，背景渐变效果正常。

---

### Task 3: 提交代码

- [ ] **Step 1: 提交修改**

```bash
git add src/pages/index/index.vue src/pages/stats/stats.vue
git commit -m "fix: 修复页面顶部被状态栏遮挡问题

- 为首页 header 添加状态栏高度的 margin-top
- 为统计页 header 添加状态栏高度的 padding-top
- 同步调整统计页 header-bg 背景高度

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

- [ ] **Step 2: 确认提交成功**

运行 `git log -1` 确认提交信息正确。