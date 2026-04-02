# 纪念日 P2 搜索功能 + 数据备份实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现纪念日搜索功能（仅名称搜索，Header 展开式）和数据备份功能（JSON 导出/导入）

**Architecture:** Store 层添加搜索状态和导入合并逻辑，页面层添加搜索 UI 和备份 UI

**Tech Stack:** Vue 3 + TypeScript + Pinia + uni-app + uView UI

---

## 文件结构

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 修改 | `src/store/anniversary.ts` | 添加搜索 state、修改 getter、添加 mergeAnniversaries action |
| 修改 | `src/store/anniversaryCategory.ts` | 添加 mergeCategories action |
| 修改 | `src/pages/anniversary/anniversary.vue` | 添加搜索按钮和搜索框 UI |
| 修改 | `src/pages/data-manager/data-manager.vue` | 添加纪念日导出/导入区块和预览弹窗 |

---

### Task 1: Store 层添加搜索状态和导入合并逻辑

**Files:**
- Modify: `src/store/anniversary.ts`
- Modify: `src/store/anniversaryCategory.ts`

- [ ] **Step 1: 在 anniversary.ts 添加搜索 state**

在 `state` 函数中添加 `searchKeyword`：

```typescript
state: () => ({
  anniversaries: [] as AnniversaryData[],
  isLoaded: false,
  selectedCategoryId: null as string | null,
  searchKeyword: ''  // 新增：搜索关键词
}),
```

- [ ] **Step 2: 修改 filteredAnniversaries getter**

将现有的 `filteredAnniversaries` getter 替换为同时支持分类筛选和搜索的版本：

```typescript
/**
 * 筛选后的纪念日列表
 * 同时考虑分类筛选和搜索关键词
 */
filteredAnniversaries: (state): AnniversaryData[] => {
  let result = state.anniversaries

  // 分类筛选
  if (state.selectedCategoryId) {
    result = result.filter(a => a.categoryId === state.selectedCategoryId)
  }

  // 名称搜索（实时搜索）
  if (state.searchKeyword.trim()) {
    const keyword = state.searchKeyword.trim().toLowerCase()
    result = result.filter(a => a.name.toLowerCase().includes(keyword))
  }

  return result
},
```

- [ ] **Step 3: 在 anniversary.ts 添加搜索和导入 actions**

在 `actions` 对象末尾添加：

```typescript
/**
 * 设置搜索关键词
 * @param keyword 搜索关键词
 */
setSearchKeyword(keyword: string): void {
  this.searchKeyword = keyword
},

/**
 * 清空搜索
 */
clearSearch(): void {
  this.searchKeyword = ''
},

/**
 * 合并导入的纪念日数据
 * @param imported 导入的纪念日列表
 * @returns 新增和更新的数量
 */
mergeAnniversaries(imported: AnniversaryData[]): { added: number, updated: number } {
  let added = 0
  let updated = 0

  for (const item of imported) {
    const existing = this.anniversaries.find(a => a.id === item.id)
    if (existing) {
      // 更新现有数据（保留较新的 updatedAt）
      if (item.updatedAt > existing.updatedAt) {
        Object.assign(existing, item)
        updated++
      }
    } else {
      // 新增数据
      this.anniversaries.push(item)
      added++
    }
  }

  this.saveToStorage()
  return { added, updated }
}
```

- [ ] **Step 4: 在 anniversaryCategory.ts 添加 mergeCategories action**

在 `actions` 对象末尾添加：

```typescript
/**
 * 合并导入的分类数据
 * @param imported 导入的分类列表
 * @returns 新增和跳过的数量
 */
mergeCategories(imported: AnniversaryCategory[]): { added: number, skipped: number } {
  let added = 0
  let skipped = 0

  for (const item of imported) {
    const existing = this.categories.find(c => c.id === item.id)
    if (existing) {
      // 已存在的分类跳过（预设分类不可修改，自定义分类保留本地）
      skipped++
    } else if (!item.isPreset) {
      // 仅新增自定义分类
      this.categories.push(item)
      added++
    }
  }

  this.saveToStorage()
  return { added, skipped }
}
```

- [ ] **Step 5: 提交更改**

```bash
git add src/store/anniversary.ts src/store/anniversaryCategory.ts
git commit -m "feat(store): 添加纪念日搜索状态和导入合并逻辑"

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

### Task 2: 纪念日页面添加搜索 UI

**Files:**
- Modify: `src/pages/anniversary/anniversary.vue`

- [ ] **Step 1: 添加搜索相关状态和 watch**

在 `<script setup>` 部分添加状态和方法：

在 `const categoryStore = useAnniversaryCategoryStore()` 后添加：

```typescript
// 搜索状态
const showSearch = ref(false)
const searchInput = ref('')

// 监听搜索输入，实时筛选
watch(searchInput, (val) => {
  anniversaryStore.setSearchKeyword(val)
})

// 切换搜索显示
function toggleSearch() {
  showSearch.value = !showSearch.value
  if (!showSearch.value) {
    searchInput.value = ''
    anniversaryStore.clearSearch()
  }
}
```

同时需要在 import 中添加 `watch`：

```typescript
import { ref, computed, onMounted, watch } from 'vue'
```

- [ ] **Step 2: 在模板 Header 区域添加搜索按钮**

修改 `.header-content` 区域，在内部末尾添加搜索按钮：

```vue
<view class="header-content glass-card">
  <text class="fa-solid">&#xf004;</text>
  <view class="header-text">
    <text class="header-title">纪念日</text>
    <text class="header-subtitle">记录重要时刻</text>
  </view>
  <!-- 搜索按钮 -->
  <view class="search-btn" @click="toggleSearch">
    <text class="fa-solid">{{ showSearch ? '&#xf00d;' : '&#xf002;' }}</text>
  </view>
</view>
```

- [ ] **Step 3: 在模板中添加搜索框展开区域**

在 `.header` 区域后、`.filter-bar` 区域前添加：

```vue
<!-- Search box -->
<view v-if="showSearch" class="search-section">
  <view class="search-box glass-card">
    <text class="fa-solid">&#xf002;</text>
    <u-input
      v-model="searchInput"
      placeholder="请输入纪念日名称"
      border="none"
      :customStyle="{ fontSize: '28rpx', color: '#1E1B4B' }"
      :placeholderStyle="{ color: '#9CA3AF' }"
      :focus="showSearch"
    />
  </view>
</view>
```

- [ ] **Step 4: 添加搜索相关样式**

在 `<style>` 部分的 `.header-content` 内添加搜索按钮样式：

```scss
.header-content {
  // ... 现有样式 ...

  .search-btn {
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
```

在 `.header` 样式块后添加搜索框样式：

```scss
.search-section {
  padding: $spacing-sm $spacing-md;

  .search-box {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-md;

    .fa-solid {
      font-size: 18rpx;
      color: $text-muted;
    }
  }
}
```

- [ ] **Step 5: 提交更改**

```bash
git add src/pages/anniversary/anniversary.vue
git commit -m "feat(anniversary): 添加纪念日搜索功能"

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

### Task 3: 数据管理页面添加纪念日备份功能

**Files:**
- Modify: `src/pages/data-manager/data-manager.vue`

- [ ] **Step 1: 导入纪念日相关 store**

在现有 import 后添加：

```typescript
import { useAnniversaryStore } from '@/store/anniversary'
import { useAnniversaryCategoryStore } from '@/store/anniversaryCategory'
import type { AnniversaryData } from '@/utils/storage'
import type { AnniversaryCategory } from '@/utils/storage'
```

在 `const eventTypeStore = useEventTypeStore()` 后添加：

```typescript
const anniversaryStore = useAnniversaryStore()
const categoryStore = useAnniversaryCategoryStore()
```

- [ ] **Step 2: 添加纪念日统计数据**

在现有统计 computed 后添加：

```typescript
// 纪念日统计
const totalAnniversaries = computed(() => anniversaryStore.totalCount)
const totalCategories = computed(() => categoryStore.allCategories.length)
```

- [ ] **Step 3: 添加导出数据类型和预览状态**

在 `interface ExportData` 后添加：

```typescript
// 纪念日导出数据接口定义
interface AnniversaryExportData {
  version: number
  anniversaries: AnniversaryData[]
  categories: AnniversaryCategory[]
  exportedAt: number
}
```

在现有 `previewData` ref 后添加纪念日预览状态：

```typescript
// 纪念日导入预览状态
const showAnniversaryPreview = ref(false)
const previewAnniversaryData = ref({
  anniversaryCount: 0,
  categoryCount: 0,
  anniversaries: [] as AnniversaryData[],
  categories: [] as AnniversaryCategory[]
})
```

- [ ] **Step 4: 添加纪念日导出和导入方法**

在 `confirmImport` 函数后添加：

```typescript
/**
 * 处理导出纪念日数据
 */
function handleExportAnniversaries(): void {
  const exportData: AnniversaryExportData = {
    version: 2,
    anniversaries: anniversaryStore.anniversaries,
    categories: categoryStore.categories,
    exportedAt: Date.now()
  }

  const jsonString = JSON.stringify(exportData, null, 2)

  uni.setClipboardData({
    data: jsonString,
    success: () => {
      uni.showToast({
        title: '纪念日数据已复制',
        icon: 'success'
      })
    },
    fail: () => {
      uni.showToast({
        title: '复制失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 处理导入纪念日数据
 */
function handleImportAnniversaries(): void {
  uni.getClipboardData({
    success: (res) => {
      try {
        const data = JSON.parse(res.data) as AnniversaryExportData

        // 校验版本
        if (data.version !== 2) {
          uni.showToast({
            title: '数据版本不兼容',
            icon: 'none'
          })
          return
        }

        // 校验 JSON 格式
        if (!data.anniversaries || !Array.isArray(data.anniversaries)) {
          throw new Error('无效的纪念日数据')
        }
        if (!data.categories || !Array.isArray(data.categories)) {
          throw new Error('无效的分类数据')
        }

        // 更新预览数据
        previewAnniversaryData.value = {
          anniversaryCount: data.anniversaries.length,
          categoryCount: data.categories.length,
          anniversaries: data.anniversaries,
          categories: data.categories
        }

        // 显示预览弹窗
        showAnniversaryPreview.value = true
      } catch (error) {
        uni.showToast({
          title: 'JSON 格式无效',
          icon: 'none'
        })
      }
    },
    fail: () => {
      uni.showToast({
        title: '读取剪贴板失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 关闭纪念日预览弹窗
 */
function closeAnniversaryPreview(): void {
  showAnniversaryPreview.value = false
  previewAnniversaryData.value = {
    anniversaryCount: 0,
    categoryCount: 0,
    anniversaries: [],
    categories: []
  }
}

/**
 * 确认导入纪念日数据
 */
function confirmAnniversaryImport(): void {
  try {
    // 合并分类
    const categoryResult = categoryStore.mergeCategories(previewAnniversaryData.value.categories)

    // 合并纪念日
    const anniversaryResult = anniversaryStore.mergeAnniversaries(previewAnniversaryData.value.anniversaries)

    // 显示导入结果
    const message = `导入完成！\n纪念日：新增${anniversaryResult.added}，更新${anniversaryResult.updated}\n分类：新增${categoryResult.added}，跳过${categoryResult.skipped}`

    uni.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    })

    // 关闭预览弹窗
    closeAnniversaryPreview()
  } catch (error) {
    uni.showToast({
      title: '导入失败',
      icon: 'none'
    })
  }
}
```

- [ ] **Step 5: 在模板中添加纪念日统计卡片**

在 `.overview-section` 内添加第三个统计卡片：

```vue
<view class="stat-card gradient-warm fade-in-up" style="animation-delay: 0.3s">
  <view class="stat-icon">
    <text class="fa-solid">&#xf004;</text>
  </view>
  <view class="stat-content">
    <text class="stat-value">{{ totalAnniversaries }}</text>
    <text class="stat-label">纪念日</text>
  </view>
  <view class="stat-glow"></view>
</view>
```

- [ ] **Step 6: 在模板中添加纪念日导出区块**

在最后一个事件导入区块后添加：

```vue
<!-- Export anniversary data section -->
<view class="section-card glass-card fade-in-up" style="animation-delay: 0.5s">
  <view class="section-header">
    <text class="fa-solid">&#xf004;</text>
    <text class="section-title">导出纪念日数据</text>
  </view>
  <text class="section-desc">将纪念日和分类数据导出为 JSON 格式，并复制到剪贴板</text>
  <button class="action-btn gradient-btn" @click="handleExportAnniversaries">
    <text class="fa-solid">&#xf093;</text>
    <text class="btn-text">导出纪念日数据</text>
  </button>
</view>

<!-- Import anniversary data section -->
<view class="section-card glass-card fade-in-up" style="animation-delay: 0.6s">
  <view class="section-header">
    <text class="fa-solid">&#xf56f;</text>
    <text class="section-title">导入纪念日数据</text>
  </view>
  <text class="section-desc">从剪贴板导入纪念日 JSON 数据，将合并到现有数据中</text>
  <button class="action-btn gradient-btn" @click="handleImportAnniversaries">
    <text class="fa-solid">&#xf093;</text>
    <text class="btn-text">导入纪念日数据</text>
  </button>
</view>
```

- [ ] **Step 7: 在模板中添加纪念日导入预览弹窗**

在现有事件导入预览弹窗后添加纪念日预览弹窗：

```vue
<!-- Anniversary import preview dialog -->
<view v-if="showAnniversaryPreview" class="dialog-overlay" @click="closeAnniversaryPreview">
  <view class="dialog-content" @click.stop>
    <view class="dialog-header">
      <text class="fa-solid">&#xf06e;</text>
      <text class="dialog-title">纪念日导入预览</text>
    </view>
    <view class="dialog-body">
      <view class="preview-item">
        <text class="preview-label">纪念日数</text>
        <text class="preview-value">{{ previewAnniversaryData.anniversaryCount }}</text>
      </view>
      <view class="preview-item">
        <text class="preview-label">分类数</text>
        <text class="preview-value">{{ previewAnniversaryData.categoryCount }}</text>
      </view>
    </view>
    <view class="dialog-footer">
      <button class="dialog-btn dialog-btn-cancel" @click="closeAnniversaryPreview">
        <text class="fa-solid">&#xf00d;</text>
        <text class="btn-text">取消</text>
      </button>
      <button class="dialog-btn dialog-btn-confirm gradient-btn" @click="confirmAnniversaryImport">
        <text class="fa-solid">&#xf00c;</text>
        <text class="btn-text">确认导入</text>
      </button>
    </view>
  </view>
</view>
```

- [ ] **Step 8: 修改 overview-section 样式以支持三个卡片**

修改 `.overview-section` 样式，将 `display: flex; gap: $spacing-md;` 改为允许换行的布局：

```scss
.overview-section {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
  padding: $spacing-md;

  .stat-card {
    flex: 1;
    min-width: 200rpx;
    // ... 其余样式保持不变 ...
  }
}
```

- [ ] **Step 9: 提交更改**

```bash
git add src/pages/data-manager/data-manager.vue
git commit -m "feat(data-manager): 添加纪念日数据导出/导入功能"

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

### Task 4: 验证功能完整性

**Files:**
- 测试验证

- [ ] **Step 1: 运行项目验证编译**

```bash
npm run dev:h5
```

确认无编译错误。

- [ ] **Step 2: 手动测试搜索功能**

1. 进入纪念日页面，点击 Header 右侧搜索按钮
2. 验证搜索框展开，输入框自动聚焦
3. 输入关键词，验证列表实时筛选
4. 清空输入，验证列表恢复
5. 点击关闭按钮（×），验证搜索框收起、列表恢复
6. 选择分类筛选后，再输入搜索关键词，验证组合筛选生效

- [ ] **Step 3: 手动测试纪念日备份功能**

1. 进入统计页 → 数据管理页面
2. 验证新增的纪念日统计卡片显示正确数量
3. 点击"导出纪念日数据"，验证复制成功提示
4. 修改剪贴板内容（模拟导入数据）
5. 点击"导入纪念日数据"，验证预览弹窗显示正确数量
6. 点击确认导入，验证导入结果提示正确

- [ ] **Step 4: 最终提交（如有修复）**

```bash
git add .
git commit -m "fix: 修复搜索和备份功能测试中发现的问题"

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## 自检清单

### 规格覆盖检查

| 规格要求 | 任务覆盖 |
|----------|----------|
| 仅搜索名称字段 | Task 1 Step 2, Task 2 |
| Header 搜索按钮展开式 | Task 2 Step 2-4 |
| 实时搜索筛选 | Task 1 Step 2, Task 2 Step 1 |
| 分类筛选 + 搜索组合 | Task 1 Step 2 |
| JSON 格式导出纪念日+分类 | Task 3 Step 4, 6 |
| 剪贴板导入 | Task 3 Step 4, 7 |
| 预览弹窗 | Task 3 Step 7 |
| 版本校验（version: 2） | Task 3 Step 4 |
| 合并逻辑（新增/更新） | Task 1 Step 3-4 |
| 预设分类不被覆盖 | Task 1 Step 4 |

### 类型一致性检查

- `AnniversaryExportData.version` 固定为 `2`（与事件导出的 `1` 区分）
- `mergeAnniversaries` 返回 `{ added, updated }`
- `mergeCategories` 返回 `{ added, skipped }`
- `AnniversaryCategory` 接口无 `updatedAt` 字段，合并时跳过已存在的分类