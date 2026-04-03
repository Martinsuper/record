#!/bin/bash

# 多设备同步服务启动脚本
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检测 docker compose 命令
if command -v docker-compose &> /dev/null; then
    DC="docker-compose"
elif docker compose version &> /dev/null 2>&1; then
    DC="docker compose"
else
    echo -e "${RED}Error: Docker Compose not found${NC}"
    exit 1
fi

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[OK]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

build() {
    print_info "Building Docker images..."
    $DC build --no-cache
    print_success "Build complete"
}

start() {
    print_info "Starting services..."
    $DC up -d
    sleep 5
    print_success "Services started"
    echo ""
    echo "API:        http://localhost:8080/api"
    echo "WebSocket:  ws://localhost:8080/ws/sync"
    echo ""
    echo "Logs:   $DC logs -f"
    echo "Stop:   $DC down"
}

stop() {
    print_info "Stopping services..."
    $DC down
    print_success "Services stopped"
}

logs() {
    $DC logs -f --tail=100
}

status() {
    $DC ps
}

dev() {
    print_info "Starting MySQL and Redis containers..."
    $DC up -d mysql redis
    sleep 10
    print_info "Running Spring Boot app locally..."
    mvn spring-boot:run
}

clean() {
    print_info "Removing all containers and volumes..."
    $DC down -v
    print_success "Cleanup complete"
}

case "${1:-help}" in
    start)   start ;;
    stop)    stop ;;
    restart) stop; sleep 2; start ;;
    build)   build ;;
    logs)    logs ;;
    status)  status ;;
    dev)     dev ;;
    clean)   clean ;;
    *)
        echo "Usage: $0 {start|stop|restart|build|logs|status|dev|clean}"
        ;;
esac