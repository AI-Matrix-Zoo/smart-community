#!/bin/bash

# 智慧社区项目 - 停止外部访问服务脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 释放端口
free_port() {
    local port=$1
    log_info "检查端口 $port..."
    
    local pids=$(lsof -ti tcp:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        log_warning "端口 $port 被占用，正在释放..."
        for pid in $pids; do
            if [ -n "$pid" ] && kill -0 $pid 2>/dev/null; then
                kill -9 $pid 2>/dev/null && log_success "已终止进程 $pid"
            fi
        done
        sleep 1
    else
        log_info "端口 $port 未被占用"
    fi
}

# 主函数
main() {
    echo -e "${BLUE}智慧社区项目 - 停止外部访问服务${NC}"
    echo ""
    
    log_info "停止外部访问服务..."
    
    # 停止通过PID文件管理的进程
    if [ -f "backend.pid" ]; then
        BACKEND_PID=$(cat backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID 2>/dev/null || true
            log_success "后端服务已停止 (PID: $BACKEND_PID)"
        fi
        rm -f backend.pid
    fi
    
    if [ -f "frontend.pid" ]; then
        FRONTEND_PID=$(cat frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID 2>/dev/null || true
            log_success "前端服务已停止 (PID: $FRONTEND_PID)"
        fi
        rm -f frontend.pid
    fi
    
    # 停止PM2进程
    if command -v pm2 >/dev/null 2>&1; then
        pm2 stop all 2>/dev/null || true
        pm2 delete all 2>/dev/null || true
        log_success "PM2进程已清理"
    fi
    
    # 强制释放端口
    free_port 3000
    free_port 5173
    
    # 清理其他PID文件
    rm -f .production.pid .dev-backend.pid .dev-frontend.pid
    
    log_success "所有外部访问服务已停止"
    echo ""
}

# 运行主函数
main "$@" 