# 纪念日倒计时功能设计（Phase 1）

## 背景

基于 uni-app (Vue 3 + Pinia) 的跨平台事件记录应用，需要新增纪念日倒计时功能，支持记录重要日期、智能显示倒计时/正计时、按年重复。

## 实现策略

采用分阶段实现：
- **Phase 1（本次）：** 核心功能 — 纪念日增删改查、智能倒计时/正计时、按年重复
- **Phase 2：** 扩展功能 — 自定义分类系统、多种重复周期（月/周/日）
- **Phase 3：** 高级功能 — 拖拽排序、当天提醒推送

## 数据结构

### 纪念日模型

```typescript
interface Anniversary {
  id: string
  name: string           // 纪念日名称
  date: number           // 目标日期时间戳
  repeatType: 'none' | 'year' | 'month' | 'week' | 'day'  // 重复类型，Phase 1 仅使用 'year'
  categoryId: string     // 分类 ID（Phase 2 使用，Phase 1 默认空字符串）
  sortOrder: number      // 排序权重（Phase 3 使用，Phase 1 默认 0）
  createdAt: number
  updatedAt: number
}
```

### 分类模型（Phase 2 实现）

```typescript
interface AnniversaryCategory {
  id: string
  name: string
  color: string
  icon?: string
  createdAt: number
}
```

### 存储扩展

在 `src/utils/storage.ts` 中添加：

```typescript
export const STORAGE_KEYS = {
  EVENTS: 'events',
  EVENT_TYPES: 'eventTypes',
  ANNIVERSARIES: 'anniversaries',           // 新增
  ANNIVERSARY_CATEGORIES: 'anniversaryCategories'  // Phase 2 使用
} as const
```

## 时间计算逻辑

### 智能显示规则

- **未发生的纪念日：** 显示倒计时"还有 X 天"
- **已发生的纪念日：** 显示正计时"已经 X 天"

### 计算方法

```typescript
function calculateAnniversary(anniversary: Anniversary): {
  isFuture: boolean      // 是否未发生
  days: number           // 天数
  nextDate: number       // 下次日期时间戳
} {
  const now = Date.now()
  const targetDate = anniversary.date

  // 处理年重复：计算今年的纪念日日期
  const thisYearDate = getThisYearDate(targetDate)

  if (thisYearDate >= now) {
    // 今年还未过
    return {
      isFuture: true,
      days: Math.ceil((thisYearDate - now) / (24 * 60 * 60 * 1000)),
      nextDate: thisYearDate
    }
  } else {
    // 今年已过，计算明年
    const nextYearDate = getNextYearDate(targetDate)
    return {
      isFuture: true,
      days: Math.ceil((nextYearDate - now) / (24 * 60 * 60 * 1000)),
      nextDate: nextYearDate
    }
  }
}
```

### 正计时计算

对于已发生的事件，显示从首次日期到现在的天数：

```typescript
function calculateDaysSince(date: number): number {
  const now = Date.now()
  return Math.floor((now - date) / (24 * 60 * 60 * 1000))
}
```

## 页面设计

### 页面位置

新增页面：`src/pages/anniversary/anniversary.vue`

### TabBar 调整

- 移除「数据」Tab
- 新增「纪念日」Tab
- 最终 TabBar：事件 | 统计 | 纪念日

### 页面布局

```
┌─────────────────────────────┐
│      纪念日                  │
│      记录重要时刻             │
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐    │
│  │ 💕 结婚纪念日         │    │
│  │ 还有 15 天           │    │
│  │ 2024.06.15          │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ 🎂 妈妈生日           │    │
│  │ 已经 365 天          │    │
│  │ 2023.04.01          │    │
│  └─────────────────────┘    │
│                             │
│  [+ 添加纪念日]              │
│                             │
└─────────────────────────────┘
```

### 页面组件

1. **头部区域** — 渐变背景，标题「纪念日」，副标题「记录重要时刻」
2. **纪念日卡片列表** — 卡片式展示，每张卡片包含：
   - 名称
   - 时间显示（智能切换"还有 X 天"/"已经 X 天"）
   - 原始日期
3. **添加按钮** — 浮动渐变按钮，点击弹出添加表单
4. **CustomTabBar** — 底部导航栏

### 卡片交互

- **点击卡片：** 进入编辑模式
- **编辑模式：** 显示表单弹窗，预填现有数据，底部显示删除按钮
- **删除确认：** 二次确认弹窗

## 表单设计

### 添加/编辑表单字段

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| 名称 | 文本输入 | ✅ | - | 纪念日名称 |
| 日期 | 日期选择器 | ✅ | 今天 | 目标日期 |
| 重复 | 单选 | ✅ | 每年 | Phase 1 仅支持"每年" |

### 表单交互流程

1. 点击「添加纪念日」按钮
2. 弹出表单弹窗
3. 填写名称（必填校验）
4. 选择日期
5. 选择重复类型（Phase 1 仅展示"每年"）
6. 点击保存，创建纪念日
7. 返回列表，新纪念日按日期排序显示

## 数据管理入口调整

### 统计页新增入口

在 `src/pages/stats/stats.vue` 的统计概览区域下方，新增「数据管理」入口卡片：

```vue
<view class="section-card glass-card" @click="goToDataManager">
  <view class="section-header">
    <text class="fa-solid">&#xf0e7;</text>
    <text class="section-title">数据管理</text>
  </view>
  <view class="section-desc">导出或导入数据</view>
</view>
```

### 页面配置变更

`pages.json` 变更：
- 移除数据管理页面的 Tab 配置
- 新增纪念日页面配置
- 更新 TabBar list

## 文件结构

| 文件 | 责任 |
|------|------|
| `src/store/anniversary.ts` | 纪念日 Store，管理数据增删改查 |
| `src/pages/anniversary/anniversary.vue` | 纪念日页面 |
| `src/components/AnniversaryCard.vue` | 纪念日卡片组件 |
| `src/components/AnniversaryForm.vue` | 纪念日表单弹窗组件 |
| `src/utils/anniversary.ts` | 时间计算工具函数 |
| `src/store/event.ts` | 添加 mergeEvents action |
| `src/utils/storage.ts` | 添加 ANNIVERSARIES 存储支持 |
| `src/pages.json` | 页面和 TabBar 配置更新 |
| `src/components/CustomTabBar.vue` | TabBar 更新 |
| `src/pages/stats/stats.vue` | 添加数据管理入口 |

## 列表排序

Phase 1 默认按以下规则排序：
1. 最近要发生的排前面
2. 已过期的按原始日期倒序

## 边界情况

1. **纪念日刚好今天：** 显示"今天"
2. **纪念日明天：** 显示"明天"
3. **纪念日昨天：** 显示"昨天"
4. **跨年计算：** 正确处理闰年和跨年日期

## 错误处理

1. **名称为空：** 表单校验，提示"请输入纪念日名称"
2. **日期无效：** 日期选择器限制，不允许选择无效日期
3. **存储失败：** Toast 提示"保存失败，请重试"

## 后续阶段规划

### Phase 2 扩展功能
- 自定义分类系统（类似事件类型管理）
- 多种重复周期：年/月/周/日

### Phase 3 高级功能
- 拖拽排序
- 当天提醒推送
- 置顶功能