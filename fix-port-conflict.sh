#!/bin/bash

# 智慧社区项目端口冲突快速修复脚本
# 版本: 1.0.0
# 用途: 紧急处理端口冲突问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

log_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}智慧社区项目端口冲突快速修复脚本${NC}"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  -c, --check    检查端口占用情况"
    echo "  -f, --fix      修复端口冲突"
    echo "  -r, --restart  重启生产环境服务"
    echo "  -s, --status   查看服务状态"
    echo ""
    echo "示例:"
    echo "  $0 --check     # 检查端口占用"
    echo "  $0 --fix       # 修复端口冲突并重启服务"
    echo "  $0 --restart   # 重启生产环境服务"
}

# 检查端口占用
check_ports() {
    log_header "检查端口占用情况"
    
    # 检查3000端口
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid=$(lsof -Pi :3000 -sTCP:LISTEN -t)
        local process=$(ps -p $pid -o comm= 2>/dev/null || echo "未知进程")
        log_warning "端口 3000 被占用 (PID: $pid, 进程: $process)"
    else
        log_success "端口 3000 可用"
    fi
    
    # 检查3001端口
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid=$(lsof -Pi :3001 -sTCP:LISTEN -t)
        local process=$(ps -p $pid -o comm= 2>/dev/null || echo "未知进程")
        log_warning "端口 3001 被占用 (PID: $pid, 进程: $process)"
    else
        log_success "端口 3001 可用"
    fi
    
    # 显示所有smart-community相关进程
    echo ""
    log_info "smart-community相关进程:"
    ps aux | grep smart-community | grep -v grep || log_info "没有找到相关进程"
}

# 释放端口
free_port() {
    local port=$1
    local pids=$(lsof -ti tcp:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        log_warning "释放端口 $port..."
        for pid in $pids; do
            if [ "$pid" != "-" ]; then
                kill -9 $pid 2>/dev/null && log_success "已终止进程 $pid (端口:$port)"
            fi
        done
        sleep 2
    else
        log_info "端口 $port 没有被占用"
    fi
}

# 修复端口冲突
fix_conflicts() {
    log_header "修复端口冲突"
    
    # 停止所有smart-community相关进程
    log_info "停止所有smart-community相关进程..."
    pkill -f "smart-community" 2>/dev/null || log_info "没有找到相关进程"
    
    # 等待进程完全停止
    sleep 3
    
    # 释放端口
    free_port 3000
    free_port 3001
    
    log_success "端口冲突修复完成"
}

# 重启生产环境服务
restart_production() {
    log_header "重启生产环境服务"
    
    # 先修复冲突
    fix_conflicts
    
    # 进入后端目录
    cd backend
    
    # 确保代码已编译
    log_info "编译TypeScript代码..."
    npm run build
    
    # 启动生产环境服务
    log_info "启动生产环境服务..."
    ./start-production.sh &
    
    # 等待服务启动
    sleep 5
    
    # 检查服务状态
    if curl -s http://localhost:3000/health >/dev/null 2>&1; then
        log_success "生产环境服务启动成功"
        log_info "健康检查: http://localhost:3000/health"
        log_info "API地址: http://localhost:3000/api"
    else
        log_error "生产环境服务启动失败"
        return 1
    fi
}

# 查看服务状态
check_status() {
    log_header "服务状态检查"
    
    # 检查端口占用
    check_ports
    
    echo ""
    log_info "健康检查:"
    
    # 检查生产环境
    if curl -s http://localhost:3000/health >/dev/null 2>&1; then
        log_success "生产环境 (3000端口): 正常"
        curl -s http://localhost:3000/api/health | jq . 2>/dev/null || echo "API响应正常"
    else
        log_error "生产环境 (3000端口): 异常"
    fi
    
    # 检查开发环境
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        log_success "开发环境 (3001端口): 正常"
    else
        log_info "开发环境 (3001端口): 未运行"
    fi
}

# 主函数
main() {
    case "${1:-}" in
        -h|--help)
            show_help
            ;;
        -c|--check)
            check_ports
            ;;
        -f|--fix)
            fix_conflicts
            ;;
        -r|--restart)
            restart_production
            ;;
        -s|--status)
            check_status
            ;;
        "")
            log_error "请指定操作选项，使用 -h 查看帮助"
            exit 1
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@" 