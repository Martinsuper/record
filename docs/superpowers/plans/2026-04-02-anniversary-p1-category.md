# 纪念日 P1 分类管理实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现纪念日分类管理功能，包括分类存储、分类选择器、卡片图标显示和页面筛选

**Architecture:** 新建分类 Store 和选择器组件，修改存储层添加分类函数，更新表单和卡片组件支持分类

**Tech Stack:** Vue 3 + TypeScript + uni-app + Pinia + SCSS

---

## 文件结构

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 新建 | `src/store/anniversaryCategory.ts` | 分类 Store |
| 新建 | `src/components/AnniversaryCategoryPicker.vue` | 分类选择器组件 |
| 新建 | `src/components/AnniversaryCategoryForm.vue` | 分类表单组件 |
| 修改 | `src/utils/storage.ts` | 添加分类存储函数 |
| 修改 | `src/store/anniversary.ts` | 添加筛选逻辑 |
| 修改 | `src/components/AnniversaryForm.vue` | 添加分类选择 |
| 修改 | `src/components/AnniversaryCard.vue` | 显示分类图标 |
| 修改 | `src/pages/anniversary/anniversary.vue` | 添加筛选条 |

---

### Task 1: 添加分类存储函数

**Files:**
- Modify: `src/utils/storage.ts`

- [ ] **Step 1: 添加 AnniversaryCategory 接口定义**

在 `AnniversaryData` 接口之后添加：

```typescript
// 纪念日分类类型定义
export interface AnniversaryCategory {
  id: string
  name: string
  icon: string         // Font Awesome 图标编码
  isPreset: boolean    // 是否为预设分类
  sortOrder: number    // 排序权重
}
```

- [ ] **Step 2: 添加获取分类列表函数**

在文件末尾添加：

```typescript
/**
 * 获取纪念日分类列表
 * @returns 分类数组
 */
export function getAnniversaryCategories(): AnniversaryCategory[] {
  return getStorage<AnniversaryCategory[]>(STORAGE_KEYS.ANNIVERSARY_CATEGORIES) || []
}

/**
 * 保存纪念日分类列表
 * @param categories 分类数组
 */
export function saveAnniversaryCategories(categories: AnniversaryCategory[]): void {
  setStorage(STORAGE_KEYS.ANNIVERSARY_CATEGORIES, categories)
}
```

- [ ] **Step 3: 提交更改**

```bash
git add src/utils/storage.ts
git commit -m "feat(storage): 添加纪念日分类存储函数"
```

---

### Task 2: 创建分类 Store

**Files:**
- Create: `src/store/anniversaryCategory.ts`

- [ ] **Step 1: 创建 Store 文件**

```typescript
import { defineStore } from 'pinia'
import { getAnniversaryCategories, saveAnniversaryCategories } from '@/utils/storage'
import type { AnniversaryCategory } from '@/utils/storage'

// 预设分类
const PRESET_CATEGORIES: AnniversaryCategory[] = [
  { id: 'birthday', name: '生日', icon: '\uf1fd', isPreset: true, sortOrder: 1 },
  { id: 'love', name: '恋爱', icon: '\uf004', isPreset: true, sortOrder: 2 },
  { id: 'wedding', name: '结婚', icon: '\uf802', isPreset: true, sortOrder: 3 },
  { id: 'festival', name: '节日', icon: '\uf56b', isPreset: true, sortOrder: 4 },
  { id: 'work', name: '工作', icon: '\uf0b1', isPreset: true, sortOrder: 5 },
  { id: 'onboard', name: '入职', icon: '\uf073', isPreset: true, sortOrder: 6 },
  { id: 'memorial', name: '纪念日', icon: '\uf4e3', isPreset: true, sortOrder: 7 },
  { id: 'other', name: '其他', icon: '\uf02d', isPreset: true, sortOrder: 8 }
]

export const useAnniversaryCategoryStore = defineStore('anniversaryCategory', {
  state: () => ({
    categories: [] as AnniversaryCategory[],
    isLoaded: false
  }),

  getters: {
    /**
     * 预设分类列表
     */
    presetCategories: (state): AnniversaryCategory[] => {
      return state.categories.filter(c => c.isPreset).sort((a, b) => a.sortOrder - b.sortOrder)
    },

    /**
     * 自定义分类列表
     */
    customCategories: (state): AnniversaryCategory[] => {
      return state.categories.filter(c => !c.isPreset).sort((a, b) => a.sortOrder - b.sortOrder)
    },

    /**
     * 全部分类（预设在前，自定义在后）
     */
    allCategories(): AnniversaryCategory[] {
      return [...this.presetCategories, ...this.customCategories]
    }
  },

  actions: {
    /**
     * 从存储加载分类
     */
    loadFromStorage(): void {
      if (this.isLoaded) return

      const storedCategories = getAnniversaryCategories()

      if (storedCategories.length === 0) {
        // 首次加载，初始化预设分类
        this.categories = [...PRESET_CATEGORIES]
        this.saveToStorage()
      } else {
        // 确保预设分类存在（处理版本升级情况）
        const presetIds = new Set(PRESET_CATEGORIES.map(p => p.id))
        const customCategories = storedCategories.filter(c => !presetIds.has(c.id))
        this.categories = [...PRESET_CATEGORIES, ...customCategories]
      }

      this.isLoaded = true
    },

    /**
     * 保存分类到存储
     */
    saveToStorage(): void {
      saveAnniversaryCategories(this.categories)
    },

    /**
     * 添加自定义分类
     */
    addCategory(data: Omit<AnniversaryCategory, 'id' | 'isPreset' | 'sortOrder'>): AnniversaryCategory {
      const maxSortOrder = Math.max(0, ...this.customCategories.map(c => c.sortOrder))
      const newCategory: AnniversaryCategory = {
        ...data,
        id: `custom_${Date.now()}`,
        isPreset: false,
        sortOrder: maxSortOrder + 1
      }
      this.categories.push(newCategory)
      this.saveToStorage()
      return newCategory
    },

    /**
     * 更新分类
     */
    updateCategory(id: string, data: Partial<Omit<AnniversaryCategory, 'id' | 'isPreset'>>): void {
      const target = this.categories.find(c => c.id === id)
      if (target && !target.isPreset) {
        Object.assign(target, data)
        this.saveToStorage()
      }
    },

    /**
     * 删除分类（仅自定义可删）
     */
    deleteCategory(id: string): boolean {
      const index = this.categories.findIndex(c => c.id === id)
      if (index !== -1 && !this.categories[index].isPreset) {
        this.categories.splice(index, 1)
        this.saveToStorage()
        return true
      }
      return false
    },

    /**
     * 根据 ID 获取分类
     */
    getCategoryById(id: string): AnniversaryCategory | undefined {
      return this.categories.find(c => c.id === id)
    }
  }
})
```

- [ ] **Step 2: 提交新建文件**

```bash
git add src/store/anniversaryCategory.ts
git commit -m "feat(store): 创建纪念日分类 Store"
```

---

### Task 3: 创建分类选择器组件

**Files:**
- Create: `src/components/AnniversaryCategoryPicker.vue`

- [ ] **Step 1: 创建组件文件**

```vue
<template>
  <u-popup :show="visible" mode="bottom" round="24" @close="onClose">
    <view class="category-picker glass-card">
      <!-- Header -->
      <view class="picker-header">
        <text class="picker-title">选择分类</text>
        <view class="close-btn" @click="onClose">
          <text class="fa-solid">&#xf00d;</text>
        </view>
      </view>

      <!-- Preset categories -->
      <view class="category-section">
        <text class="section-label">预设分类</text>
        <view class="category-grid">
          <view
            v-for="category in presetCategories"
            :key="category.id"
            class="category-item"
            :class="{ active: selectedId === category.id }"
            @click="onSelect(category.id)"
          >
            <text class="fa-solid">{{ category.icon }}</text>
            <text class="category-name">{{ category.name }}</text>
          </view>
        </view>
      </view>

      <!-- Custom categories -->
      <view class="category-section">
        <text class="section-label">自定义分类</text>
        <view v-if="customCategories.length === 0" class="empty-tip">
          <text>无自定义分类</text>
        </view>
        <view v-else class="category-grid">
          <view
            v-for="category in customCategories"
            :key="category.id"
            class="category-item"
            :class="{ active: selectedId === category.id }"
            @click="onSelect(category.id)"
          >
            <text class="fa-solid">{{ category.icon }}</text>
            <text class="category-name">{{ category.name }}</text>
          </view>
        </view>
      </view>

      <!-- Add button -->
      <view class="add-btn" @click="showCategoryForm = true">
        <text class="fa-solid">&#xf067;</text>
        <text>新建分类</text>
      </view>
    </view>

    <!-- Category form popup -->
    <AnniversaryCategoryForm
      :visible="showCategoryForm"
      @close="showCategoryForm = false"
      @save="onCategoryAdded"
    />
  </u-popup>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAnniversaryCategoryStore } from '@/store/anniversaryCategory'
import AnniversaryCategoryForm from './AnniversaryCategoryForm.vue'

const props = defineProps<{
  visible: boolean
  selectedId: string
}>()

const emit = defineEmits<{
  close: []
  select: [id: string]
}>()

const categoryStore = useAnniversaryCategoryStore()
const showCategoryForm = ref(false)

const presetCategories = computed(() => categoryStore.presetCategories)
const customCategories = computed(() => categoryStore.customCategories)

function onClose() {
  emit('close')
}

function onSelect(id: string) {
  emit('select', id)
  emit('close')
}

function onCategoryAdded(id: string) {
  showCategoryForm.value = false
  // 自动选中新创建的分类
  emit('select', id)
  emit('close')
}
</script>

<style lang="scss" scoped>
.category-picker {
  border-radius: $radius-xl $radius-xl 0 0;
  padding: $spacing-lg;
  padding-bottom: calc($spacing-lg + env(safe-area-inset-bottom));

  .picker-header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $spacing-lg;
    position: relative;

    .picker-title {
      font-size: 32rpx;
      font-weight: 600;
      color: $text-primary;
    }

    .close-btn {
      position: absolute;
      right: 0;
      width: 48rpx;
      height: 48rpx;
      border-radius: $radius-full;
      background: rgba(99, 102, 241, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;

      .fa-solid {
        font-size: 16rpx;
        color: $text-secondary;
      }
    }
  }

  .category-section {
    margin-bottom: $spacing-lg;

    .section-label {
      font-size: 24rpx;
      color: $text-muted;
      margin-bottom: $spacing-sm;
      display: block;
    }

    .empty-tip {
      padding: $spacing-md;
      text-align: center;

      text {
        font-size: 26rpx;
        color: $text-light;
      }
    }

    .category-grid {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-sm;

      .category-item {
        width: calc(25% - 12rpx);
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: $spacing-md 0;
        border-radius: $radius-lg;
        background: rgba(99, 102, 241, 0.05);
        border: 1px solid rgba(99, 102, 241, 0.1);
        transition: all $transition-fast;

        .fa-solid {
          font-size: 32rpx;
          color: $accent-indigo;
          margin-bottom: $spacing-xs;
        }

        .category-name {
          font-size: 24rpx;
          color: $text-secondary;
        }

        &.active {
          background: $gradient-cool;
          border-color: transparent;

          .fa-solid,
          .category-name {
            color: #ffffff;
          }
        }

        &:active {
          transform: scale(0.96);
        }
      }
    }
  }

  .add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    padding: $spacing-md;
    border-radius: $radius-lg;
    border: 1px dashed rgba(99, 102, 241, 0.3);

    .fa-solid {
      font-size: 24rpx;
      color: $accent-indigo;
    }

    text {
      font-size: 28rpx;
      color: $accent-indigo;
    }

    &:active {
      background: rgba(99, 102, 241, 0.05);
    }
  }
}
</style>
```

- [ ] **Step 2: 提交新建文件**

```bash
git add src/components/AnniversaryCategoryPicker.vue
git commit -m "feat(component): 创建 AnniversaryCategoryPicker 分类选择器"
```

---

### Task 4: 创建分类表单组件

**Files:**
- Create: `src/components/AnniversaryCategoryForm.vue`

- [ ] **Step 1: 创建组件文件**

```vue
<template>
  <u-popup :show="visible" mode="bottom" round="24" @close="onClose">
    <view class="category-form glass-card">
      <!-- Header -->
      <view class="form-header">
        <text class="form-title">新建分类</text>
        <view class="close-btn" @click="onClose">
          <text class="fa-solid">&#xf00d;</text>
        </view>
      </view>

      <!-- Form body -->
      <view class="form-body">
        <!-- Name -->
        <view class="form-item">
          <view class="form-label">
            <text>分类名称</text>
          </view>
          <view class="input-wrapper">
            <u-input
              v-model="categoryName"
              placeholder="请输入分类名称"
              border="none"
              :customStyle="{ fontSize: '32rpx', color: '#1E1B4B' }"
              :placeholderStyle="{ color: '#9CA3AF' }"
            />
          </view>
        </view>

        <!-- Icon -->
        <view class="form-item">
          <view class="form-label">
            <text>选择图标</text>
          </view>
          <view class="icon-grid">
            <view
              v-for="icon in availableIcons"
              :key="icon.code"
              class="icon-item"
              :class="{ active: selectedIcon === icon.code }"
              @click="selectedIcon = icon.code"
            >
              <text class="fa-solid">{{ icon.code }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Footer -->
      <view class="form-footer">
        <view class="btn-cancel" @click="onClose">
          <text>取消</text>
        </view>
        <view class="btn-save" @click="onSave">
          <text>保存</text>
        </view>
      </view>
    </view>
  </u-popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAnniversaryCategoryStore } from '@/store/anniversaryCategory'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [id: string]
}>()

const categoryStore = useAnniversaryCategoryStore()

const categoryName = ref('')
const selectedIcon = ref('\uf02d') // 默认书签图标

// 可选图标列表
const availableIcons = [
  { code: '\uf1fd', name: '生日蛋糕' },
  { code: '\uf004', name: '心形' },
  { code: '\uf802', name: '戒指' },
  { code: '\uf56b', name: '庆祝' },
  { code: '\uf0b1', name: '公文包' },
  { code: '\uf073', name: '日历' },
  { code: '\uf4e3', name: '心形确认' },
  { code: '\uf02d', name: '书签' },
  { code: '\uf005', name: '星星' },
  { code: '\uf0f3', name: '铃铛' },
  { code: '\uf06b', name: '礼物' },
  { code: '\uf015', name: '房子' }
]

// Reset form when visible changes
watch(() => props.visible, (val) => {
  if (val) {
    categoryName.value = ''
    selectedIcon.value = '\uf02d'
  }
})

function onClose() {
  emit('close')
}

function onSave() {
  if (!categoryName.value.trim()) {
    uni.showToast({ title: '请输入分类名称', icon: 'none' })
    return
  }

  const newCategory = categoryStore.addCategory({
    name: categoryName.value.trim(),
    icon: selectedIcon.value
  })

  uni.showToast({ title: '分类已创建', icon: 'success' })
  emit('save', newCategory.id)
  emit('close')
}
</script>

<style lang="scss" scoped>
.category-form {
  border-radius: $radius-xl $radius-xl 0 0;
  padding: $spacing-lg;
  padding-bottom: calc($spacing-lg + env(safe-area-inset-bottom));

  .form-header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $spacing-xl;
    position: relative;

    .form-title {
      font-size: 32rpx;
      font-weight: 600;
      color: $text-primary;
    }

    .close-btn {
      position: absolute;
      right: 0;
      width: 48rpx;
      height: 48rpx;
      border-radius: $radius-full;
      background: rgba(99, 102, 241, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;

      .fa-solid {
        font-size: 16rpx;
        color: $text-secondary;
      }
    }
  }

  .form-body {
    .form-item {
      margin-bottom: $spacing-xl;

      .form-label {
        font-size: 28rpx;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: $spacing-md;
      }

      .input-wrapper {
        background: rgba(99, 102, 241, 0.05);
        border-radius: $radius-lg;
        padding: $spacing-md;
        border: 1px solid rgba(99, 102, 241, 0.1);
      }

      .icon-grid {
        display: flex;
        flex-wrap: wrap;
        gap: $spacing-sm;

        .icon-item {
          width: 72rpx;
          height: 72rpx;
          border-radius: $radius-lg;
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all $transition-fast;

          .fa-solid {
            font-size: 28rpx;
            color: $text-secondary;
          }

          &.active {
            background: $gradient-cool;
            border-color: transparent;

            .fa-solid {
              color: #ffffff;
            }
          }

          &:active {
            transform: scale(0.92);
          }
        }
      }
    }
  }

  .form-footer {
    display: flex;
    gap: $spacing-md;

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
      flex: 1;
      height: 88rpx;
      border-radius: $radius-lg;
      background: $gradient-warm;
      display: flex;
      align-items: center;
      justify-content: center;

      text {
        font-size: 32rpx;
        font-weight: 600;
        color: #ffffff;
      }
    }
  }
}
</style>
```

- [ ] **Step 2: 提交新建文件**

```bash
git add src/components/AnniversaryCategoryForm.vue
git commit -m "feat(component): 创建 AnniversaryCategoryForm 分类表单"
```

---

### Task 5: 修改表单添加分类选择

**Files:**
- Modify: `src/components/AnniversaryForm.vue`

- [ ] **Step 1: 导入分类 Store 和选择器组件**

在 `<script setup>` 部分添加导入：

```typescript
import { useAnniversaryCategoryStore } from '@/store/anniversaryCategory'
import AnniversaryCategoryPicker from './AnniversaryCategoryPicker.vue'
```

- [ ] **Step 2: 添加分类相关状态**

在现有 ref 定义后添加：

```typescript
const categoryStore = useAnniversaryCategoryStore()
const showCategoryPicker = ref(false)
const selectedCategoryId = ref('other')

// 获取当前选中分类的显示文本
const selectedCategoryDisplay = computed(() => {
  const category = categoryStore.getCategoryById(selectedCategoryId.value)
  return category ? `${category.icon} ${category.name}` : '选择分类'
})
```

- [ ] **Step 3: 在 onMounted/watch 中加载分类数据**

在 `watch(() => props.visible, ...)` 中添加：

```typescript
// 在 watch 的 val 为 true 的分支中添加
selectedCategoryId.value = 'other'

// 编辑模式填充分类
if (props.isEditMode && props.editData) {
  // ... 现有代码 ...
  selectedCategoryId.value = (props.editData as any).categoryId || 'other'
}
```

- [ ] **Step 4: 添加选择器事件处理**

```typescript
function onCategorySelect(id: string) {
  selectedCategoryId.value = id
  showCategoryPicker.value = false
}
```

- [ ] **Step 5: 更新 onSave 函数**

在 `anniversaryStore.addAnniversary` 和 `anniversaryStore.updateAnniversary` 调用中添加 `categoryId`：

```typescript
// 新增
anniversaryStore.addAnniversary({
  name: anniversaryName.value.trim(),
  date: anniversaryDate.value,
  repeatType: repeatType.value,
  mode: displayMode.value,
  categoryId: selectedCategoryId.value  // 添加这行
})

// 更新
anniversaryStore.updateAnniversary(props.editData.id, {
  name: anniversaryName.value.trim(),
  date: anniversaryDate.value,
  repeatType: repeatType.value,
  mode: displayMode.value,
  categoryId: selectedCategoryId.value  // 添加这行
})
```

- [ ] **Step 6: 在模板中添加分类选择项**

在"纪念日名称"和"目标日期"之间添加：

```vue
<!-- Category -->
<view class="form-item">
  <view class="form-label">
    <text class="fa-solid">&#xf02b;</text>
    <text>分类</text>
  </view>
  <view class="category-select" @click="showCategoryPicker = true">
    <text class="category-text">{{ selectedCategoryDisplay }}</text>
    <text class="fa-solid">&#xf054;</text>
  </view>
</view>

<!-- Category Picker -->
<AnniversaryCategoryPicker
  :visible="showCategoryPicker"
  :selectedId="selectedCategoryId"
  @close="showCategoryPicker = false"
  @select="onCategorySelect"
/>
```

- [ ] **Step 7: 添加分类选择样式**

在 `.form-body .form-item` 样式中添加：

```scss
.category-select {
  display: flex;
  align-items: center;
  background: rgba(99, 102, 241, 0.05);
  border-radius: $radius-lg;
  padding: $spacing-md;
  border: 1px solid rgba(99, 102, 241, 0.1);
  gap: $spacing-md;

  .category-text {
    flex: 1;
    font-size: 32rpx;
    color: $text-primary;
    font-weight: 500;
  }

  .fa-solid {
    font-size: 16rpx;
    color: $text-muted;
  }
}
```

- [ ] **Step 8: 更新 EditData 接口**

```typescript
interface EditData {
  id: string
  name: string
  date: number
  repeatType: 'none' | 'year' | 'month' | 'week' | 'day'
  mode: 'countdown' | 'elapsed'
  categoryId: string  // 添加这行
}
```

- [ ] **Step 9: 提交更改**

```bash
git add src/components/AnniversaryForm.vue
git commit -m "feat(form): 在纪念日表单中添加分类选择"
```

---

### Task 6: 在卡片上显示分类图标

**Files:**
- Modify: `src/components/AnniversaryCard.vue`

- [ ] **Step 1: 添加 categoryId prop**

在 props 中添加：

```typescript
categoryId: {
  type: String,
  default: ''
}
```

- [ ] **Step 2: 导入分类 Store 并计算图标**

在 `<script setup>` 中添加：

```typescript
import { computed } from 'vue'
import { useAnniversaryCategoryStore } from '@/store/anniversaryCategory'

const categoryStore = useAnniversaryCategoryStore()

// 计算分类图标
const categoryIcon = computed(() => {
  if (!props.categoryId) return null
  const category = categoryStore.getCategoryById(props.categoryId)
  return category?.icon || null
})
```

- [ ] **Step 3: 在模板中显示图标**

在 `.card-header` 中修改：

```vue
<view class="card-header">
  <text class="card-name">{{ name }}</text>
  <text v-if="categoryIcon" class="fa-solid category-icon">{{ categoryIcon }}</text>
</view>
```

- [ ] **Step 4: 添加图标样式**

在 `.card-header` 样式中添加：

```scss
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;  // 修改为 space-between
  margin-bottom: $spacing-sm;

  .card-name {
    font-size: 32rpx;
    font-weight: 600;
    color: $text-primary;
  }

  .category-icon {
    font-size: 24rpx;
    color: $text-muted;
  }
}
```

- [ ] **Step 5: 提交更改**

```bash
git add src/components/AnniversaryCard.vue
git commit -m "feat(card): 在纪念日卡片上显示分类图标"
```

---

### Task 7: 添加筛选逻辑到 Store

**Files:**
- Modify: `src/store/anniversary.ts`

- [ ] **Step 1: 添加筛选状态**

在 state 中添加：

```typescript
state: () => ({
  anniversaries: [] as AnniversaryData[],
  isLoaded: false,
  selectedCategoryId: null as string | null  // 新增
}),
```

- [ ] **Step 2: 添加筛选 getter**

在 getters 中添加：

```typescript
/**
 * 根据分类筛选后的纪念日列表
 */
filteredAnniversaries(): AnniversaryData[] {
  if (!this.selectedCategoryId) {
    return this.sortedAnniversaries
  }
  return this.sortedAnniversaries.filter(a => a.categoryId === this.selectedCategoryId)
},
```

- [ ] **Step 3: 添加筛选 action**

在 actions 中添加：

```typescript
/**
 * 设置分类筛选
 */
setCategoryFilter(categoryId: string | null): void {
  this.selectedCategoryId = categoryId
},
```

- [ ] **Step 4: 提交更改**

```bash
git add src/store/anniversary.ts
git commit -m "feat(store): 添加纪念日分类筛选逻辑"
```

---

### Task 8: 在页面添加筛选条

**Files:**
- Modify: `src/pages/anniversary/anniversary.vue`

- [ ] **Step 1: 导入分类 Store**

在 `<script setup>` 中添加：

```typescript
import { useAnniversaryCategoryStore } from '@/store/anniversaryCategory'
```

- [ ] **Step 2: 添加分类相关状态**

```typescript
const categoryStore = useAnniversaryCategoryStore()

// 计算筛选后的列表
const displayAnniversaries = computed(() => anniversaryStore.filteredAnniversaries)

// 筛选变更
function onFilterChange(categoryId: string | null) {
  anniversaryStore.setCategoryFilter(categoryId)
}
```

- [ ] **Step 3: 在 onMounted 中加载分类数据**

```typescript
onMounted(() => {
  anniversaryStore.loadFromStorage()
  categoryStore.loadFromStorage()  // 添加这行
})
```

- [ ] **Step 4: 在模板中添加筛选条**

在 `.header` 和 `.list-section` 之间添加：

```vue
<!-- Category filter -->
<view class="filter-bar">
  <scroll-view scroll-x class="filter-scroll">
    <view class="filter-item" :class="{ active: !anniversaryStore.selectedCategoryId }" @click="onFilterChange(null)">
      <text>全部</text>
    </view>
    <view
      v-for="category in categoryStore.allCategories"
      :key="category.id"
      class="filter-item"
      :class="{ active: anniversaryStore.selectedCategoryId === category.id }"
      @click="onFilterChange(category.id)"
    >
      <text class="fa-solid">{{ category.icon }}</text>
      <text>{{ category.name }}</text>
    </view>
  </scroll-view>
</view>
```

- [ ] **Step 5: 更新列表使用筛选后的数据**

将 `anniversaries` 改为 `displayAnniversaries`：

```vue
<AnniversaryCard
  v-for="item in displayAnniversaries"
  :key="item.id"
  :id="item.id"
  :name="item.name"
  :date="item.date"
  :repeatType="item.repeatType"
  :mode="item.mode"
  :categoryId="item.categoryId"
  @click="onCardClick"
/>
```

- [ ] **Step 6: 添加筛选条样式**

```scss
.filter-bar {
  padding: $spacing-sm $spacing-md;

  .filter-scroll {
    white-space: nowrap;

    .filter-item {
      display: inline-flex;
      align-items: center;
      gap: $spacing-xs;
      padding: $spacing-sm $spacing-md;
      margin-right: $spacing-sm;
      border-radius: $radius-full;
      background: rgba(99, 102, 241, 0.05);
      border: 1px solid rgba(99, 102, 241, 0.1);
      transition: all $transition-fast;

      .fa-solid {
        font-size: 18rpx;
        color: $text-secondary;
      }

      text {
        font-size: 26rpx;
        color: $text-secondary;
      }

      &.active {
        background: $gradient-cool;
        border-color: transparent;

        .fa-solid,
        text {
          color: #ffffff;
        }
      }

      &:active {
        transform: scale(0.96);
      }
    }
  }
}
```

- [ ] **Step 7: 提交更改**

```bash
git add src/pages/anniversary/anniversary.vue
git commit -m "feat(page): 在纪念日页面添加分类筛选条"
```

---

### Task 9: 验证功能完整性

**Files:**
- 测试验证

- [ ] **Step 1: 运行项目验证编译**

```bash
npm run dev:h5
```

确认无编译错误。

- [ ] **Step 2: 手动测试分类功能**

1. 进入纪念日页面，验证筛选条显示正确
2. 点击不同分类，验证筛选生效
3. 添加纪念日，验证分类选择功能
4. 验证卡片显示分类图标
5. 新建自定义分类，验证保存和选择

- [ ] **Step 3: 最终提交（如有修复）**

```bash
git add .
git commit -m "fix: 修复分类功能测试中发现的问题"
```

---

## 自检清单

### 规格覆盖检查

| 规格要求 | 任务覆盖 |
|----------|----------|
| 分类数据结构 | Task 1 |
| 预设8类分类 | Task 2 |
| 分类存储函数 | Task 1 |
| 分类 Store | Task 2 |
| 分类选择器组件 | Task 3 |
| 分类表单组件 | Task 4 |
| 表单添加分类选择 | Task 5 |
| 卡片显示图标 | Task 6 |
| Store 筛选逻辑 | Task 7 |
| 页面筛选条 | Task 8 |

### 类型一致性检查

- `AnniversaryCategory` 接口在 `storage.ts` 定义，在 Store 和组件中使用
- `categoryId` 类型为 `string`，全文件一致
- 预设分类 ID 固定为字符串字面量