#!/bin/bash

# 本地测试脚本 - 使用本地 Maven 运行
# 需要：本地 MySQL 和 Redis 已运行

cd /Users/duanluyao/code/record/sync-server

echo "=== 同步服务本地测试 ==="
echo ""

# 1. 编译项目
echo "[1/4] 编译项目..."
mvn clean package -DskipTests -q
if [ $? -ne 0 ]; then
    echo "编译失败"
    exit 1
fi
echo "✓ 编译成功"

# 2. 检查数据库连接
echo ""
echo "[2/4] 检查数据库..."
echo "请确保 MySQL 和 Redis 已启动"
echo ""

# 3. 启动应用
echo "[3/4] 启动应用..."
echo "服务地址:"
echo "  API:       http://localhost:8080/api"
echo "  WebSocket: ws://localhost:8080/ws/sync"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

java -jar target/sync-server-1.0.0.jar