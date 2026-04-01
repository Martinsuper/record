# 纪念日倒计时功能实现计划（Phase 1）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-step. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 uni-app 事件记录应用新增纪念日倒计时功能，支持纪念日增删改查、智能倒计时/正计时显示、按年重复。

**Architecture:** 新增 Anniversary Store 管理数据，新建纪念日页面替换数据管理 Tab，创建卡片和表单组件，调整 TabBar 配置，在统计页添加数据管理入口。

**Tech Stack:** Vue 3, Pinia, uni-app, TypeScript, SCSS, uview-plus

---

## File Structure

| 文件 | 责任 |
|------|------|
| `src/store/anniversary.ts` | 纪念日 Store，管理增删改查和排序 |
| `src/utils/anniversary.ts` | 时间计算工具函数（倒计时/正计时） |
| `src/pages/anniversary/anniversary.vue` | 纪念日主页面 |
| `src/components/AnniversaryCard.vue` | 纪念日卡片组件 |
| `src/components/AnniversaryForm.vue` | 纪念日表单弹窗组件 |
| `src/utils/storage.ts` | 添加 ANNIVERSARIES 存储支持 |
| `src/pages.json` | 页面和 TabBar 配置更新 |
| `src/components/CustomTabBar.vue` | TabBar 更新（替换数据为纪念日） |
| `src/pages/stats/stats.vue` | 添加数据管理入口卡片 |

---

### Task 1: 扩展 storage.ts 添加纪念日存储支持

**Files:**
- Modify: `src/utils/storage.ts`

- [ ] **Step 1: 添加 ANNIVERSARIES 存储键和类型定义**

在 `src/utils/storage.ts` 中修改 `STORAGE_KEYS`：

```typescript
export const STORAGE_KEYS = {
  EVENTS: 'events',
  EVENT_TYPES: 'eventTypes',
  ANNIVERSARIES: 'anniversaries',
  ANNIVERSARY_CATEGORIES: 'anniversaryCategories'
} as const
```

在文件末尾添加纪念日相关接口和函数：

```typescript
// 纪念日类型定义
export interface AnniversaryData {
  id: string
  name: string
  date: number
  repeatType: 'none' | 'year' | 'month' | 'week' | 'day'
  categoryId: string
  sortOrder: number
  createdAt: number
  updatedAt: number
}

/**
 * 获取纪念日列表
 * @returns 纪念日数组
 */
export function getAnniversaries(): AnniversaryData[] {
  return getStorage<AnniversaryData[]>(STORAGE_KEYS.ANNIVERSARIES) || []
}

/**
 * 保存纪念日列表
 * @param anniversaries 纪念日数组
 */
export function saveAnniversaries(anniversaries: AnniversaryData[]): void {
  setStorage(STORAGE_KEYS.ANNIVERSARIES, anniversaries)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/storage.ts
git commit -m "feat(storage): 添加纪念日数据存储支持

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: 创建纪念日时间计算工具函数

**Files:**
- Create: `src/utils/anniversary.ts`

- [ ] **Step 1: 创建时间计算工具文件**

创建 `src/utils/anniversary.ts`：

```typescript
/**
 * 纪念日时间计算工具
 */

export interface AnniversaryCalcResult {
  isFuture: boolean      // 是否未发生（倒计时）
  days: number           // 天数
  displayText: string    // 显示文本
  nextDate: number       // 下次日期时间戳
}

/**
 * 获取今年同一天的时间戳
 * @param originalDate 原始日期时间戳
 * @returns 今年同一天 00:00:00 的时间戳
 */
export function getThisYearDate(originalDate: number): number {
  const date = new Date(originalDate)
  const thisYear = new Date().getFullYear()
  const thisYearDate = new Date(thisYear, date.getMonth(), date.getDate())
  return thisYearDate.getTime()
}

/**
 * 获取明年同一天的时间戳
 * @param originalDate 原始日期时间戳
 * @returns 明年同一天 00:00:00 的时间戳
 */
export function getNextYearDate(originalDate: number): number {
  const date = new Date(originalDate)
  const nextYear = new Date().getFullYear() + 1
  const nextYearDate = new Date(nextYear, date.getMonth(), date.getDate())
  return nextYearDate.getTime()
}

/**
 * 计算纪念日
 * @param date 原始日期时间戳
 * @param repeatType 重复类型
 * @returns 计算结果
 */
export function calculateAnniversary(
  date: number,
  repeatType: 'none' | 'year' | 'month' | 'week' | 'day' = 'year'
): AnniversaryCalcResult {
  const now = Date.now()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTimestamp = today.getTime()

  // 对于年重复
  if (repeatType === 'year') {
    const thisYearDate = getThisYearDate(date)

    if (thisYearDate >= todayTimestamp) {
      // 今年还未过
      const days = Math.ceil((thisYearDate - todayTimestamp) / (24 * 60 * 60 * 1000))
      return {
        isFuture: true,
        days,
        displayText: formatDaysText(days, true),
        nextDate: thisYearDate
      }
    } else {
      // 今年已过，计算明年
      const nextYearDate = getNextYearDate(date)
      const days = Math.ceil((nextYearDate - todayTimestamp) / (24 * 60 * 60 * 1000))
      return {
        isFuture: true,
        days,
        displayText: formatDaysText(days, true),
        nextDate: nextYearDate
      }
    }
  }

  // 不重复：判断是否已过
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  const targetTimestamp = targetDate.getTime()

  if (targetTimestamp >= todayTimestamp) {
    // 未发生
    const days = Math.ceil((targetTimestamp - todayTimestamp) / (24 * 60 * 60 * 1000))
    return {
      isFuture: true,
      days,
      displayText: formatDaysText(days, true),
      nextDate: targetTimestamp
    }
  } else {
    // 已发生，显示正计时
    const days = Math.floor((todayTimestamp - targetTimestamp) / (24 * 60 * 60 * 1000))
    return {
      isFuture: false,
      days,
      displayText: formatDaysText(days, false),
      nextDate: targetTimestamp
    }
  }
}

/**
 * 格式化天数显示文本
 * @param days 天数
 * @param isFuture 是否未发生
 * @returns 显示文本
 */
export function formatDaysText(days: number, isFuture: boolean): string {
  if (isFuture) {
    // 倒计时
    if (days === 0) return '今天'
    if (days === 1) return '明天'
    return `还有 ${days} 天`
  } else {
    // 正计时
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    return `已经 ${days} 天`
  }
}

/**
 * 格式化日期显示
 * @param timestamp 时间戳
 * @returns 格式化后的日期字符串
 */
export function formatAnniversaryDate(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/anniversary.ts
git commit -m "feat(utils): 添加纪念日时间计算工具函数

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: 创建 Anniversary Store

**Files:**
- Create: `src/store/anniversary.ts`

- [ ] **Step 1: 创建 Store 文件**

创建 `src/store/anniversary.ts`：

```typescript
import { defineStore } from 'pinia'
import { getAnniversaries, saveAnniversaries, AnniversaryData } from '@/utils/storage'
import { calculateAnniversary } from '@/utils/anniversary'

/**
 * 生成唯一的纪念日ID
 */
function generateAnniversaryId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `anniversary_${timestamp}_${random}`
}

export const useAnniversaryStore = defineStore('anniversary', {
  state: () => ({
    anniversaries: [] as AnniversaryData[],
    isLoaded: false
  }),

  getters: {
    /**
     * 纪念日总数
     */
    totalCount: (state): number => {
      return state.anniversaries.length
    },

    /**
     * 排序后的纪念日列表
     * 规则：最近要发生的排前面
     */
    sortedAnniversaries: (state): AnniversaryData[] => {
      return [...state.anniversaries].sort((a, b) => {
        const calcA = calculateAnniversary(a.date, a.repeatType)
        const calcB = calculateAnniversary(b.date, b.repeatType)
        return calcA.days - calcB.days
      })
    }
  },

  actions: {
    /**
     * 从存储加载纪念日
     */
    loadFromStorage(): void {
      if (this.isLoaded) return

      const storedAnniversaries = getAnniversaries()
      this.anniversaries = storedAnniversaries.map((item) => ({
        id: item.id,
        name: item.name || '',
        date: item.date || Date.now(),
        repeatType: item.repeatType || 'year',
        categoryId: item.categoryId || '',
        sortOrder: item.sortOrder || 0,
        createdAt: item.createdAt || Date.now(),
        updatedAt: item.updatedAt || Date.now()
      }))
      this.isLoaded = true
    },

    /**
     * 保存纪念日到存储
     */
    saveToStorage(): void {
      saveAnniversaries(this.anniversaries)
    },

    /**
     * 添加新纪念日
     * @param data 纪念日数据
     */
    addAnniversary(data: Omit<AnniversaryData, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>): void {
      const newAnniversary: AnniversaryData = {
        ...data,
        id: generateAnniversaryId(),
        sortOrder: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      this.anniversaries.push(newAnniversary)
      this.saveToStorage()
    },

    /**
     * 删除纪念日
     * @param id 纪念日ID
     */
    deleteAnniversary(id: string): void {
      const index = this.anniversaries.findIndex(a => a.id === id)
      if (index !== -1) {
        this.anniversaries.splice(index, 1)
        this.saveToStorage()
      }
    },

    /**
     * 更新纪念日
     * @param id 纪念日ID
     * @param data 更新的数据
     */
    updateAnniversary(id: string, data: Partial<Omit<AnniversaryData, 'id' | 'createdAt'>>): void {
      const target = this.anniversaries.find(a => a.id === id)
      if (target) {
        Object.assign(target, data, { updatedAt: Date.now() })
        this.saveToStorage()
      }
    },

    /**
     * 根据ID获取纪念日
     * @param id 纪念日ID
     */
    getAnniversaryById(id: string): AnniversaryData | undefined {
      return this.anniversaries.find(a => a.id === id)
    }
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add src/store/anniversary.ts
git commit -m "feat(store): 创建纪念日 Store

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: 创建 AnniversaryCard 组件

**Files:**
- Create: `src/components/AnniversaryCard.vue`

- [ ] **Step 1: 创建卡片组件**

创建 `src/components/AnniversaryCard.vue`：

```vue
<template>
  <view class="anniversary-card glass-card" @click="handleClick">
    <view class="card-content">
      <view class="card-header">
        <text class="card-name">{{ name }}</text>
      </view>
      <view class="card-time">
        <text class="time-text" :class="{ 'countdown': isFuture, 'elapsed': !isFuture }">
          {{ displayText }}
        </text>
      </view>
      <view class="card-date">
        <text class="fa-solid">&#xf133;</text>
        <text class="date-text">{{ formattedDate }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { calculateAnniversary, formatAnniversaryDate } from '@/utils/anniversary'

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  date: {
    type: Number,
    required: true
  },
  repeatType: {
    type: String as () => 'none' | 'year' | 'month' | 'week' | 'day',
    default: 'year'
  }
})

const emit = defineEmits(['click'])

// 计算纪念日
const calcResult = computed(() => {
  return calculateAnniversary(props.date, props.repeatType)
})

// 是否未发生
const isFuture = computed(() => calcResult.value.isFuture)

// 显示文本
const displayText = computed(() => calcResult.value.displayText)

// 格式化日期
const formattedDate = computed(() => formatAnniversaryDate(props.date))

function handleClick() {
  emit('click', props.id)
}
</script>

<style lang="scss" scoped>
.anniversary-card {
  margin-bottom: $spacing-md;
  padding: $spacing-lg;
  border-radius: $radius-lg;
  transition: all $transition-fast;

  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }

  .card-content {
    .card-header {
      margin-bottom: $spacing-sm;

      .card-name {
        font-size: 32rpx;
        font-weight: 600;
        color: $text-primary;
      }
    }

    .card-time {
      margin-bottom: $spacing-sm;

      .time-text {
        font-size: 40rpx;
        font-weight: 700;

        &.countdown {
          color: $accent-indigo;
        }

        &.elapsed {
          color: $accent-purple;
        }
      }
    }

    .card-date {
      display: flex;
      align-items: center;
      gap: $spacing-xs;

      .fa-solid {
        font-size: 20rpx;
        color: $text-muted;
      }

      .date-text {
        font-size: 24rpx;
        color: $text-secondary;
      }
    }
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AnniversaryCard.vue
git commit -m "feat(component): 创建纪念日卡片组件

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: 创建 AnniversaryForm 组件

**Files:**
- Create: `src/components/AnniversaryForm.vue`

- [ ] **Step 1: 创建表单弹窗组件**

创建 `src/components/AnniversaryForm.vue`：

```vue
<template>
  <u-popup :show="visible" mode="bottom" round="24" @close="onClose">
    <view class="anniversary-form glass-card">
      <!-- Header -->
      <view class="form-header">
        <view class="header-icon">
          <text v-if="isEditMode" class="fa-solid">&#xf044;</text>
          <text v-else class="fa-solid">&#xf067;</text>
        </view>
        <text class="form-title gradient-text">{{ isEditMode ? '编辑纪念日' : '添加纪念日' }}</text>
        <view class="close-btn" @click="onClose">
          <text class="fa-solid">&#xf00d;</text>
        </view>
      </view>

      <!-- Form body -->
      <view class="form-body">
        <!-- Name -->
        <view class="form-item">
          <view class="form-label">
            <text class="fa-solid">&#xf304;</text>
            <text>纪念日名称</text>
          </view>
          <view class="input-wrapper">
            <u-input
              v-model="anniversaryName"
              placeholder="请输入纪念日名称"
              border="none"
              :customStyle="{ fontSize: '32rpx', color: '#1E1B4B' }"
              :placeholderStyle="{ color: '#9CA3AF' }"
            />
          </view>
        </view>

        <!-- Date -->
        <view class="form-item">
          <view class="form-label">
            <text class="fa-solid">&#xf133;</text>
            <text>目标日期</text>
          </view>
          <view class="date-picker-row">
            <u-datetime-picker
              :show="showDatePicker"
              v-model="anniversaryDate"
              mode="date"
              title="选择日期"
              @confirm="onDateConfirm"
              @cancel="showDatePicker = false"
              @close="showDatePicker = false"
            />
            <view class="date-display" @click="showDatePicker = true">
              <text class="fa-solid">&#xf073;</text>
              <text class="date-text">{{ formattedDate }}</text>
              <text class="fa-solid">&#xf054;</text>
            </view>
          </view>
        </view>

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
      </view>

      <!-- Footer -->
      <view class="form-footer">
        <view v-if="isEditMode" class="btn-delete" @click="onDelete">
          <text class="fa-solid">&#xf2ed;</text>
          <text>删除</text>
        </view>
        <view class="btn-cancel" @click="onClose">
          <text>取消</text>
        </view>
        <view class="btn-save" @click="onSave">
          <text class="fa-solid">&#xf00c;</text>
          <text>保存</text>
        </view>
      </view>
    </view>
  </u-popup>

  <!-- Delete confirm modal -->
  <u-modal
    :show="showDeleteConfirm"
    title="确认删除"
    content="确定要删除这个纪念日吗？"
    showCancelButton
    @confirm="confirmDelete"
    @cancel="showDeleteConfirm = false"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAnniversaryStore } from '@/store/anniversary'
import { formatAnniversaryDate } from '@/utils/anniversary'

interface EditData {
  id: string
  name: string
  date: number
  repeatType: 'none' | 'year' | 'month' | 'week' | 'day'
}

const props = defineProps({
  visible: Boolean,
  isEditMode: Boolean,
  editData: Object as () => EditData | null
})

const emit = defineEmits(['close', 'save'])

const anniversaryStore = useAnniversaryStore()

const anniversaryName = ref('')
const anniversaryDate = ref(Date.now())
const repeatType = ref<'none' | 'year' | 'month' | 'week' | 'day'>('year')
const showDatePicker = ref(false)
const showDeleteConfirm = ref(false)

const formattedDate = computed(() => {
  return formatAnniversaryDate(anniversaryDate.value)
})

// Reset form when visible changes
watch(() => props.visible, (val) => {
  if (val) {
    anniversaryName.value = ''
    anniversaryDate.value = Date.now()
    repeatType.value = 'year'

    // 编辑模式填充数据
    if (props.isEditMode && props.editData) {
      anniversaryName.value = props.editData.name
      anniversaryDate.value = props.editData.date
      repeatType.value = props.editData.repeatType
    }
  }
})

function onDateConfirm(e: { value: number }) {
  anniversaryDate.value = e.value
  showDatePicker.value = false
}

function onSave() {
  // Validate
  if (!anniversaryName.value.trim()) {
    uni.showToast({ title: '请输入纪念日名称', icon: 'none' })
    return
  }

  if (props.isEditMode && props.editData) {
    // 更新
    anniversaryStore.updateAnniversary(props.editData.id, {
      name: anniversaryName.value.trim(),
      date: anniversaryDate.value,
      repeatType: repeatType.value
    })
    uni.showToast({ title: '纪念日已更新', icon: 'success' })
  } else {
    // 新增
    anniversaryStore.addAnniversary({
      name: anniversaryName.value.trim(),
      date: anniversaryDate.value,
      repeatType: repeatType.value,
      categoryId: ''
    })
    uni.showToast({ title: '纪念日已添加', icon: 'success' })
  }

  emit('save')
  emit('close')
}

function onDelete() {
  showDeleteConfirm.value = true
}

function confirmDelete() {
  if (props.isEditMode && props.editData) {
    anniversaryStore.deleteAnniversary(props.editData.id)
    uni.showToast({ title: '纪念日已删除', icon: 'success' })
    emit('save')
    emit('close')
  }
  showDeleteConfirm.value = false
}

function onClose() {
  emit('close')
}
</script>

<style lang="scss" scoped>
.anniversary-form {
  border-radius: $radius-xl $radius-xl 0 0;
  padding: $spacing-lg;
  padding-bottom: calc($spacing-lg + env(safe-area-inset-bottom));

  .form-header {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-xl;

    .header-icon {
      width: 64rpx;
      height: 64rpx;
      border-radius: $radius-lg;
      background: $gradient-warm;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: $spacing-md;

      .fa-solid {
        font-size: 28rpx;
        color: #ffffff;
      }
    }

    .form-title {
      flex: 1;
      font-size: 36rpx;
      font-weight: 700;
    }

    .close-btn {
      width: 56rpx;
      height: 56rpx;
      border-radius: $radius-full;
      background: rgba(99, 102, 241, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;

      .fa-solid {
        font-size: 18rpx;
        color: $text-secondary;
      }
    }
  }

  .form-body {
    .form-item {
      margin-bottom: $spacing-xl;

      .form-label {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        margin-bottom: $spacing-md;

        .fa-solid {
          font-size: 16rpx;
          color: $accent-indigo;
        }

        text {
          font-size: 28rpx;
          font-weight: 600;
          color: $text-primary;
        }
      }

      .input-wrapper {
        background: rgba(99, 102, 241, 0.05);
        border-radius: $radius-lg;
        padding: $spacing-md;
        border: 1px solid rgba(99, 102, 241, 0.1);
        transition: all $transition-fast;

        &:focus-within {
          border-color: $accent-indigo;
          background: rgba(99, 102, 241, 0.08);
        }
      }

      .date-picker-row {
        .date-display {
          display: flex;
          align-items: center;
          background: rgba(99, 102, 241, 0.05);
          border-radius: $radius-lg;
          padding: $spacing-md;
          border: 1px solid rgba(99, 102, 241, 0.1);
          gap: $spacing-md;

          .fa-solid {
            font-size: 20rpx;
            color: $accent-indigo;
          }

          .date-text {
            flex: 1;
            font-size: 32rpx;
            color: $text-primary;
            font-weight: 500;
          }
        }
      }

      .repeat-options {
        display: flex;
        gap: $spacing-md;

        .repeat-option {
          padding: $spacing-md $spacing-lg;
          border-radius: $radius-lg;
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.1);
          transition: all $transition-fast;

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
        }
      }
    }
  }

  .form-footer {
    display: flex;
    gap: $spacing-md;
    margin-top: $spacing-xl;

    .btn-cancel {
      flex: 1;
      height: 88rpx;
      border-radius: $radius-lg;
      background: rgba(99, 102, 241, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;

      text {
        font-size: 32rpx;
        font-weight: 600;
        color: $text-secondary;
      }
    }

    .btn-save {
      flex: 2;
      height: 88rpx;
      border-radius: $radius-lg;
      background: $gradient-warm;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-sm;
      box-shadow: $shadow-glow;

      .fa-solid {
        font-size: 20rpx;
        color: #ffffff;
      }

      text {
        font-size: 32rpx;
        font-weight: 600;
        color: #ffffff;
      }
    }

    .btn-delete {
      height: 88rpx;
      padding: 0 $spacing-lg;
      border-radius: $radius-lg;
      background: rgba(239, 68, 68, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-xs;

      .fa-solid {
        font-size: 20rpx;
        color: #EF4444;
      }

      text {
        font-size: 28rpx;
        font-weight: 600;
        color: #EF4444;
      }
    }
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AnniversaryForm.vue
git commit -m "feat(component): 创建纪念日表单弹窗组件

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: 创建纪念日主页面

**Files:**
- Create: `src/pages/anniversary/anniversary.vue`

- [ ] **Step 1: 创建页面文件**

创建 `src/pages/anniversary/anniversary.vue`：

```vue
<template>
  <view class="page-anniversary" :style="{ '--nav-bar-height': navBarHeight + 'px' }">
    <!-- Gradient header -->
    <view class="header">
      <view class="header-bg"></view>
      <view class="header-content glass-card">
        <text class="fa-solid">&#xf004;</text>
        <view class="header-text">
          <text class="header-title">纪念日</text>
          <text class="header-subtitle">记录重要时刻</text>
        </view>
      </view>
    </view>

    <!-- Anniversary list -->
    <view class="list-section">
      <view v-if="anniversaries.length === 0" class="empty-state">
        <text class="fa-solid">&#xf004;</text>
        <text class="empty-text">还没有纪念日</text>
        <text class="empty-hint">点击右下角按钮添加</text>
      </view>

      <view v-else class="anniversary-list">
        <AnniversaryCard
          v-for="item in anniversaries"
          :key="item.id"
          :id="item.id"
          :name="item.name"
          :date="item.date"
          :repeatType="item.repeatType"
          @click="onCardClick"
        />
      </view>
    </view>

    <!-- Floating add button -->
    <view class="add-btn pulse-glow" @click="showForm = true">
      <text class="fa-solid">&#xf067;</text>
    </view>

    <!-- Anniversary form popup -->
    <AnniversaryForm
      :visible="showForm"
      @close="showForm = false"
      @save="onFormSaved"
    />

    <!-- Edit form popup -->
    <AnniversaryForm
      :visible="showEditForm"
      :isEditMode="true"
      :editData="editingAnniversary"
      @close="showEditForm = false"
      @save="onFormSaved"
    />

    <!-- Custom TabBar -->
    <CustomTabBar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAnniversaryStore } from '@/store/anniversary'
import AnniversaryCard from '@/components/AnniversaryCard.vue'
import AnniversaryForm from '@/components/AnniversaryForm.vue'
import CustomTabBar from '@/components/CustomTabBar.vue'

const anniversaryStore = useAnniversaryStore()

// 动态计算导航栏高度
const navBarHeight = computed(() => {
  const height = uni.getStorageSync('navBarHeight')
  return height || 88
})

// 纪念日列表
const anniversaries = computed(() => anniversaryStore.sortedAnniversaries)

// 表单状态
const showForm = ref(false)
const showEditForm = ref(false)
const editingAnniversary = ref<{ id: string; name: string; date: number; repeatType: 'none' | 'year' | 'month' | 'week' | 'day' } | null>(null)

// 加载数据
onMounted(() => {
  anniversaryStore.loadFromStorage()
})

function onCardClick(id: string) {
  const anniversary = anniversaryStore.getAnniversaryById(id)
  if (anniversary) {
    editingAnniversary.value = {
      id: anniversary.id,
      name: anniversary.name,
      date: anniversary.date,
      repeatType: anniversary.repeatType
    }
    showEditForm.value = true
  }
}

function onFormSaved() {
  showForm.value = false
  showEditForm.value = false
  editingAnniversary.value = null
}
</script>

<style lang="scss" scoped>
.page-anniversary {
  min-height: 100vh;
  padding-bottom: calc(100rpx + env(safe-area-inset-bottom) + $spacing-lg);

  .header {
    position: relative;
    padding: $spacing-xl $spacing-md;
    /* #ifdef MP */
    padding-top: calc(var(--nav-bar-height) + $spacing-xl);
    /* #endif */
    /* #ifdef H5 */
    padding-top: $spacing-xl;
    /* #endif */

    .header-bg {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      height: calc(var(--nav-bar-height) + 200rpx);
      background: $gradient-warm;
      opacity: 0.15;
      border-radius: 0 0 $radius-xl $radius-xl;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      padding: $spacing-lg;

      .fa-solid {
        font-size: 36rpx;
        color: $accent-rose;
      }

      .header-text {
        flex: 1;

        .header-title {
          font-size: 40rpx;
          font-weight: 700;
          color: $text-primary;
          display: block;
        }

        .header-subtitle {
          font-size: 24rpx;
          color: $text-secondary;
          margin-top: $spacing-xs;
          display: block;
        }
      }
    }
  }

  .list-section {
    padding: $spacing-md;

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 120rpx $spacing-xl;

      .fa-solid {
        font-size: 80rpx;
        color: $text-light;
        margin-bottom: $spacing-lg;
      }

      .empty-text {
        font-size: 32rpx;
        color: $text-secondary;
        margin-bottom: $spacing-sm;
      }

      .empty-hint {
        font-size: 26rpx;
        color: $text-muted;
      }
    }

    .anniversary-list {
      // List styles if needed
    }
  }

  .add-btn {
    position: fixed;
    right: $spacing-xl;
    bottom: calc(100rpx + env(safe-area-inset-bottom) + $spacing-xl);
    width: 120rpx;
    height: 120rpx;
    border-radius: $radius-full;
    background: $gradient-warm;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 32rpx rgba(249, 115, 22, 0.4);
    transition: all $transition-normal;
    z-index: 1000;

    .fa-solid {
      font-size: 44rpx;
      color: #ffffff;
    }

    &:active {
      transform: scale(0.92);
      box-shadow: 0 0 30rpx rgba(249, 115, 22, 0.5);
    }
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/anniversary/anniversary.vue
git commit -m "feat(page): 创建纪念日主页面

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: 更新 pages.json 配置

**Files:**
- Modify: `src/pages.json`

- [ ] **Step 1: 添加纪念日页面，更新 TabBar**

修改 `src/pages.json`，在 pages 数组中添加纪念日页面（在 data-manager 之后）：

```json
{
  "path": "pages/anniversary/anniversary",
  "style": {
    "navigationBarTitleText": "纪念日",
    "navigationBarBackgroundColor": "#FDF4FF",
    "navigationBarTextStyle": "black",
    "navigationStyle": "custom"
  }
}
```

修改 tabBar.list，将「数据」替换为「纪念日」：

```json
"list": [
  {
    "pagePath": "pages/index/index",
    "text": "事件"
  },
  {
    "pagePath": "pages/stats/stats",
    "text": "统计"
  },
  {
    "pagePath": "pages/anniversary/anniversary",
    "text": "纪念日"
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add src/pages.json
git commit -m "feat(config): 添加纪念日页面配置，更新 TabBar

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: 更新 CustomTabBar 组件

**Files:**
- Modify: `src/components/CustomTabBar.vue`

- [ ] **Step 1: 更新 TabBar 项目**

修改模板中的第三个 tab-item：

```vue
    <view
      class="tab-item"
      :class="{ active: currentIndex === 2 }"
      @click="switchTab(2)"
    >
      <text class="fa-solid">&#xf004;</text>
      <text class="tab-text">纪念日</text>
    </view>
```

修改 pages 数组：

```typescript
const pages = [
  '/pages/index/index',
  '/pages/stats/stats',
  '/pages/anniversary/anniversary'
]
```

修改 getCurrentPageIndex 函数：

```typescript
function getCurrentPageIndex(): number {
  const pageStack = getCurrentPages()
  if (pageStack.length === 0) return 0
  const currentPage = pageStack[pageStack.length - 1]
  const route = currentPage.route || ''

  if (route === 'pages/stats/stats') return 1
  if (route === 'pages/anniversary/anniversary') return 2
  return 0
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CustomTabBar.vue
git commit -m "feat(tabbar): 更新 TabBar 为纪念日入口

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 9: 在统计页添加数据管理入口

**Files:**
- Modify: `src/pages/stats/stats.vue`

- [ ] **Step 1: 添加数据管理入口卡片**

在 `src/pages/stats/stats.vue` 的模板中，在「近7天趋势」section-card 之后、CustomTabBar 之前添加：

```vue
    <!-- Data management entry -->
    <view class="section-card glass-card fade-in-up" style="animation-delay: 0.5s" @click="goToDataManager">
      <view class="section-header">
        <text class="fa-solid">&#xf0e7;</text>
        <text class="section-title">数据管理</text>
      </view>
      <view class="section-desc">导出或导入数据</view>
      <view class="entry-arrow">
        <text class="fa-solid">&#xf054;</text>
      </view>
    </view>
```

在 script 中添加导航函数：

```typescript
function goToDataManager() {
  uni.navigateTo({
    url: '/pages/data-manager/data-manager'
  })
}
```

在样式的 `.section-card` 中添加相对定位支持（如果需要）：

```scss
    .section-card {
      // ... 现有样式
      position: relative;

      .entry-arrow {
        position: absolute;
        right: $spacing-lg;
        top: 50%;
        transform: translateY(-50%);

        .fa-solid {
          font-size: 20rpx;
          color: $text-muted;
        }
      }

      .section-desc {
        // ... 现有样式
        padding-right: $spacing-xl;
      }
    }
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/stats/stats.vue
git commit -m "feat(stats): 在统计页添加数据管理入口卡片

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 10: 最终验证

**Files:**
- None (验证步骤)

- [ ] **Step 1: 检查 TypeScript 类型**

```bash
npm run type-check
```

Expected: No type errors

- [ ] **Step 2: 运行开发服务器**

```bash
npm run dev:h5
```

Expected: 应用正常运行，TabBar 显示「事件」「统计」「纪念日」

- [ ] **Step 3: 手动测试纪念日功能**

1. 进入纪念日页面
2. 点击添加按钮
3. 输入名称、选择日期
4. 保存，检查卡片显示
5. 点击卡片，编辑并保存
6. 删除纪念日

- [ ] **Step 4: 手动测试数据管理入口**

1. 进入统计页面
2. 点击「数据管理」卡片
3. 确认能正常跳转到数据管理页面

- [ ] **Step 5: 最终 Commit**

```bash
git add -A
git commit -m "feat: 完成纪念日倒计时功能 Phase 1

- 新增纪念日独立页面
- 支持纪念日增删改查
- 智能显示倒计时/正计时
- 默认按年重复
- 数据管理入口移至统计页

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```