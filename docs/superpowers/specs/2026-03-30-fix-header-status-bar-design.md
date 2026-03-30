---
title: 修复小程序页面顶部被状态栏遮挡问题
date: 2026-03-30
status: approved
---

# 修复小程序页面顶部被状态栏遮挡问题

## 问题描述

小程序使用自定义导航栏（`navigationStyle: "custom"`）后，首页和统计页的 header 区域被系统状态栏遮挡，导致标题和图标显示不全。

## 原因分析

两个页面均配置了 `navigationStyle: "custom"`，移除了默认导航栏，但自定义 header 没有预留状态栏高度的空间。

## 解决方案

使用 uni-app 提供的 CSS 变量 `--status-bar-height` 为 header 区域添加顶部间距。

## 修改文件

### 1. `src/pages/index/index.vue`

修改 `.header` 样式，添加状态栏高度的 margin-top：

```scss
.header {
  margin: $spacing-lg $spacing-md;
  margin-top: calc(var(--status-bar-height) + $spacing-lg);
  // 其他样式保持不变
}
```

### 2. `src/pages/stats/stats.vue`

修改 `.header` 和 `.header-bg` 样式：

```scss
.header {
  position: relative;
  padding: $spacing-xl $spacing-md;
  padding-top: calc(var(--status-bar-height) + $spacing-xl);
  // 其他样式保持不变

  .header-bg {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: calc(var(--status-bar-height) + 200rpx);
    // 其他样式保持不变
  }
}
```

## 技术说明

- `--status-bar-height` 是 uni-app 内置 CSS 变量，自动适配不同设备的状态栏高度
- 使用 `calc()` 函数将状态栏高度与原有的间距相加，保持设计的一致性
- stats 页的 `.header-bg` 渐变背景也需同步调整高度，确保视觉效果完整

## 验收标准

1. 首页 header 标题"记录时光"完整显示，不被状态栏遮挡
2. 统计页 header 标题"统计概览"完整显示，不被状态栏遮挡
3. 两页面的 header 背景视觉效果保持连贯
4. 在不同设备型号上状态栏高度适配正确