---
title: 修复小程序页面顶部被胶囊按钮遮挡问题
date: 2026-03-30
status: approved
---

# 修复小程序页面顶部被胶囊按钮遮挡问题

## 问题描述

小程序页面使用自定义导航栏后，顶部内容被微信小程序右上角胶囊按钮（三个点 + 关闭按钮）遮挡。之前的修复只考虑了状态栏高度，未考虑胶囊按钮位置，导致遮挡问题仍然存在。

## 原因分析

微信小程序的胶囊按钮位置在不同机型上有差异：
- iOS 设备：胶囊按钮底部位置约 88px
- Android 设备：胶囊按钮底部位置约 72px

单纯使用 `--status-bar-height` 变量无法覆盖胶囊按钮的实际底部位置。

## 解决方案

使用 `uni.getMenuButtonBoundingClientRect()` API 动态获取胶囊按钮位置，计算导航栏总高度并设置为全局 CSS 变量。

### 计算公式

```javascript
const menuButton = uni.getMenuButtonBoundingClientRect()
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight
const navBarHeight = menuButton.bottom + (menuButton.top - statusBarHeight)
```

导航栏总高度 = 胶囊按钮底部位置 + 胶囊按钮距状态栏的间距（即胶囊按钮的上边距）

## 修改文件

### 1. `src/App.vue`

在 `onLaunch` 中计算导航栏高度并设置全局 CSS 变量：

```javascript
onLaunch() {
  // #ifdef MP-WEIXIN
  const menuButton = uni.getMenuButtonBoundingClientRect()
  const statusBarHeight = uni.getSystemInfoSync().statusBarHeight
  const navBarHeight = menuButton.bottom + (menuButton.top - statusBarHeight)

  // 设置全局 CSS 变量
  uni.setStorageSync('navBarHeight', navBarHeight)
  // #endif

  // 其他初始化代码...
}
```

在全局样式中添加 CSS 变量定义：

```scss
page {
  --nav-bar-height: 88px; // 默认值，JS 会动态覆盖
}
```

### 2. `src/pages/index/index.vue`

修改 `.header` 样式，使用 `--nav-bar-height` 变量：

```scss
.header {
  margin: $spacing-lg $spacing-md;
  margin-top: calc(var(--nav-bar-height) + $spacing-lg);
  // 其他样式保持不变
}
```

### 3. `src/pages/stats/stats.vue`

修改 `.header` 和 `.header-bg` 样式：

```scss
.header {
  position: relative;
  padding: $spacing-xl $spacing-md;
  padding-top: calc(var(--nav-bar-height) + $spacing-xl);

  .header-bg {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: calc(var(--nav-bar-height) + 200rpx);
    // 其他样式保持不变
  }
}
```

## 技术说明

- `uni.getMenuButtonBoundingClientRect()` 返回胶囊按钮的位置信息（left, right, top, bottom, width, height）
- 使用条件编译 `#ifdef MP-WEIXIN` 确保只在微信小程序环境执行
- CSS 变量 `--nav-bar-height` 设置默认值 88px 作为兜底
- 通过 `calc()` 将导航栏高度与原有间距相加，保持设计一致性

## 验收标准

1. 首页 header 标题"记录时光"完整显示，不被胶囊按钮遮挡
2. 统计页 header 标题"统计概览"完整显示，不被胶囊按钮遮挡
3. 在不同机型（iOS/Android）上导航栏高度适配正确
4. header 背景视觉效果保持连贯