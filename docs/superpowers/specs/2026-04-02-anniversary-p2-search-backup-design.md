# 纪念日 P2 阶段改进设计：搜索功能 + 数据备份

## 概述

本设计文档涵盖纪念日页面的两个剩余 P2 功能：
- 搜索功能：仅搜索纪念日名称，Header 搜索按钮展开式
- 数据备份：扩展统计页数据管理卡片，JSON 格式导出/导入

---

## 一、搜索功能

### 功能需求

| 项目 | 说明 |
|------|------|
| 搜索范围 | 仅搜索纪念日名称字段 |
| 搜索方式 | 实时搜索（输入即筛选） |
| UI 位置 | Header 区域右侧搜索按钮，点击展开搜索框 |

### UI 设计

**默认状态**：

```
┌─────────────────────────────────────┐
│ 💕 纪念日                        🔍 │
│    记录重要时刻                     │
└─────────────────────────────────────┘
```

**搜索展开状态**：

```
┌─────────────────────────────────────┐
│ 💕 纪念日                        ✕ │
│    记录重要时刻                     │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🔍 请输入纪念日名称             │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Store 改动

**文件位置**：`src/store/anniversary.ts`

**新增 state**：

```typescript
searchKeyword: string  // 搜索关键词，默认空字符串
```

**修改 getter**：

```typescript
// 筛选后的纪念日列表
// 同时考虑分类筛选和搜索关键词
filteredAnniversaries: (state): AnniversaryData[] => {
  let result = state.anniversaries

  // 分类筛选
  if (state.selectedCategoryId) {
    result = result.filter(a => a.categoryId === state.selectedCategoryId)
  }

  // 名称搜索
  if (state.searchKeyword.trim()) {
    const keyword = state.searchKeyword.trim().toLowerCase()
    result = result.filter(a => a.name.toLowerCase().includes(keyword))
  }

  return result
}
```

**新增 action**：

```typescript
// 设置搜索关键词
setSearchKeyword(keyword: string): void {
  this.searchKeyword = keyword
}

// 清空搜索
clearSearch(): void {
  this.searchKeyword = ''
}
```

### 组件改动

**文件位置**：`src/pages/anniversary/anniversary.vue`

**新增状态**：

```typescript
const showSearch = ref(false)  // 是否显示搜索框
const searchInput = ref('')    // 搜索输入值
```

**新增方法**：

```typescript
// 切换搜索显示
function toggleSearch() {
  showSearch.value = !showSearch.value
  if (!showSearch.value) {
    searchInput.value = ''
    anniversaryStore.clearSearch()
  }
}

// 监听搜索输入
watch(searchInput, (val) => {
  anniversaryStore.setSearchKeyword(val)
})
```

**模板改动**：

1. Header 右侧添加搜索按钮
2. 搜索框展开区域
3. 搜索框使用 u-input 组件

---

## 二、纪念日数据备份

### 功能需求

| 项目 | 说明 |
|------|------|
| 备份范围 | 纪念日数据 + 分类数据 |
| 导出格式 | JSON 文件 |
| 导入方式 | 从剪贴板读取 JSON |
| UI 位置 | 扩展 data-manager.vue 页面 |

### UI 设计

在现有 `data-manager.vue` 页面底部新增两个区块：

```
┌─────────────────────────────────────┐
│ 📊 数据管理                         │
├─────────────────────────────────────┤
│ 事件总数: 50    类型总数: 8         │  ← 现有统计
├─────────────────────────────────────┤
│ 📤 导出事件数据                     │  ← 现有区块
│ [导出数据]                          │
├─────────────────────────────────────┤
│ 📥 导入事件数据                     │  ← 现有区块
│ [导入数据]                          │
├─────────────────────────────────────┤
│ 💕 导出纪念日数据                   │  ← 新增
│ 将纪念日和分类导出为 JSON 格式      │
│ [导出纪念日数据]                    │
├─────────────────────────────────────┤
│ 💕 导入纪念日数据                   │  ← 新增
│ 从剪贴板导入纪念日 JSON 数据        │
│ [导入纪念日数据]                    │
└─────────────────────────────────────┘
```

### 导出数据结构

```typescript
interface AnniversaryExportData {
  version: number                    // 数据版本，固定为 2
  anniversaries: AnniversaryData[]   // 纪念日列表
  categories: AnniversaryCategory[]  // 分类列表
  exportedAt: number                 // 导出时间戳
}
```

### Store 改动

**文件位置**：`src/store/anniversary.ts`

**新增 action**：

```typescript
// 合并导入的纪念日数据
mergeAnniversaries imported: AnniversaryData[]): { added: number, updated: number } {
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

**文件位置**：`src/store/anniversaryCategory.ts`

**新增 action**：

```typescript
// 合并导入的分类数据
mergeCategories imported: AnniversaryCategory[]): { added: number, skipped: number } {
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

### 组件改动

**文件位置**：`src/pages/data-manager/data-manager.vue`

**新增数据统计**：

```typescript
const anniversaryStore = useAnniversaryCategoryStore()
const categoryStore = useAnniversaryCategoryStore()

const totalAnniversaries = computed(() => anniversaryStore.totalCount)
const totalCategories = computed(() => categoryStore.categoryCount)
```

**新增导出方法**：

```typescript
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
      uni.showToast({ title: '纪念日数据已复制', icon: 'success' })
    }
  })
}
```

**新增导入方法**：

```typescript
function handleImportAnniversaries(): void {
  uni.getClipboardData({
    success: (res) => {
      try {
        const data = JSON.parse(res.data) as AnniversaryExportData

        if (data.version !== 2) {
          uni.showToast({ title: '数据版本不兼容', icon: 'none' })
          return
        }

        // 显示预览
        previewAnniversaryData.value = {
          anniversaryCount: data.anniversaries?.length || 0,
          categoryCount: data.categories?.length || 0,
          anniversaries: data.anniversaries || [],
          categories: data.categories || []
        }
        showAnniversaryPreview.value = true
      } catch {
        uni.showToast({ title: 'JSON 格式无效', icon: 'none' })
      }
    }
  })
}
```

---

## 三、文件改动清单

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 修改 | `src/store/anniversary.ts` | 添加搜索状态、筛选逻辑、导入合并 |
| 修改 | `src/store/anniversaryCategory.ts` | 添加导入合并 action |
| 修改 | `src/pages/anniversary/anniversary.vue` | 添加搜索按钮和搜索框 |
| 修改 | `src/pages/data-manager/data-manager.vue` | 添加纪念日导出/导入区块 |

---

## 四、测试要点

### 搜索功能

1. **实时筛选**
   - 输入关键词立即筛选列表
   - 清空关键词恢复原列表
   - 关闭搜索恢复原列表

2. **组合筛选**
   - 分类筛选 + 搜索同时生效
   - 先分类筛选，再搜索过滤

3. **边界情况**
   - 无匹配时显示空状态
   - 搜索框自动聚焦
   - 空字符串不触发筛选

### 数据备份

1. **导出功能**
   - 导出包含纪念日和分类
   - JSON 格式正确可解析
   - 复制到剪贴板成功

2. **导入功能**
   - 版本校验正确
   - 预览弹窗显示数量
   - 合并逻辑正确（新增/更新）

3. **边界情况**
   - 空剪贴板提示
   - 无效 JSON 提示
   - 版本不兼容提示
   - 预设分类不被覆盖
   - 分类导入：已存在的跳过，不存在的自定义分类新增