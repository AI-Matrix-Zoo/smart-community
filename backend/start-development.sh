#!/bin/bash

# 智慧社区后端开发环境启动脚本
# 版本: 1.0.0

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查端口占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
        log_warning "端口 $port 被占用 (PID: $pid)"
        return 1
    else
        log_success "端口 $port 可用"
        return 0
    fi
}

# 释放端口
free_port() {
    local port=$1
    local pids=$(lsof -ti tcp:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        log_warning "端口 $port 被占用，正在释放..."
        for pid in $pids; do
            if [ "$pid" != "-" ]; then
                kill -9 $pid 2>/dev/null && log_success "已终止进程 $pid (端口:$port)"
            fi
        done
        sleep 2
    fi
}

log_info "🚀 启动智慧社区后端开发环境服务..."

# 设置开发环境变量
export NODE_ENV=development
export PORT=3001

# 检查并释放端口
if ! check_port 3001; then
    log_warning "端口3001被占用，尝试释放..."
    free_port 3001
fi

# 确保数据目录存在
mkdir -p data
mkdir -p uploads
mkdir -p logs

# 启动开发服务
log_info "启动开发环境服务..."
npx ts-node src/index.ts 