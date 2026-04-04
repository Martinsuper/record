-- 创建数据库
CREATE DATABASE IF NOT EXISTS sync_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE sync_db;

-- 空间表
CREATE TABLE IF NOT EXISTS space (
    id VARCHAR(64) PRIMARY KEY,
    share_code VARCHAR(6) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 空间版本追踪表（新增）
CREATE TABLE IF NOT EXISTS space_version (
    space_id VARCHAR(64) PRIMARY KEY,
    max_version BIGINT DEFAULT 0,
    updated_at BIGINT,
    FOREIGN KEY (space_id) REFERENCES space(id) ON DELETE CASCADE
);

-- 设备表
CREATE TABLE IF NOT EXISTS device (
    id VARCHAR(64) PRIMARY KEY,
    space_id VARCHAR(64) NOT NULL,
    device_name VARCHAR(50),
    last_connected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (space_id) REFERENCES space(id) ON DELETE CASCADE,
    INDEX idx_space_id (space_id)
);

-- 事件表（修改：新增 version, deleted, 索引）
CREATE TABLE IF NOT EXISTS event (
    id VARCHAR(64) PRIMARY KEY,
    space_id VARCHAR(64) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type_id VARCHAR(64),
    time BIGINT NOT NULL,
    version BIGINT DEFAULT 1,
    deleted BOOLEAN DEFAULT FALSE,
    created_at BIGINT,
    updated_at BIGINT,
    FOREIGN KEY (space_id) REFERENCES space(id) ON DELETE CASCADE,
    INDEX idx_space_id (space_id),
    INDEX idx_space_version (space_id, version)
);

-- 纪念日表（修改：新增 version, deleted, 索引）
CREATE TABLE IF NOT EXISTS anniversary (
    id VARCHAR(64) PRIMARY KEY,
    space_id VARCHAR(64) NOT NULL,
    name VARCHAR(100) NOT NULL,
    date BIGINT NOT NULL,
    repeat_type VARCHAR(10),
    mode VARCHAR(10),
    category_id VARCHAR(64),
    sort_order INT DEFAULT 0,
    version BIGINT DEFAULT 1,
    deleted BOOLEAN DEFAULT FALSE,
    created_at BIGINT,
    updated_at BIGINT,
    FOREIGN KEY (space_id) REFERENCES space(id) ON DELETE CASCADE,
    INDEX idx_space_id (space_id),
    INDEX idx_space_version (space_id, version)
);

-- 事件类型表（修改：新增 version, deleted, 索引）
CREATE TABLE IF NOT EXISTS event_type (
    id VARCHAR(64) PRIMARY KEY,
    space_id VARCHAR(64) NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(10),
    icon VARCHAR(50),
    version BIGINT DEFAULT 1,
    deleted BOOLEAN DEFAULT FALSE,
    created_at BIGINT,
    FOREIGN KEY (space_id) REFERENCES space(id) ON DELETE CASCADE,
    INDEX idx_space_id (space_id),
    INDEX idx_space_version (space_id, version)
);

-- 纪念日分类表（修改：新增 version, deleted, 索引）
CREATE TABLE IF NOT EXISTS anniversary_category (
    id VARCHAR(64) PRIMARY KEY,
    space_id VARCHAR(64) NOT NULL,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(50),
    is_preset BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    version BIGINT DEFAULT 1,
    deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (space_id) REFERENCES space(id) ON DELETE CASCADE,
    INDEX idx_space_id (space_id),
    INDEX idx_space_version (space_id, version)
);
