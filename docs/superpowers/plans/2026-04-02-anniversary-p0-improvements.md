# 纪念日 P0 改进实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成纪念日页面两项 P0 改进：补全重复方式选项 + 应用内提醒通知

**Architecture:** 修改表单组件添加重复选项，新建提醒组件并在首页集成，更新工具函数支持新的计算逻辑

**Tech Stack:** Vue 3 + TypeScript + uni-app + Pinia + SCSS

---

## 文件结构

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 修改 | `src/utils/anniversary.ts` | 补全 month/week/day 重复计算逻辑，新增 getUpcomingAnniversaries 函数 |
| 修改 | `src/components/AnniversaryForm.vue` | 添加5个重复方式选项 |
| 创建 | `src/components/AnniversaryReminder.vue` | 提醒卡片组件 |
| 修改 | `src/pages/index/index.vue` | 集成提醒组件 |

---

### Task 1: 补全 calculateAnniversary 函数的重复类型计算逻辑

**Files:**
- Modify: `src/utils/anniversary.ts:43-117`

- [ ] **Step 1: 阅读现有函数确认改动范围**

当前函数只处理了 `year` 和 `none`，缺少 `month`、`week`、`day` 的计算逻辑。需要在函数中添加这三种类型的处理。

- [ ] **Step 2: 实现每月重复的计算逻辑**

在 `calculateAnniversary` 函数的 `repeatType === 'year'` 判断后，添加 `month` 类型的处理：

```typescript
// 每月重复
if (repeatType === 'month') {
  const originalDate = new Date(date)
  const thisMonthDate = new Date(today.getFullYear(), today.getMonth(), originalDate.getDate())
  thisMonthDate.setHours(0, 0, 0, 0)
  const thisMonthTimestamp = thisMonthDate.getTime()

  if (thisMonthTimestamp >= todayTimestamp) {
    // 本月还未过
    const days = Math.ceil((thisMonthTimestamp - todayTimestamp) / (24 * 60 * 60 * 1000))
    return {
      mode: 'countdown',
      days,
      displayText: formatDaysText(days, 'countdown'),
      nextDate: thisMonthTimestamp
    }
  } else {
    // 本月已过，计算下月
    const nextMonth = today.getMonth() + 1
    const nextYear = nextMonth > 11 ? today.getFullYear() + 1 : today.getFullYear()
    const adjustedMonth = nextMonth > 11 ? 0 : nextMonth
    const nextMonthDate = new Date(nextYear, adjustedMonth, originalDate.getDate())
    nextMonthDate.setHours(0, 0, 0, 0)
    const days = Math.ceil((nextMonthDate.getTime() - todayTimestamp) / (24 * 60 * 60 * 1000))
    return {
      mode: 'countdown',
      days,
      displayText: formatDaysText(days, 'countdown'),
      nextDate: nextMonthDate.getTime()
    }
  }
}
```

- [ ] **Step 3: 实现每周重复的计算逻辑**

添加 `week` 类型的处理：

```typescript
// 每周重复
if (repeatType === 'week') {
  const originalDate = new Date(date)
  const targetDayOfWeek = originalDate.getDay()
  const todayDayOfWeek = today.getDay()

  // 计算到下一次目标星期几的天数
  let daysUntilTarget = targetDayOfWeek - todayDayOfWeek
  if (daysUntilTarget < 0) {
    daysUntilTarget += 7
  }
  if (daysUntilTarget === 0) {
    // 今天就是目标星期几，检查是否已过（简单处理：当天都显示"今天")
    const targetDate = new Date(today)
    targetDate.setHours(0, 0, 0, 0)
    return {
      mode: 'countdown',
      days: 0,
      displayText: '今天',
      nextDate: targetDate.getTime()
    }
  }

  const nextDate = new Date(todayTimestamp + daysUntilTarget * 24 * 60 * 60 * 1000)
  return {
    mode: 'countdown',
    days: daysUntilTarget,
    displayText: formatDaysText(daysUntilTarget, 'countdown'),
    nextDate: nextDate.getTime()
  }
}
```

- [ ] **Step 4: 实现每天重复的计算逻辑**

添加 `day` 类型的处理：

```typescript
// 每天重复
if (repeatType === 'day') {
  // 每天重复意味着明天又是一个新的纪念日
  const tomorrow = new Date(todayTimestamp + 24 * 60 * 60 * 1000)
  return {
    mode: 'countdown',
    days: 1,
    displayText: '明天',
    nextDate: tomorrow.getTime()
  }
}
```

- [ ] **Step 5: 确认函数结构正确**

最终函数应按此顺序处理：
1. `elapsed` 模式（正计时）
2. `year` 重复
3. `month` 重复（新增）
4. `week` 重复（新增）
5. `day` 重复（新增）
6. `none` 不重复（兜底）

- [ ] **Step 6: 提交更改**

```bash
git add src/utils/anniversary.ts
git commit -m "feat(utils): 补全纪念日 month/week/day 重复类型计算逻辑"
```

---

### Task 2: 添加 getUpcomingAnniversaries 工具函数

**Files:**
- Modify: `src/utils/anniversary.ts` (末尾新增)

- [ ] **Step 1: 定义 UpcomingAnniversary 接口**

在文件顶部接口定义区域添加：

```typescript
export interface UpcomingAnniversary {
  id: string
  name: string
  days: number        // 剩余天数（0=今天，负数=已过）
  displayText: string // 显示文本
  mode: 'countdown' | 'elapsed'
}
```

- [ ] **Step 2: 实现 getUpcomingAnniversaries 函数**

在文件末尾添加：

```typescript
/**
 * 获取即将到来的纪念日
 * @param anniversaries 纪念日列表
 * @param daysRange 范围天数（默认3）
 * @returns 筛选后的列表，按天数排序
 */
export function getUpcomingAnniversaries(
  anniversaries: AnniversaryData[],
  daysRange: number = 3
): UpcomingAnniversary[] {
  const result: UpcomingAnniversary[] = []

  for (const anniversary of anniversaries) {
    const calc = calculateAnniversary(anniversary.date, anniversary.mode, anniversary.repeatType)

    // 只关注倒计时模式，且在范围内
    if (calc.mode === 'countdown' && calc.days >= 0 && calc.days <= daysRange) {
      result.push({
        id: anniversary.id,
        name: anniversary.name,
        days: calc.days,
        displayText: calc.displayText,
        mode: calc.mode
      })
    }
  }

  // 按天数升序排序
  return result.sort((a, b) => a.days - b.days)
}
```

- [ ] **Step 3: 添加 AnniversaryData 类型导入（如需要）**

确认文件顶部已导入 AnniversaryData 类型，或使用以下类型定义：

```typescript
// 如果没有导入 AnniversaryData，使用本地简化类型
interface AnniversaryData {
  id: string
  name: string
  date: number
  repeatType: 'none' | 'year' | 'month' | 'week' | 'day'
  mode: 'countdown' | 'elapsed'
}
```

- [ ] **Step 4: 提交更改**

```bash
git add src/utils/anniversary.ts
git commit -m "feat(utils): 添加 getUpcomingAnniversaries 函数用于首页提醒"
```

---

### Task 3: 补全 AnniversaryForm 重复方式选项

**Files:**
- Modify: `src/components/AnniversaryForm.vue:59-74`

- [ ] **Step 1: 定位现有重复方式代码位置**

现有代码在模板的第59-74行，只有一个"每年"选项：

```vue
<!-- Repeat type -->
<view class="form-item">
  <view class="form-label">
    <text class="fa-solid">&#xf01e;</text>
    <text>重复方式</text>
  </view>
  <view class="repeat-options">
    <view
      class="repeat-option"
      :class="{ active: repeatType === 'year' }"
      @click="repeatType = 'year'"
    >
      <text>每年</text>
    </view>
  </view>
</view>
```

- [ ] **Step 2: 扩展模板添加5个选项**

替换整个 `repeat-options` 区域：

```vue
<view class="repeat-options">
  <view class="repeat-row">
    <view
      class="repeat-option"
      :class="{ active: repeatType === 'year' }"
      @click="repeatType = 'year'"
    >
      <text>每年</text>
    </view>
    <view
      class="repeat-option"
      :class="{ active: repeatType === 'month' }"
      @click="repeatType = 'month'"
    >
      <text>每月</text>
    </view>
    <view
      class="repeat-option"
      :class="{ active: repeatType === 'week' }"
      @click="repeatType = 'week'"
    >
      <text>每周</text>
    </view>
    <view
      class="repeat-option"
      :class="{ active: repeatType === 'day' }"
      @click="repeatType = 'day'"
    >
      <text>每天</text>
    </view>
  </view>
  <view class="repeat-row">
    <view
      class="repeat-option full-width"
      :class="{ active: repeatType === 'none' }"
      @click="repeatType = 'none'"
    >
      <text>不重复</text>
    </view>
  </view>
</view>
```

- [ ] **Step 3: 添加样式支持新布局**

在 `<style>` 部分的 `.repeat-options` 样式后添加：

```scss
.repeat-options {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  .repeat-row {
    display: flex;
    gap: $spacing-md;

    .repeat-option {
      flex: 1;
      padding: $spacing-md $spacing-lg;
      border-radius: $radius-lg;
      background: rgba(99, 102, 241, 0.05);
      border: 1px solid rgba(99, 102, 241, 0.1);
      transition: all $transition-fast;
      display: flex;
      align-items: center;
      justify-content: center;

      text {
        font-size: 28rpx;
        color: $text-secondary;
      }

      &.active {
        background: $gradient-cool;
        border-color: transparent;

        text {
          color: #ffffff;
          font-weight: 600;
        }
      }

      &.full-width {
        flex: 1;
      }
    }
  }
}
```

- [ ] **Step 4: 删除旧的 .repeat-options 样式**

删除原有的 `.repeat-options` 样式块（约347-373行），用新样式替换。

- [ ] **Step 5: 提交更改**

```bash
git add src/components/AnniversaryForm.vue
git commit -m "feat(form): 补全纪念日5种重复方式选项"
```

---

### Task 4: 创建 AnniversaryReminder 提醒组件

**Files:**
- Create: `src/components/AnniversaryReminder.vue`

- [ ] **Step 1: 创建组件文件**

```vue
<template>
  <view v-if="visible && upcomingList.length > 0" class="reminder-card glass-card">
    <view class="reminder-header">
      <view class="header-icon">
        <text class="fa-solid">&#xf004;</text>
      </view>
      <text class="header-title">纪念日提醒</text>
      <view class="close-btn" @click="onClose">
        <text class="fa-solid">&#xf00d;</text>
      </view>
    </view>

    <view class="reminder-list">
      <view
        v-for="item in upcomingList"
        :key="item.id"
        class="reminder-item"
        @click="onItemClick(item.id)"
      >
        <text class="item-dot">•</text>
        <text class="item-name">{{ item.name }}</text>
        <text class="item-days" :class="{ urgent: item.days === 0 }">
          {{ item.displayText }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UpcomingAnniversary } from '@/utils/anniversary'

const props = defineProps<{
  visible: boolean
  upcomingList: UpcomingAnniversary[]
}>()

const emit = defineEmits<{
  close: []
  navigate: [id: string]
}>()

function onClose() {
  emit('close')
}

function onItemClick(id: string) {
  emit('navigate', id)
}
</script>

<style lang="scss" scoped>
.reminder-card {
  margin: $spacing-md;
  padding: $spacing-lg;
  border-radius: $radius-lg;

  .reminder-header {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-md;

    .header-icon {
      width: 48rpx;
      height: 48rpx;
      border-radius: $radius-md;
      background: $gradient-warm;
      display: flex;
      align-items: center;
      justify-content: center;

      .fa-solid {
        font-size: 22rpx;
        color: #ffffff;
      }
    }

    .header-title {
      flex: 1;
      margin-left: $spacing-sm;
      font-size: 28rpx;
      font-weight: 600;
      color: $text-primary;
    }

    .close-btn {
      width: 44rpx;
      height: 44rpx;
      border-radius: $radius-full;
      background: rgba(99, 102, 241, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;

      .fa-solid {
        font-size: 16rpx;
        color: $text-secondary;
      }

      &:active {
        background: rgba(99, 102, 241, 0.2);
      }
    }
  }

  .reminder-list {
    .reminder-item {
      display: flex;
      align-items: center;
      padding: $spacing-sm 0;

      &:active {
        opacity: 0.8;
      }

      .item-dot {
        font-size: 24rpx;
        color: $accent-indigo;
        margin-right: $spacing-xs;
      }

      .item-name {
        flex: 1;
        font-size: 26rpx;
        color: $text-primary;
      }

      .item-days {
        font-size: 24rpx;
        color: $accent-indigo;
        font-weight: 500;

        &.urgent {
          color: $accent-rose;
          font-weight: 700;
        }
      }
    }
  }
}
</style>
```

- [ ] **Step 2: 提交新建文件**

```bash
git add src/components/AnniversaryReminder.vue
git commit -m "feat(component): 创建 AnniversaryReminder 提醒组件"
```

---

### Task 5: 在首页集成提醒组件

**Files:**
- Modify: `src/pages/index/index.vue`

- [ ] **Step 1: 导入 AnniversaryReminder 组件和 anniversary store**

在 `<script setup>` 部分添加导入：

```typescript
import { onMounted, ref, computed } from 'vue'
import { useAnniversaryStore } from '@/store/anniversary'
import { getUpcomingAnniversaries } from '@/utils/anniversary'
import AnniversaryReminder from '@/components/AnniversaryReminder.vue'
```

- [ ] **Step 2: 添加纪念日相关状态**

在现有 ref 定义后添加：

```typescript
const anniversaryStore = useAnniversaryStore()
const showReminder = ref(true)

// 即将到来的纪念日列表
const upcomingAnniversaries = computed(() => {
  return getUpcomingAnniversaries(anniversaryStore.anniversaries, 3)
})
```

- [ ] **Step 3: 在 onMounted 中加载纪念日数据**

添加一个 onMounted 钩子（如果不存在）或确保在现有 onMounted 中添加：

```typescript
onMounted(() => {
  anniversaryStore.loadFromStorage()
})
```

注意：需要检查是否已存在 onMounted，如果存在则在现有 onMounted 中添加加载逻辑。

- [ ] **Step 4: 添加提醒组件的事件处理函数**

```typescript
function onReminderClose() {
  showReminder.value = false
}

function onReminderNavigate(id: string) {
  showReminder.value = false
  uni.switchTab({
    url: '/pages/anniversary/anniversary'
  })
}
```

- [ ] **Step 5: 在模板中添加提醒组件**

在 `.header` 和 `.filter-section` 之间添加：

```vue
<!-- Anniversary Reminder -->
<AnniversaryReminder
  :visible="showReminder"
  :upcomingList="upcomingAnniversaries"
  @close="onReminderClose"
  @navigate="onReminderNavigate"
/>
```

- [ ] **Step 6: 提交更改**

```bash
git add src/pages/index/index.vue
git commit -m "feat(index): 在首页集成纪念日提醒组件"
```

---

### Task 6: 验证功能完整性

**Files:**
- 测试验证

- [ ] **Step 1: 运行项目验证编译无错误**

```bash
npm run dev:h5
# 或
npm run dev:mp-weixin
```

确认项目能正常启动，无编译错误。

- [ ] **Step 2: 手动测试重复方式功能**

测试步骤：
1. 进入纪念日页面，点击添加按钮
2. 验证5个重复方式选项都显示正确
3. 选择不同选项，保存后验证数据正确存储
4. 编辑已有纪念日，验证选项正确回显
5. 验证卡片显示的天数计算正确（每月/每周/每天）

- [ ] **Step 3: 手动测试提醒功能**

测试步骤：
1. 添加一个今天日期的纪念日，返回首页验证提醒显示"今天！"
2. 添加一个明天日期的纪念日，验证提醒显示"明天"
3. 添加一个3天后日期的纪念日，验证提醒显示"还有 X 天"
4. 添加一个7天后日期的纪念日，验证首页不显示此提醒
5. 点击提醒卡片，验证跳转到纪念日页面
6. 点击关闭按钮，验证提醒消失且本次会话不再显示

- [ ] **Step 4: 最终提交（如有修复）**

如果测试中发现问题并修复，提交修复：

```bash
git add .
git commit -m "fix: 修复纪念日 P0 功能测试中发现的问题"
```

---

## 自检清单

### 规格覆盖检查

| 规格要求 | 任务覆盖 |
|----------|----------|
| 5个重复方式平铺展示 | Task 3 |
| 第一行4个选项 + 第二行不重复 | Task 3 |
| 选中样式一致 | Task 3 |
| 首页提醒触发 | Task 5 |
| 提醒范围（今天+3天） | Task 2, 5 |
| 提醒排序 | Task 2 |
| 提醒文案（今天/明天/还有X天） | Task 2 (复用现有 formatDaysText) |
| 点击跳转纪念日页面 | Task 5 |
| 关闭后不再显示 | Task 5 |
| 无提醒时不显示 | Task 4 (组件内部条件渲染) |

### 类型一致性检查

- `UpcomingAnniversary` 接口在 `anniversary.ts` 定义，在 `AnniversaryReminder.vue` 使用
- `AnniversaryData` 类型在 `store/anniversary.ts` 和 `utils/anniversary.ts` 中保持一致
- `repeatType` 类型为 `'none' \| 'year' \| 'month' \| 'week' \| 'day'`，全文件一致
- `mode` 类型为 `'countdown' \| 'elapsed'`，全文件一致

### 占位符检查

- 无 TBD、TODO、待定内容
- 所有代码步骤包含完整实现
- 无"类似 Task X"的引用，每个任务独立完整