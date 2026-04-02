---
name: 多设备数据同步设计
description: 通过共享码实现多手机间实时数据同步的产品方案
type: project
---

# 多设备数据同步设计方案

## 概述

**目标：** 用户在多个手机上输入相同的共享码后，数据能够实时同步共享。

**核心原则：**
- 离线优先，同步可选（用户可自由选择是否开启云端同步）
- 实时同步（WebSocket + Redis Pub/Sub）
- 简单轻量（共享码模式，无需注册登录）

---

## 核心概念

### 空间（Space）

一个共享数据容器。用户创建空间后获得共享码，其他用户输入该共享码即可加入同一空间，空间内所有数据自动同步。

### 共享码（Share Code）

6位字母数字组合（如 `X7K9M2`），避免歧义字符（0/O、1/I/l）。用户创建空间时系统生成，可分享给他人加入。

### 设备（Device）

同一用户可能有多个设备（手机A、手机B），它们共享同一个空间。每个设备有唯一 `deviceId`。

---

## 数据模型

### MySQL 表结构

```sql
-- 空间表
CREATE TABLE space (
  id VARCHAR(32) PRIMARY KEY,
  share_code VARCHAR(6) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP
);

-- 设备表
CREATE TABLE device (
  id VARCHAR(32) PRIMARY KEY,
  space_id VARCHAR(32) NOT NULL,
  device_name VARCHAR(50),
  last_connected_at TIMESTAMP,
  FOREIGN KEY (space_id) REFERENCES space(id)
);

-- 事件表
CREATE TABLE event (
  id VARCHAR(32) PRIMARY KEY,
  space_id VARCHAR(32) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type_id VARCHAR(32),
  time BIGINT NOT NULL,
  created_at BIGINT,
  updated_at BIGINT,
  FOREIGN KEY (space_id) REFERENCES space(id)
);

-- 纪念日表
CREATE TABLE anniversary (
  id VARCHAR(32) PRIMARY KEY,
  space_id VARCHAR(32) NOT NULL,
  name VARCHAR(100) NOT NULL,
  date BIGINT NOT NULL,
  repeat_type VARCHAR(10),
  mode VARCHAR(10),
  category_id VARCHAR(32),
  sort_order INT DEFAULT 0,
  created_at BIGINT,
  updated_at BIGINT,
  FOREIGN KEY (space_id) REFERENCES space(id)
);

-- 事件类型表
CREATE TABLE event_type (
  id VARCHAR(32) PRIMARY KEY,
  space_id VARCHAR(32) NOT NULL,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(10),
  icon VARCHAR(50),
  created_at BIGINT,
  FOREIGN KEY (space_id) REFERENCES space(id)
);

-- 纪念日分类表
CREATE TABLE anniversary_category (
  id VARCHAR(32) PRIMARY KEY,
  space_id VARCHAR(32) NOT NULL,
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(50),
  is_preset BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (space_id) REFERENCES space(id)
);
```

**关键点：**
- 所有业务表都有 `space_id`，实现数据隔离
- `updated_at` 用 BIGINT 存储毫秒时间戳
- 共享码设置唯一索引

---

## 技术架构

### 整体架构

```
客户端 A ──WebSocket──┐
                      │
客户端 B ──WebSocket──┼── Spring Boot ── Redis Pub/Sub ── MySQL
                      │
客户端 C ──WebSocket──┘
```

### 为什么用 Redis Pub/Sub

- 多个 Spring Boot 实例可订阅同一 channel
- WebSocket 连接可能分布在不同服务器实例
- Redis 充当消息中转枢纽

### Redis Channel 命名

`space:{space_id}`，例如 `space:abc123`

---

## WebSocket 连接与消息同步

### 连接流程

```
客户端                          服务端
   |                               |
   |-- WebSocket连接 ------------->|
   |   ws://host/ws/sync?code=X7K9M2&deviceId=device_xxx
   |                               |
   |<-- connected 或 error ---------|
   |                               |
   |                               |-- 加入空间group
   |                               |-- 订阅 Redis channel
   |                               |
   |<-- full_sync (全量数据) -------|
   |                               |
   |-- 正常通信 --------------------|
```

### 消息格式

```json
{
  "type": "event_add",
  "data": { ... },
  "deviceId": "device_001",
  "timestamp": 1712345678000
}
```

### 消息类型

| 消息类型 | 方向 | 说明 |
|---------|------|------|
| `connected` | 服务端→客户端 | 连接成功确认 |
| `full_sync` | 服务端→客户端 | 首次连接时推送全量数据 |
| `event_add/update/delete` | 双向 | 事件变更 |
| `anniversary_add/update/delete` | 双向 | 纪念日变更 |
| `event_type_add/update/delete` | 双向 | 事件类型变更 |
| `category_add/update/delete` | 双向 | 纪念日分类变更 |
| `error` | 服务端→客户端 | 错误消息 |

---

## HTTP API

### 创建空间

```
POST /api/space/create

响应：
{
  "success": true,
  "data": {
    "spaceId": "abc123",
    "shareCode": "X7K9M2"
  }
}
```

### 验证共享码

```
GET /api/space/verify?code=X7K9M2

响应（成功）：
{
  "success": true,
  "data": {
    "spaceId": "abc123"
  }
}
```

### 获取全量数据

```
GET /api/space/{spaceId}/data

响应：
{
  "success": true,
  "data": {
    "events": [...],
    "anniversaries": [...],
    "eventTypes": [...],
    "anniversaryCategories": [...]
  }
}
```

---

## 客户端同步机制

### 模块结构

```
Vue 组件层
    │
Pinia Store (eventStore, anniversaryStore, ...)
    │
syncManager (新增)
  - WebSocket 连接管理
  - 消息发送/接收
  - 离线队列缓存
  - 全量同步处理
    │
本地 Storage
```

### syncManager 核心职责

**1. 连接管理**
- 建立 WebSocket 连接，传入共享码和 deviceId
- 处理断开、自动重连（指数退避：1s→2s→4s→8s→最多30s）
- 维护连接状态供 UI 层展示

**2. 消息处理**
- 本地变更 → 写入本地 → 发送 WebSocket 消息
- 收到云端消息 → 更新本地 → 更新 Pinia Store

**3. 离线队列**
- 存储：`uni.setStorageSync('offlineQueue', [...])`
- 结构：`[{ type, data, timestamp, retryCount }]`
- 重连后按 timestamp 顺序发送
- 超过3次重试则丢弃并提示用户

**4. 全量同步**
- 首次连接成功时，服务端推送 `full_sync`
- 与本地数据合并（按 id 匹配，updatedAt 比较，保留较新）
- 复用现有 `mergeAnniversaries` 和 `mergeEvents` 方法

---

## 用户交互流程

### 状态流转

```
离线模式（默认） ←→ 已连接空间（同步状态）
```

**离线模式：**
- 数据存储在本地，功能完整可用
- 无状态栏提示（静默）
- 设置页显示"开启同步"入口

**已连接空间：**
- 数据实时同步云端
- 主页状态栏显示同步状态
- 设置页显示共享码 + "退出空间"入口

### 设置页入口设计

| 状态 | 显示内容 |
|-----|---------|
| 离线模式 | 标题："数据同步" + 状态："离线模式" + 按钮："开启同步" |
| 已连接 | 标题："数据同步" + 状态："已连接" + 共享码（可复制）+ 按钮："退出空间" |

### "开启同步"弹窗选项

- 创建新空间 → 生成共享码 → 连接
- 加入已有空间 → 输入共享码 → 连接
- 取消

### 主页状态栏

| 状态 | 显示内容 | 颜色 |
|-----|---------|------|
| 已连接 | 静默（不显示） | - |
| 离线 | "离线 - 数据将在恢复后同步" | 灰色/橙色 |
| 同步中 | "正在同步..." | 蓝色 |
| 同步失败 | "同步失败，点击重试" | 红色 |

---

## 错误处理

### 连接层异常

| 场景 | 处理 |
|-----|------|
| WebSocket 连接失败 | 自动重连，指数退避 |
| 连接中途断开 | UI显示离线状态 → 数据写入离线队列 |
| 共享码验证失败 | 提示用户重新输入 |
| 服务端重启 | 客户端自动重连 → 发送离线队列 |

### 数据同步异常

| 场景 | 处理 |
|-----|------|
| 离线队列发送失败 | 重试3次，超限丢弃并提示 |
| 数据合并冲突 | 按 updatedAt 比较，保留较新 |
| 数据写入MySQL失败 | 服务端记录日志 → 返回error → 客户端重试 |

### 冲突处理原则

**最后写入胜出（Last Write Wins）：** 按 `updatedAt` 时间戳比较，保留更新时间更晚的数据。

---

## 测试策略

### 关键测试场景

1. 两设备同时新增数据 → 验证都能正确同步到对方
2. 一设备离线新增多条数据后恢复 → 验证离线队列按顺序同步
3. 新设备加入已有空间 → 验证全量数据正确下载并合并
4. 退出空间后重新加入 → 验证本地数据不丢失，重新同步

### 后端测试

- 单元测试：Space 创建、共享码生成、数据 CRUD
- 集成测试：WebSocket 连接流程、Redis Pub/Sub 消息分发
- 压力测试：同一空间100个连接并发发送消息

### 客户端测试

- 功能测试：创建/加入/退出空间、数据同步流程
- 异常测试：网络断开恢复、离线队列、重连机制
- 兼容性测试：微信小程序、H5、App 各平台

---

## 实现注意事项

### 后端

1. WebSocket 连接管理用 `ConcurrentHashMap`
2. Redis Pub/Sub 用 `RedisTemplate.convertAndSend`
3. 共享码生成用 `RandomStringUtils.randomAlphanumeric(6)`，排除歧义字符
4. 心跳保活：每30秒发送心跳消息

### 客户端

1. 使用 `uni.connectSocket`，注意小程序平台连接数限制
2. deviceId 首次启动生成并持久化
3. 合并逻辑复用现有 store 方法
4. 状态持久化：共享码、lastSyncTime、离线队列

### 部署

- Spring Boot：内嵌 Tomcat 或外置容器
- MySQL：单实例即可
- Redis：单实例，开启 AOF 持久化
- Nginx：配置 WebSocket 代理支持

---

## Why

**Why: 用户需要在多个手机之间共享纪念日和事件数据，当前纯本地存储无法满足多设备协作需求。**

**How to apply: 设计离线优先的同步方案，用户可自由选择是否开启云端同步，通过简单的共享码机制实现数据共享，无需复杂的注册登录流程。**