# 数据导入导出功能设计

## 背景

基于 uni-app (Vue 3 + Pinia) 的跨平台事件记录应用，需要支持全量数据的导入导出功能，便于用户备份和迁移数据。

## 数据结构

### 导出 JSON 格式

```json
{
  "version": 1,
  "exportedAt": 1709500000000,
  "events": [
    {
      "id": "event_xxx",
      "name": "事件名称",
      "typeId": "type_xxx",
      "time": 1709500000000,
      "createdAt": 1709500000000
    }
  ],
  "eventTypes": [
    {
      "id": "type_xxx",
      "name": "类型名称",
      "color": "#FF5733",
      "createdAt": 1709500000000
    }
  ]
}
```

字段说明：
- `version`：数据格式版本号，当前为 1
- `exportedAt`：导出时间戳
- `events`：事件数组，使用 store 内部格式（数字时间戳）
- `eventTypes`：事件类型数组

### 合并逻辑

导入时采用合并模式，不删除本地数据：
- 按 `id` 判断数据是否存在
- 已存在：更新字段（事件更新 name/typeId/time，类型更新 name/color）
- 不存在：新增到列表末尾
- 本地已有数据保留不变

## 页面设计

### 页面位置

新增独立页面：`src/pages/data-manager/data-manager.vue`

### 页面入口

在底部 TabBar 添加「数据」图标入口。

### 页面布局

```
┌─────────────────────────────┐
│      数据管理                │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │   导出数据              │  │
│  │   已复制到粘贴板        │  │
│  └───────────────────────┘  │
│                             │
│  数据统计：                  │
│  · 事件：128 条              │
│  · 类型：5 种                │
│                             │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │   导入数据              │  │
│  └───────────────────────┘  │
│                             │
│  导入说明：                  │
│  从粘贴板读取 JSON 数据，    │
│  合并到本地存储              │
│                             │
└─────────────────────────────┘
```

### 数据统计显示

实时显示当前数据状态：
- 事件总数
- 类型总数

## 交互流程

### 导出流程

1. 点击「导出数据」按钮
2. 从 store 获取 events 和 eventTypes
3. 构建 JSON 对象，添加 version 和 exportedAt
4. 使用 `uni.setClipboardData` 写入粘贴板
5. Toast 提示「已复制到粘贴板」
6. 更新页面统计显示

### 导入流程

1. 点击「导入数据」按钮
2. 使用 `uni.getClipboardData` 读取粘贴板
3. 校验 JSON 格式和必要字段
4. 若无效：Toast 提示错误信息
5. 若有效：显示预览弹窗（显示即将导入的事件数、类型数）
6. 用户确认后执行合并操作
7. 更新 store 数据并保存到 storage
8. Toast 提示导入结果（新增 X 条，更新 Y 条）
9. 更新页面统计显示

## 错误处理

| 错误情况 | 提示信息 |
|---------|---------|
| 粘贴板读取失败 | 无法读取粘贴板，请检查权限 |
| 粘贴板内容为空 | 粘贴板无内容 |
| JSON 解析失败 | 数据格式错误，请粘贴有效的 JSON |
| 缺少必要字段 | 数据不完整，缺少 events 或 eventTypes |
| 版本不兼容 | 数据版本不兼容，请升级应用 |
| 合并过程异常 | 导入失败，请重试 |

## 边界情况处理

| 场景 | 处理方式 |
|-----|---------|
| 导入事件关联本地不存在的类型 | 保留 typeId，显示时 fallback 为「未分类」 |
| 导入数据与本地完全重复 | 提示「导入完成，无新增或更新」 |
| 部分字段缺失 | 使用默认值：name → ''，time → Date.now() |

## 数据校验规则

```typescript
interface ExportData {
  version: number        // 必填，必须 === 1
  exportedAt?: number    // 可选
  events: EventData[]    // 必填数组
  eventTypes: EventTypeData[] // 必填数组
}
```

校验步骤：
1. JSON 解析是否成功
2. `version` 字段存在且等于 1
3. `events` 和 `eventTypes` 为数组
4. 数组元素包含必要字段（id）

## 技术要点

### 粘贴板 API

使用 uni-app 提供的粘贴板 API：
- `uni.setClipboardData({ data: jsonString })` — 写入粘贴板
- `uni.getClipboardData({ success: (res) => { ... } })` — 读取粘贴板

### Store 操作

导入时需要同时更新两个 store：
1. `useEventStore` — 合并事件数据
2. `useEventTypeStore` — 合并类型数据

合并后调用各自的 `saveToStorage()` 方法持久化。

### TabBar 配置

需要在 `pages.json` 中配置新增的 TabBar 项。