# TabBar 图标修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 SVG 图标转换为高质量 PNG 文件，修复底部 tabBar 菜单图标显示问题

**Architecture:** 使用 ImageMagick convert 命令将 SVG 文件转换为 81x81 PNG 文件

**Tech Stack:** ImageMagick (系统工具), uni-app tabBar 配置

---

## 文件结构

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/static/images/list.png` | 替换 | 事件图标（未选中） |
| `src/static/images/list-active.png` | 替换 | 事件图标（选中） |
| `src/static/images/stats.png` | 替换 | 统计图标（未选中） |
| `src/static/images/stats-active.png` | 替换 | 统计图标（选中） |

---

### Task 1: 转换 SVG 图标为 PNG

**Files:**
- Input: `src/static/images/list.svg`, `src/static/images/list-active.svg`, `src/static/images/stats.svg`, `src/static/images/stats-active.svg`
- Output: `src/static/images/list.png`, `src/static/images/list-active.png`, `src/static/images/stats.png`, `src/static/images/stats-active.png`

- [ ] **Step 1: 转换 list.svg 为 PNG**

```bash
convert -background none -resize 81x81 src/static/images/list.svg src/static/images/list.png
```

Expected: 生成 81x81 PNG 文件

- [ ] **Step 2: 转换 list-active.svg 为 PNG**

```bash
convert -background none -resize 81x81 src/static/images/list-active.svg src/static/images/list-active.png
```

Expected: 生成 81x81 PNG 文件

- [ ] **Step 3: 转换 stats.svg 为 PNG**

```bash
convert -background none -resize 81x81 src/static/images/stats.svg src/static/images/stats.png
```

Expected: 生成 81x81 PNG 文件

- [ ] **Step 4: 转换 stats-active.svg 为 PNG**

```bash
convert -background none -resize 81x81 src/static/images/stats-active.svg src/static/images/stats-active.png
```

Expected: 生成 81x81 PNG 文件

---

### Task 2: 验证 PNG 文件

**Files:**
- Check: `src/static/images/*.png`

- [ ] **Step 1: 检查 PNG 文件尺寸和格式**

```bash
file src/static/images/*.png
```

Expected: 所有文件为 PNG image data, 81x81

- [ ] **Step 2: 检查 PNG 文件大小**

```bash
ls -la src/static/images/*.png
```

Expected: 文件大小合理（几千 bytes，包含渐变效果）

---

### Task 3: 提交更改

**Files:**
- Commit: `src/static/images/*.png`

- [ ] **Step 1: 查看变更状态**

```bash
git status src/static/images/
```

Expected: 显示 4 个 PNG 文件被修改

- [ ] **Step 2: 提交更改**

```bash
git add src/static/images/*.png
git commit -m "fix: convert SVG tabBar icons to PNG for proper display

- Convert list.svg and list-active.svg to 81x81 PNG
- Convert stats.svg and stats-active.svg to 81x81 PNG
- Fix tabBar icon display issue in WeChat mini-program and H5

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

Expected: 提交成功

---

### Task 4: 测试验证

- [ ] **Step 1: 在微信小程序开发者工具中测试**

Run: 启动微信小程序开发模式
```bash
npm run dev:mp-weixin
```

Expected: 在微信小程序开发者工具中查看 tabBar 图标是否正常显示

- [ ] **Step 2: 在 H5 网页中测试**

Run: 启动 H5 开发模式
```bash
npm run dev:h5
```

Expected: 在浏览器中查看 tabBar 图标是否正常显示