# 纪念日 P2 阶段改进设计：里程碑提示

## 概述

本设计文档涵盖纪念日页面的里程碑提示功能：
- 正计时模式下显示里程碑标签
- 7个基础里程碑节点
- 卡片内小标签样式

---

## 一、里程碑节点

### 基础里程碑（7个）

| 天数 | 显示文案 | emoji | 含义 |
|------|----------|-------|------|
| 第1天 | 第1天 | 🎉 | 纪念日开始 |
| 第7天 | 第7天 | 📅 | 一周 |
| 第30天 | 第30天 | 🗓️ | 一个月 |
| 第100天 | 第100天 | 💯 | 百日 |
| 第365天 | 第1年 | 🏆 | 一周年 |
| 第500天 | 第500天 | ⭐ | 五百天 |
| 第1000天 | 第1000天 | 👑 | 千日 |

### 里程碑配置

```typescript
const MILESTONES = [
  { days: 1, text: '第1天', emoji: '🎉' },
  { days: 7, text: '第7天', emoji: '📅' },
  { days: 30, text: '第30天', emoji: '🗓️' },
  { days: 100, text: '第100天', emoji: '💯' },
  { days: 365, text: '第1年', emoji: '🏆' },
  { days: 500, text: '第500天', emoji: '⭐' },
  { days: 1000, text: '第1000天', emoji: '👑' }
] as const
```

---

## 二、显示逻辑

### 显示条件

1. **仅正计时模式**：`mode === 'elapsed'` 时才显示里程碑
2. **精确匹配**：天数必须精确等于里程碑节点才显示
3. **不占空间**：无里程碑时不渲染，不影响布局

### 显示位置

在 `AnniversaryCard.vue` 卡片中，时间文本（`已经 X 天`）下方显示：

```
┌─────────────────────────────────────┐
│ 恋爱纪念日                      💕  │
│ 已经 100 天                         │
│ 🎉 第100天                          │  ← 里程碑标签
│ 📅 2023.09.15                       │
└─────────────────────────────────────┘
```

---

## 三、工具函数

### 新增函数

**文件位置**：`src/utils/anniversary.ts`

```typescript
interface Milestone {
  days: number
  text: string
  emoji: string
}

/**
 * 获取里程碑提示
 * @param days 已过天数
 * @returns 里程碑信息，无里程碑返回 null
 */
export function getMilestone(days: number): Milestone | null
```

### 实现逻辑

```typescript
export function getMilestone(days: number): Milestone | null {
  return MILESTONES.find(m => m.days === days) || null
}
```

---

## 四、UI 改动

### AnniversaryCard.vue

**模板改动**

在 `.card-time` 区域下方添加里程碑标签：

```vue
<view class="card-time">
  <text class="time-text elapsed">
    {{ displayText }}
  </text>
</view>

<!-- 里程碑标签 -->
<view v-if="milestoneText" class="card-milestone">
  <text class="milestone-text">{{ milestoneText }}</text>
</view>
```

**脚本改动**

```typescript
import { getMilestone } from '@/utils/anniversary'

// 计算里程碑
const milestone = computed(() => {
  if (props.mode !== 'elapsed') return null
  return getMilestone(calcResult.value.days)
})

const milestoneText = computed(() => {
  if (!milestone.value) return null
  return `${milestone.value.emoji} ${milestone.value.text}`
})
```

**样式改动**

```scss
.card-milestone {
  margin-bottom: $spacing-sm;

  .milestone-text {
    display: inline-block;
    font-size: 20rpx;
    color: $accent-rose;
    background: rgba(236, 72, 153, 0.1);
    padding: 4rpx 12rpx;
    border-radius: $radius-xs;
  }
}
```

---

## 五、文件改动清单

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 修改 | `src/utils/anniversary.ts` | 添加 MILESTONES 配置和 getMilestone 函数 |
| 修改 | `src/components/AnniversaryCard.vue` | 添加里程碑标签显示 |

---

## 六、测试要点

1. **正计时里程碑**
   - 第1天显示"🎉 第1天"
   - 第100天显示"💯 第100天"
   - 第365天显示"🏆 第1年"
   - 非里程碑天数不显示标签

2. **倒计时无里程碑**
   - 倒计时模式下不显示里程碑标签

3. **样式验证**
   - 标签样式与卡片整体风格一致
   - 不影响现有卡片布局