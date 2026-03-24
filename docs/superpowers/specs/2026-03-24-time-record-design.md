# 时间记录应用设计文档

## 概述

一款使用 Taro 开发的时间记录应用，支持 H5 和微信小程序双端，用于记录生活中的重要事项时间。后端使用 Spring Boot 进行数据持久化。

## 核心功能

1. **纪念日倒计时** - 倒计时展示、重复周期、分类标签、提醒通知
2. **时间轴记录** - 图文记录、分类筛选、时间线展示、搜索
3. **里程碑追踪** - 目标创建、阶段性节点、进度追踪

## 用户认证

- 微信授权登录
- 数据云端同步，支持多设备访问

## 整体架构

```
┌─────────────────────────────────────────────────────┐
│                  客户端层 (Taro)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   H5 应用    │  │ 微信小程序   │  │  (未来扩展)  │ │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘ │
│         │                │                          │
│         └────────┬───────┘                          │
│                  ▼                                  │
│  ┌───────────────────────────────────────────────┐ │
│  │      Taro 统一代码库                          │ │
│  │  Vue3 + TypeScript + Pinia + NutUI            │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                         │
                         │ HTTP/REST API
                         ▼
┌─────────────────────────────────────────────────────┐
│               服务端层 (Spring Boot)                  │
│  ┌───────────────────────────────────────────────┐ │
│  │           Spring Boot 应用                     │ │
│  │  ├─ Controller 层 (API接口)                    │ │
│  │  ├─ Service 层 (业务逻辑)                      │ │
│  │  ├─ Repository 层 (数据访问)                   │ │
│  │  ├─ Security (JWT认证)                        │ │
│  │  └─ FileStorage (文件存储)                    │ │
│  └───────────────────────────────────────────────┘ │
│                         │                          │
│         ┌───────────────┼───────────────┐          │
│         ▼               ▼               ▼          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │  H2 数据库  │  │  本地存储   │  │ 微信API    │    │
│  │  (文件模式) │  │  (图片)    │  │ (授权登录)  │    │
│  └────────────┘  └────────────┘  └────────────┘    │
└─────────────────────────────────────────────────────┘
```

## 数据库设计

### 用户表

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(64) NOT NULL UNIQUE,      -- 微信openid
    nickname VARCHAR(64),
    avatar_url VARCHAR(256),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 纪念日表

```sql
CREATE TABLE anniversaries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(128) NOT NULL,             -- 事件名称
    event_date DATE NOT NULL,                -- 日期
    repeat_type VARCHAR(16) DEFAULT 'NONE',  -- NONE/YEARLY/MONTHLY/WEEKLY
    category VARCHAR(32),                    -- 分类标签
    icon VARCHAR(64),                        -- 图标
    background_image VARCHAR(256),           -- 背景图
    remind_days INT DEFAULT 0,               -- 提前提醒天数
    is_pinned BOOLEAN DEFAULT FALSE,         -- 是否置顶
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 时间轴记录表

```sql
CREATE TABLE timeline_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(128) NOT NULL,             -- 标题
    content TEXT,                            -- 内容描述
    event_time TIMESTAMP NOT NULL,           -- 事件时间
    category VARCHAR(32),                    -- 分类标签
    images TEXT,                             -- 图片URL列表(JSON数组)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 里程碑表

```sql
CREATE TABLE milestones (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(128) NOT NULL,             -- 目标名称
    description TEXT,                        -- 描述
    target_date DATE,                        -- 目标日期
    status VARCHAR(16) DEFAULT 'IN_PROGRESS',-- IN_PROGRESS/COMPLETED/CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 阶段节点表

```sql
CREATE TABLE milestone_stages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    milestone_id BIGINT NOT NULL,
    title VARCHAR(128) NOT NULL,             -- 节点名称
    target_date DATE,                        -- 节点日期
    is_completed BOOLEAN DEFAULT FALSE,      -- 是否完成
    sort_order INT DEFAULT 0,                -- 排序
    FOREIGN KEY (milestone_id) REFERENCES milestones(id)
);
```

## API 接口设计

基础路径: `/api/v1`

### 用户模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/wechat/login | 微信授权登录 |
| GET | /users/profile | 获取用户信息 |
| PUT | /users/profile | 更新用户信息 |

### 纪念日模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /anniversaries | 获取纪念日列表 |
| POST | /anniversaries | 创建纪念日 |
| GET | /anniversaries/{id} | 获取纪念日详情 |
| PUT | /anniversaries/{id} | 更新纪念日 |
| DELETE | /anniversaries/{id} | 删除纪念日 |
| GET | /anniversaries/upcoming | 获取即将到来的纪念日 |

### 时间轴模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /timeline/events | 获取时间轴列表(支持分页/筛选) |
| POST | /timeline/events | 创建时间轴记录 |
| GET | /timeline/events/{id} | 获取记录详情 |
| PUT | /timeline/events/{id} | 更新记录 |
| DELETE | /timeline/events/{id} | 删除记录 |
| GET | /timeline/categories | 获取分类列表 |

### 里程碑模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /milestones | 获取里程碑列表 |
| POST | /milestones | 创建里程碑 |
| GET | /milestones/{id} | 获取里程碑详情(含阶段节点) |
| PUT | /milestones/{id} | 更新里程碑 |
| DELETE | /milestones/{id} | 删除里程碑 |
| POST | /milestones/{id}/stages | 添加阶段节点 |
| PUT | /milestones/{id}/stages/{stageId} | 更新节点状态 |
| DELETE | /milestones/{id}/stages/{stageId} | 删除节点 |

### 文件模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /files/upload | 上传文件(图片) |
| DELETE | /files/{filename} | 删除文件 |

**认证方式：** JWT Token，登录后返回 token，后续请求在 Header 中携带 `Authorization: Bearer <token>`

## 前端页面设计

### 页面结构

```
登录页面 → 主页面 (TabBar 导航)
           ├── 首页 (纪念日)
           ├── 时间轴
           ├── 里程碑
           └── 我的
```

### 首页

- 顶部：用户问候语 + 日期显示
- 纪念日卡片列表（倒计时展示）
- 支持按分类筛选、置顶显示
- 右下角悬浮按钮：添加纪念日
- 点击卡片进入详情/编辑页

### 时间轴页

- 顶部：搜索栏 + 分类筛选
- 时间线形式展示事件列表
- 支持图片缩略图显示
- 下拉刷新、上拉加载更多
- 右下角悬浮按钮：添加记录

### 里程碑页

- 进行中/已完成 Tab 切换
- 里程碑卡片显示：标题 + 进度条 + 目标日期
- 点击进入详情：显示阶段性节点列表
- 支持添加/完成/删除节点
- 右下角悬浮按钮：创建里程碑

### 我的页面

- 用户头像 + 昵称
- 分类管理（纪念日/时间轴的分类标签）
- 数据同步状态
- 设置（提醒通知开关等）
- 关于/退出登录

### 其他页面

- 纪念日创建/编辑页
- 时间轴创建/编辑页
- 里程碑创建/编辑页
- 里程碑详情页（含阶段节点）
- 分类管理页

**UI组件库：** NutUI (京东出品，对 Taro 支持良好)

## 项目目录结构

```
time-record/
├── client/                          # Taro 前端项目
│   ├── src/
│   │   ├── api/                     # API 请求封装
│   │   │   ├── index.ts             # 请求基础配置
│   │   │   ├── auth.ts              # 用户认证接口
│   │   │   ├── anniversary.ts       # 纪念日接口
│   │   │   ├── timeline.ts          # 时间轴接口
│   │   │   ├── milestone.ts         # 里程碑接口
│   │   │   └── file.ts              # 文件上传接口
│   │   ├── components/              # 公共组件
│   │   │   ├── AnniversaryCard/     # 纪念日卡片
│   │   │   ├── TimelineItem/        # 时间轴项
│   │   │   ├── MilestoneCard/       # 里程碑卡片
│   │   │   ├── ProgressBar/         # 进度条
│   │   │   └── CategoryTag/         # 分类标签
│   │   ├── pages/                   # 页面
│   │   │   ├── login/               # 登录页
│   │   │   ├── home/                # 首页(纪念日)
│   │   │   ├── timeline/            # 时间轴页
│   │   │   ├── milestone/           # 里程碑页
│   │   │   ├── profile/             # 我的页面
│   │   │   ├── anniversary-edit/    # 纪念日编辑
│   │   │   ├── timeline-edit/       # 时间轴编辑
│   │   │   ├── milestone-detail/    # 里程碑详情
│   │   │   └── category-manage/     # 分类管理
│   │   ├── store/                   # Pinia 状态管理
│   │   │   ├── index.ts
│   │   │   ├── user.ts              # 用户状态
│   │   │   ├── anniversary.ts       # 纪念日状态
│   │   │   ├── timeline.ts          # 时间轴状态
│   │   │   └── milestone.ts         # 里程碑状态
│   │   ├── types/                   # TypeScript 类型定义
│   │   │   ├── user.ts
│   │   │   ├── anniversary.ts
│   │   │   ├── timeline.ts
│   │   │   └── milestone.ts
│   │   ├── utils/                   # 工具函数
│   │   │   ├── date.ts              # 日期处理
│   │   │   ├── storage.ts           # 本地存储
│   │   │   └── auth.ts              # 认证相关
│   │   ├── app.config.ts            # 应用配置
│   │   ├── app.ts                   # 入口文件
│   │   └── index.html               # H5 入口
│   ├── config/                      # Taro 配置
│   │   ├── index.ts
│   │   ├── dev.ts
│   │   └── prod.ts
│   ├── package.json
│   └── tsconfig.json
│
├── server/                          # Spring Boot 后端项目
│   ├── src/main/java/com/timerecord/
│   │   ├── controller/              # 控制器层
│   │   ├── service/                 # 服务层
│   │   ├── repository/              # 数据访问层
│   │   ├── entity/                  # 实体类
│   │   ├── dto/                     # 数据传输对象
│   │   ├── config/                  # 配置类
│   │   ├── security/                # 安全相关
│   │   └── TimeRecordApplication.java
│   ├── src/main/resources/
│   │   ├── application.yml          # 应用配置
│   │   └── application-prod.yml     # 生产环境配置
│   └── pom.xml
│
├── docs/                            # 文档目录
│   └── superpowers/
│       └── specs/                   # 设计文档
│
└── README.md
```

## 技术栈

### 前端

- **框架：** Taro 3.x
- **UI库：** Vue3 + TypeScript
- **状态管理：** Pinia
- **UI组件：** NutUI
- **HTTP请求：** Taro.request (封装)

### 后端

- **框架：** Spring Boot 3.x
- **数据库：** H2 (文件模式)
- **认证：** JWT
- **构建工具：** Maven