# 修复底部菜单图标显示问题

## 问题概述

底部 tabBar 菜单（"事件"和"统计"）图标无法正常显示。

## 根因分析

1. **PNG 文件格式问题**：现有 PNG 文件是 4-bit grayscale / 1-bit colormap 格式，尺寸仅 24x24，文件大小仅 300-313 bytes，内容过于简单，可能不兼容微信小程序渲染
2. **SVG 更新后 PNG 未同步**：SVG 图标已更新为新的渐变设计，但 PNG 文件未同步转换
3. **尺寸不足**：微信小程序 tabBar 图标推荐尺寸为 81x81，当前 24x24 过小

## 解决方案

将已更新的 SVG 图标转换为高质量 PNG 文件，替换现有 PNG。

## 转换规格

| 文件 | 输入 | 输出 | 尺寸 |
|------|------|------|------|
| list.svg | static/images/list.svg | static/images/list.png | 81x81 |
| list-active.svg | static/images/list-active.svg | static/images/list-active.png | 81x81 |
| stats.svg | static/images/stats.svg | static/images/stats.png | 81x81 |
| stats-active.svg | static/images/stats-active.svg | static/images/stats-active.png | 81x81 |

- 格式：PNG，带透明背景
- 工具：使用 Node.js sharp 库或系统工具转换

## 影响范围

- 仅修改 `src/static/images/` 下的 PNG 文件
- `pages.json` 配置无需改动（路径已正确）

## 验证步骤

1. 转换完成后检查 PNG 文件是否正确显示渐变效果
2. 在微信小程序开发者工具中测试 tabBar 图标显示
3. 在 H5 网页中测试 tabBar 图标显示

## 目标平台

- 微信小程序
- H5 网页