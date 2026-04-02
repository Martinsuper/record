# 纪念日 P2 里程碑提示实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在正计时模式下显示里程碑标签（第1天、第100天、第1年等）

**Architecture:** 在工具函数中添加里程碑配置和查找函数，在卡片组件中计算并显示里程碑标签

**Tech Stack:** Vue 3 + TypeScript + SCSS

---

## 文件结构

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 修改 | `src/utils/anniversary.ts` | 添加 MILESTONES 配置和 getMilestone 函数 |
| 修改 | `src/components/AnniversaryCard.vue` | 添加里程碑标签显示 |

---

### Task 1: 添加里程碑工具函数

**Files:**
- Modify: `src/utils/anniversary.ts`

- [ ] **Step 1: 添加 Milestone 接口和 MILESTONES 配置**

在文件顶部接口定义区域添加：

```typescript
// 里程碑类型定义
export interface Milestone {
  days: number
  text: string
  emoji: string
}

// 里程碑配置
const MILESTONES: Milestone[] = [
  { days: 1, text: '第1天', emoji: '🎉' },
  { days: 7, text: '第7天', emoji: '📅' },
  { days: 30, text: '第30天', emoji: '🗓️' },
  { days: 100, text: '第100天', emoji: '💯' },
  { days: 365, text: '第1年', emoji: '🏆' },
  { days: 500, text: '第500天', emoji: '⭐' },
  { days: 1000, text: '第1000天', emoji: '👑' }
]
```

- [ ] **Step 2: 添加 getMilestone 函数**

在文件末尾添加：

```typescript
/**
 * 获取里程碑提示
 * @param days 已过天数
 * @returns 里程碑信息，无里程碑返回 null
 */
export function getMilestone(days: number): Milestone | null {
  return MILESTONES.find(m => m.days === days) || null
}
```

- [ ] **Step 3: 提交更改**

```bash
git add src/utils/anniversary.ts
git commit -m "feat(utils): 添加纪念日里程碑配置和 getMilestone 函数"
```

---

### Task 2: 在卡片中显示里程碑标签

**Files:**
- Modify: `src/components/AnniversaryCard.vue`

- [ ] **Step 1: 导入 getMilestone 函数**

在 `<script setup>` 部分修改导入：

```typescript
import { computed } from 'vue'
import { calculateAnniversary, formatAnniversaryDate, getMilestone } from '@/utils/anniversary'
```

- [ ] **Step 2: 添加里程碑计算属性**

在现有 computed 属性后添加：

```typescript
// 计算里程碑（仅正计时模式）
const milestone = computed(() => {
  if (props.mode !== 'elapsed') return null
  return getMilestone(calcResult.value.days)
})

const milestoneText = computed(() => {
  if (!milestone.value) return null
  return `${milestone.value.emoji} ${milestone.value.text}`
})
```

- [ ] **Step 3: 在模板中添加里程碑标签**

在 `.card-time` 区域后、`.card-date` 区域前添加：

```vue
<!-- 里程碑标签 -->
<view v-if="milestoneText" class="card-milestone">
  <text class="milestone-text">{{ milestoneText }}</text>
</view>
```

- [ ] **Step 4: 添加里程碑样式**

在 `<style>` 部分添加：

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

- [ ] **Step 5: 提交更改**

```bash
git add src/components/AnniversaryCard.vue
git commit -m "feat(card): 在正计时模式下显示里程碑标签"
```

---

### Task 3: 验证功能完整性

**Files:**
- 测试验证

- [ ] **Step 1: 运行项目验证编译**

```bash
npm run dev:h5
```

确认无编译错误。

- [ ] **Step 2: 手动测试里程碑功能**

1. 添加一个今天的纪念日，验证显示"🎉 第1天"
2. 添加一个100天前的纪念日，验证显示"💯 第100天"
3. 添加一个非里程碑天数的纪念日，验证不显示标签
4. 添加一个倒计时纪念日，验证不显示里程碑标签

- [ ] **Step 3: 最终提交（如有修复）**

```bash
git add .
git commit -m "fix: 修复里程碑功能测试中发现的问题"
```

---

## 自检清单

### 规格覆盖检查

| 规格要求 | 任务覆盖 |
|----------|----------|
| 7个里程碑节点 | Task 1 |
| 仅正计时显示 | Task 2 |
| 精确匹配天数 | Task 1 |
| 卡片内小标签样式 | Task 2 |
| 不影响布局 | Task 2 (v-if 条件渲染) |

### 类型一致性检查

- `Milestone` 接口在 `anniversary.ts` 定义
- `getMilestone` 返回 `Milestone | null`
- 卡片组件正确处理 null 情况