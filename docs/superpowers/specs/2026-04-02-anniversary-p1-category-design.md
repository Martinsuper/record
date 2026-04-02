# 纪念日 P1 阶段改进设计：分类管理

## 概述

本设计文档涵盖纪念日页面的分类管理功能，包括：
1. 分类数据结构和存储
2. 表单中的分类选择
3. 卡片上的分类图标显示
4. 页面上的分类筛选

---

## 一、数据结构

### AnniversaryCategory 接口

```typescript
interface AnniversaryCategory {
  id: string           // 分类唯一标识
  name: string         // 分类名称
  icon: string         // Font Awesome 图标编码
  isPreset: boolean    // 是否为预设分类（预设分类不可删除）
  sortOrder: number    // 排序权重
}
```

### 预设分类（8个）

| ID | 名称 | 图标编码 | Font Awesome |
|----|------|----------|--------------|
| birthday | 生日 | `\uf1fd` | fa-birthday-cake |
| love | 恋爱 | `\uf004` | fa-heart |
| wedding | 结婚 | `\uf802` | fa-ring |
| festival | 节日 | `\uf56b` | fa-glass-cheers |
| work | 工作 | `\uf0b1` | fa-briefcase |
| onboard | 入职 | `\uf073` | fa-calendar-alt |
| memorial | 纪念日 | `\uf4e3` | fa-heart-circle-check |
| other | 其他 | `\uf02d` | fa-bookmark |

### AnniversaryData 更新

在现有 `AnniversaryData` 接口中已有 `categoryId` 字段，无需修改结构。

---

## 二、存储方案

### 文件位置

`src/utils/storage.ts`

### 新增存储键

```typescript
const ANNIVERSARY_CATEGORIES_KEY = 'anniversary_categories'
```

### 新增函数

```typescript
// 获取分类列表
function getAnniversaryCategories(): AnniversaryCategory[]

// 保存分类列表
function saveAnniversaryCategories(categories: AnniversaryCategory[]): void

// 获取预设分类
function getPresetCategories(): AnniversaryCategory[]
```

### 初始化逻辑

- 首次加载时，如果没有分类数据，自动初始化预设分类
- 预设分类的 ID 固定，便于识别和迁移

---

## 三、Store 层

### 文件位置

`src/store/anniversaryCategory.ts`（新建）

### Store 结构

```typescript
interface AnniversaryCategoryState {
  categories: AnniversaryCategory[]
  isLoaded: boolean
}

// Getters
- presetCategories    // 预设分类列表
- customCategories    // 自定义分类列表
- allCategories       // 全部分类（预设在前，自定义在后）

// Actions
- loadFromStorage()   // 加载分类
- saveToStorage()     // 保存分类
- addCategory()       // 添加自定义分类
- updateCategory()    // 更新分类
- deleteCategory()    // 删除分类（仅自定义可删）
- getCategoryById()   // 根据 ID 获取分类
```

---

## 四、UI 组件

### 4.1 AnniversaryCategoryPicker.vue（新建）

**功能**：分类选择弹窗组件

**Props**：
- `visible: boolean` — 是否显示
- `selectedId: string` — 当前选中的分类 ID

**Emits**：
- `close` — 关闭弹窗
- `select(id: string)` — 选择分类

**UI 结构**：
```
┌─────────────────────────────────────┐
│ 选择分类                         ✕  │
├─────────────────────────────────────┤
│ 【预设分类】                        │
│ 🎂 生日   💕 恋爱   💒 结婚   🎉 节日│
│ 💼 工作   📅 入职   💑 纪念日  📌 其他│
├─────────────────────────────────────┤
│ 【自定义分类】                      │
│ 无自定义分类                        │
├─────────────────────────────────────┤
│         [+ 新建分类]                │
└─────────────────────────────────────┘
```

**交互**：
- 点击分类项选中并关闭
- 点击"新建分类"弹出新建表单
- 选中项有高亮边框/背景

---

### 4.2 AnniversaryCategoryForm.vue（新建）

**功能**：新建/编辑分类表单弹窗

**Props**：
- `visible: boolean`
- `editData: AnniversaryCategory | null` — 编辑模式时的数据

**Emits**：
- `close`
- `save(data)` — 保存分类

**UI 结构**：
```
┌─────────────────────────────────────┐
│ 新建分类                         ✕  │
├─────────────────────────────────────┤
│ 分类名称                            │
│ ┌─────────────────────────────────┐ │
│ │ 请输入分类名称                   │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 选择图标                            │
│ 🎂 💕 💒 🎉 💼 📅 💑 📌 ⭐ 🔔 🎁 🏠  │
│                                     │
└─────────────────────────────────────┘
│         [取消]    [保存]            │
└─────────────────────────────────────┘
```

**图标选择器**：
- 提供 12-16 个常用图标供选择
- 点击选中，有高亮效果

---

### 4.3 AnniversaryForm.vue（修改）

**改动**：在表单中添加分类选择项

**位置**：在"纪念日名称"和"目标日期"之间

**UI 结构**：
```
┌─────────────────────────────────────┐
│ 纪念日名称                          │
│ ┌─────────────────────────────────┐ │
│ │ 请输入纪念日名称                 │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 分类                                │
│ ┌─────────────────────────────────┐ │
│ │ 🎂 生日                     >   │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 目标日期                            │
│ ...                                 │
└─────────────────────────────────────┘
```

**交互**：
- 点击分类行弹出 AnniversaryCategoryPicker
- 默认选中"其他"分类
- 编辑模式下正确回显已选分类

---

### 4.4 AnniversaryCard.vue（修改）

**改动**：在卡片上显示分类图标

**位置**：卡片右上角（name 区域右侧）

**样式**：
- 小尺寸图标（24rpx）
- 淡色显示，不抢主视觉
- 无分类时不显示

---

### 4.5 anniversary.vue（修改）

**改动**：添加分类筛选条

**位置**：header 下方，列表上方

**UI 结构**：
```
┌─────────────────────────────────────┐
│ 全部 | 生日 | 恋爱 | 结婚 | ...      │
└─────────────────────────────────────┘
```

**交互**：
- 横向滚动，支持更多分类
- 选中项有高亮/下划线
- 点击切换筛选
- "全部"选项显示所有纪念日

---

## 五、筛选逻辑

### Store 更新

在 `useAnniversaryStore` 中添加：

```typescript
// 新增 state
selectedCategoryId: string | null  // 当前筛选的分类 ID

// 新增 getter
filteredAnniversaries  // 根据选中分类筛选后的列表

// 新增 action
setCategoryFilter(id: string | null)  // 设置分类筛选
```

### 筛选规则

- `selectedCategoryId === null` 显示全部
- `selectedCategoryId === 'birthday'` 仅显示生日分类
- 自定义分类同样按 ID 筛选

---

## 六、文件改动清单

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 新建 | `src/store/anniversaryCategory.ts` | 分类 Store |
| 新建 | `src/components/AnniversaryCategoryPicker.vue` | 分类选择器 |
| 新建 | `src/components/AnniversaryCategoryForm.vue` | 分类表单 |
| 修改 | `src/utils/storage.ts` | 分类存储函数 |
| 修改 | `src/store/anniversary.ts` | 添加筛选逻辑 |
| 修改 | `src/components/AnniversaryForm.vue` | 添加分类选择 |
| 修改 | `src/components/AnniversaryCard.vue` | 显示分类图标 |
| 修改 | `src/pages/anniversary/anniversary.vue` | 添加筛选条 |

---

## 七、测试要点

1. **分类存储**
   - 首次加载自动初始化预设分类
   - 添加自定义分类正确保存
   - 删除自定义分类正常工作
   - 预设分类不可删除

2. **表单交互**
   - 添加纪念日可选择分类
   - 编辑纪念日正确回显分类
   - 新建自定义分类立即可选

3. **卡片显示**
   - 有分类的卡片显示图标
   - 无分类的卡片不显示图标

4. **筛选功能**
   - 点击分类筛选正确
   - "全部"显示所有
   - 切换筛选立即生效