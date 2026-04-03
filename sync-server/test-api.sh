#!/bin/bash

# API 测试脚本
# 用法: ./test-api.sh

API_URL="http://localhost:8080/api"

echo "=== 多设备同步 API 测试 ==="
echo ""

# 颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. 创建空间
echo -e "${BLUE}[1] 创建空间${NC}"
RESULT=$(curl -s -X POST "${API_URL}/space/create")
echo "响应: $RESULT"
echo ""

# 提取 shareCode
SHARE_CODE=$(echo $RESULT | grep -o '"shareCode":"[^"]*"' | cut -d'"' -f4)
SPACE_ID=$(echo $RESULT | grep -o '"spaceId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$SHARE_CODE" ]; then
    echo "创建空间失败，请检查服务是否启动"
    exit 1
fi

echo -e "${GREEN}✓ 空间创建成功${NC}"
echo "  Share Code: $SHARE_CODE"
echo "  Space ID: $SPACE_ID"
echo ""

# 2. 验证共享码
echo -e "${BLUE}[2] 验证共享码${NC}"
RESULT=$(curl -s "${API_URL}/space/verify?code=${SHARE_CODE}")
echo "响应: $RESULT"
echo ""

# 3. 添加事件
echo -e "${BLUE}[3] 添加事件${NC}"
RESULT=$(curl -s -X POST "${API_URL}/data/event" \
  -H "Content-Type: application/json" \
  -d "{
    \"spaceId\": \"${SPACE_ID}\",
    \"id\": \"event_test_001\",
    \"name\": \"测试事件\",
    \"typeId\": \"type_001\",
    \"time\": $(date +%s)000
  }")
echo "响应: $RESULT"
echo ""

# 4. 获取全量数据
echo -e "${BLUE}[4] 获取全量数据${NC}"
RESULT=$(curl -s "${API_URL}/space/${SPACE_ID}/data")
echo "响应: $RESULT"
echo ""

# 5. 添加纪念日
echo -e "${BLUE}[5] 添加纪念日${NC}"
RESULT=$(curl -s -X POST "${API_URL}/data/anniversary" \
  -H "Content-Type: application/json" \
  -d "{
    \"spaceId\": \"${SPACE_ID}\",
    \"id\": \"anniv_test_001\",
    \"name\": \"测试纪念日\",
    \"date\": $(date +%s)000,
    \"repeatType\": \"year\",
    \"mode\": \"countdown\"
  }")
echo "响应: $RESULT"
echo ""

# 6. 再次获取数据
echo -e "${BLUE}[6] 验证数据已保存${NC}"
RESULT=$(curl -s "${API_URL}/space/${SPACE_ID}/data")
echo "响应: $RESULT"
echo ""

echo -e "${GREEN}=== 测试完成 ===${NC}"
echo ""
echo "WebSocket 测试:"
echo "  ws://localhost:8080/ws/sync?shareCode=${SHARE_CODE}&deviceId=device_001"