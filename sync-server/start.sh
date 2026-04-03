#!/bin/bash

# 多设备同步服务启动脚本
# 使用方法: ./start.sh [命令]
# 命令: start | stop | restart | logs | status | build | clean

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 打印带颜色的消息
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    print_success "Docker 环境检查通过"
}

# 构建镜像
build() {
    print_info "开始构建 Docker 镜像..."
    docker-compose build --no-cache
    print_success "镜像构建完成"
}

# 启动服务
start() {
    print_info "启动同步服务..."

    # 检查是否已运行
    if docker-compose ps | grep -q "sync-server.*running"; then
        print_warning "服务已在运行中"
        return 0
    fi

    docker-compose up -d

    print_info "等待服务启动..."
    sleep 10

    # 检查服务状态
    if docker-compose ps | grep -q "sync-server.*running"; then
        print_success "服务启动成功！"
        print_info "服务地址:"
        echo "  - API:    http://localhost:8080/api"
        echo "  - WebSocket: ws://localhost:8080/ws/sync"
        echo ""
        echo "查看日志: ./start.sh logs"
        echo "停止服务: ./start.sh stop"
    else
        print_error "服务启动失败，请检查日志"
        docker-compose logs --tail=50
        exit 1
    fi
}

# 停止服务
stop() {
    print_info "停止同步服务..."
    docker-compose down
    print_success "服务已停止"
}

# 重启服务
restart() {
    stop
    sleep 3
    start
}

# 查看日志
logs() {
    print_info "查看服务日志 (Ctrl+C 退出)..."
    docker-compose logs -f --tail=100
}

# 查看服务状态
status() {
    echo ""
    print_info "服务状态:"
    docker-compose ps
    echo ""

    # 检查各服务健康状态
    print_info "MySQL 状态:"
    docker exec sync-mysql mysqladmin ping -h localhost 2>/dev/null && print_success "MySQL 运行正常" || print_error "MySQL 异常"

    print_info "Redis 状态:"
    docker exec sync-redis redis-cli ping 2>/dev/null | grep -q "PONG" && print_success "Redis 运行正常" || print_error "Redis 异常"

    print_info "应用状态:"
    curl -s http://localhost:8080/api/space/verify?code=TEST > /dev/null 2>&1 && print_success "应用运行正常" || print_warning "应用可能还在启动中"
}

# 清理所有数据（危险操作）
clean() {
    print_warning "这将删除所有数据（数据库、Redis、卷）！"
    read -p "确定要继续吗？(yes/no): " confirm

    if [ "$confirm" = "yes" ]; then
        print_info "清理所有容器和数据卷..."
        docker-compose down -v
        docker system prune -f
        print_success "清理完成"
    else
        print_info "已取消"
    fi
}

# 开发模式（本地运行）
dev() {
    print_info "开发模式启动（需要本地 MySQL 和 Redis）..."

    # 检查 Maven
    if ! command -v mvn &> /dev/null; then
        print_error "Maven 未安装"
        exit 1
    fi

    # 启动本地 MySQL 和 Redis
    print_info "启动 MySQL 和 Redis 容器..."
    docker-compose up -d mysql redis

    print_info "等待数据库就绪..."
    sleep 10

    print_info "启动 Spring Boot 应用..."
    mvn spring-boot:run
}

# 帮助信息
help() {
    echo ""
    echo "多设备数据同步服务管理脚本"
    echo ""
    echo "使用方法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  start    启动所有服务（MySQL、Redis、应用）"
    echo "  stop     停止所有服务"
    echo "  restart  重启所有服务"
    echo "  build    构建 Docker 镜像"
    echo "  logs     查看服务日志"
    echo "  status   查看服务状态"
    echo "  dev      开发模式（本地运行应用，使用容器数据库）"
    echo "  clean    清理所有数据（危险操作）"
    echo "  help     显示此帮助信息"
    echo ""
}

# 主程序
case "${1:-}" in
    start)
        check_docker
        start
        ;;
    stop)
        check_docker
        stop
        ;;
    restart)
        check_docker
        restart
        ;;
    build)
        check_docker
        build
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    dev)
        check_docker
        dev
        ;;
    clean)
        check_docker
        clean
        ;;
    help|--help|-h)
        help
        ;;
    *)
        help
        echo ""
        print_error "未知命令: ${1:-}"
        exit 1
        ;;
esac