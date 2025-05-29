#!/bin/bash

# 智慧小区生活平台 - 全栈项目管理脚本
# 支持前后端统一管理

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

# 显示帮助信息
show_help() {
    echo "智慧小区生活平台 - 全栈项目管理脚本"
    echo ""
    echo "用法: $0 [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  install          安装前后端依赖"
    echo "  build           构建前后端项目"
    echo "  dev             启动开发环境（前后端同时）"
    echo "  start           启动生产环境"
    echo "  test            运行自动化测试"
    echo "  test-services   启动服务并进行功能测试"
    echo "  stop            停止所有服务"
    echo "  clean           清理构建文件和依赖"
    echo "  status          查看服务状态"
    echo "  logs            查看服务日志"
    echo "  deploy          部署到生产环境"
    echo "  health          健康检查"
    echo "  quick-start     快速启动开发环境并打开浏览器"
    echo ""
    echo "选项:"
    echo "  --backend-only   仅操作后端"
    echo "  --frontend-only  仅操作前端"
    echo "  --help          显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 install                    # 安装所有依赖"
    echo "  $0 dev --backend-only         # 仅启动后端开发环境"
    echo "  $0 build --frontend-only      # 仅构建前端"
    echo "  $0 test-services              # 自动化服务测试"
}

# 检查项目结构
check_project_structure() {
    if [ ! -d "${SCRIPT_DIR}/backend" ] || [ ! -d "${SCRIPT_DIR}/frontend" ]; then
        log_error "项目结构不正确，请确保存在 backend 和 frontend 目录 (相对于脚本位置: ${SCRIPT_DIR})"
        exit 1
    fi
}

# 安装依赖
install_deps() {
    local backend_only=$1
    local frontend_only=$2
    
    if [ "$frontend_only" != "true" ]; then
        log_info "安装后端依赖 (位于 ${SCRIPT_DIR}/backend)..."
        (cd "${SCRIPT_DIR}/backend" && npm install)
        log_success "后端依赖安装完成"
    fi
    
    if [ "$backend_only" != "true" ]; then
        log_info "安装前端依赖 (位于 ${SCRIPT_DIR}/frontend)..."
        (cd "${SCRIPT_DIR}/frontend" && npm install)
        log_success "前端依赖安装完成"
    fi
}

# 构建项目
build_project() {
    local backend_only=$1
    local frontend_only=$2
    
    if [ "$frontend_only" != "true" ]; then
        log_info "构建后端 (位于 ${SCRIPT_DIR}/backend)..."
        (cd "${SCRIPT_DIR}/backend" && npm run build)
        log_success "后端构建完成"
    fi
    
    if [ "$backend_only" != "true" ]; then
        log_info "构建前端 (位于 ${SCRIPT_DIR}/frontend)..."
        (cd "${SCRIPT_DIR}/frontend" && npm run build)
        log_success "前端构建完成"
    fi
}

# 启动开发环境
start_dev() {
    local backend_only=$1
    local frontend_only=$2
    
    log_info "启动开发环境..."
    
    if [ "$frontend_only" != "true" ]; then
        log_info "启动后端开发服务器 (位于 ${SCRIPT_DIR}/backend)..."
        (cd "${SCRIPT_DIR}/backend" && npm run dev &)
        BACKEND_PID=$!
        echo $BACKEND_PID > "${SCRIPT_DIR}/runtime/.backend.pid"
    fi
    
    if [ "$backend_only" != "true" ]; then
        log_info "启动前端开发服务器 (位于 ${SCRIPT_DIR}/frontend)..."
        (cd "${SCRIPT_DIR}/frontend" && npm run dev &)
        FRONTEND_PID=$!
        echo $FRONTEND_PID > "${SCRIPT_DIR}/runtime/.frontend.pid"
    fi
    
    log_success "开发环境已启动"
    log_info "前端: http://localhost:5173"
    log_info "后端: http://localhost:3000"
    log_warning "按 Ctrl+C 停止服务"
    
    # 等待用户中断
    wait
}

# 启动生产环境
start_prod() {
    local backend_only=$1
    local frontend_only=$2
    
    log_info "启动生产环境..."
    
    if [ "$frontend_only" != "true" ]; then
        log_info "启动后端生产服务器 (位于 ${SCRIPT_DIR}/backend)..."
        (cd "${SCRIPT_DIR}/backend" && npm start &)
        BACKEND_PID=$!
        echo $BACKEND_PID > "${SCRIPT_DIR}/runtime/.backend.pid"
    fi
    
    if [ "$backend_only" != "true" ]; then
        log_info "启动前端预览服务器 (位于 ${SCRIPT_DIR}/frontend)..."
        (cd "${SCRIPT_DIR}/frontend" && npm run preview &)
        FRONTEND_PID=$!
        echo $FRONTEND_PID > "${SCRIPT_DIR}/runtime/.frontend.pid"
    fi
    
    log_success "生产环境已启动"
}

# 停止服务
stop_services() {
    log_info "停止所有服务..."
    
    if [ -f "${SCRIPT_DIR}/runtime/.backend.pid" ]; then
        BACKEND_PID=$(cat "${SCRIPT_DIR}/runtime/.backend.pid")
        kill $BACKEND_PID 2>/dev/null || true
        rm "${SCRIPT_DIR}/runtime/.backend.pid"
        log_info "后端服务已停止"
    fi
    
    if [ -f "${SCRIPT_DIR}/runtime/.frontend.pid" ]; then
        FRONTEND_PID=$(cat "${SCRIPT_DIR}/runtime/.frontend.pid")
        kill $FRONTEND_PID 2>/dev/null || true
        rm "${SCRIPT_DIR}/runtime/.frontend.pid"
        log_info "前端服务已停止"
    fi
    
    # 强制停止可能的残留进程
    pkill -f "npm.*dev" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "node.*dist" 2>/dev/null || true
    
    log_success "所有服务已停止"
}

# 运行测试
run_tests() {
    local backend_only=$1
    local frontend_only=$2
    
    if [ "$frontend_only" != "true" ]; then
        log_info "运行后端测试 (位于 ${SCRIPT_DIR}/backend)..."
        (cd "${SCRIPT_DIR}/backend" && npm test)
    fi
    
    if [ "$backend_only" != "true" ]; then
        log_info "运行前端测试 (位于 ${SCRIPT_DIR}/frontend)..."
        (cd "${SCRIPT_DIR}/frontend" && npm test)
    fi
    
    log_success "所有测试完成"
}

# 运行服务测试
run_service_tests() {
    log_info "启动自动化服务测试..."
    "${SCRIPT_DIR}/test-services.sh"
}

# 清理项目
clean_project() {
    log_info "清理项目..."
    
    # 停止服务
    stop_services
    
    # 清理构建文件
    rm -rf "${SCRIPT_DIR}/backend/dist"
    rm -rf "${SCRIPT_DIR}/frontend/dist"
    
    # 清理依赖（可选）
    read -p "是否删除 node_modules? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "${SCRIPT_DIR}/backend/node_modules"
        rm -rf "${SCRIPT_DIR}/frontend/node_modules"
        log_info "依赖已清理"
    fi
    
    # 清理日志文件
    rm -f "${SCRIPT_DIR}/logs"/*.log
    
    log_success "项目清理完成"
}

# 查看服务状态
check_status() {
    log_info "检查服务状态..."
    
    # 检查后端
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_success "后端服务运行中 (端口 3000)"
    else
        log_warning "后端服务未运行或端口3000未监听"
    fi
    
    # 检查前端
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_success "前端服务运行中 (端口 5173)"
    else
        log_warning "前端服务未运行或端口5173未监听"
    fi
}

# 查看日志
view_logs() {
    log_info "查看日志..."
    log_info "后端日志 (logs/backend.log):"
    tail -f "${SCRIPT_DIR}/logs/backend.log"
    # 可以根据需要添加前端日志查看
}

# 部署到生产环境 (示例，需要根据实际情况调整)
deploy() {
    log_info "开始部署到生产环境..."
    
    # 1. 检查Git状态
    if ! git diff-index --quiet HEAD --; then
        log_warning "检测到未提交的更改。建议先提交更改。"
        read -p "是否继续部署? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "部署已取消。"
            exit 0
        fi
    fi

    # 2. 拉取最新代码 (假设主分支为main)
    log_info "拉取最新代码 (main分支)..."
    git checkout main
    git pull origin main
    
    # 3. 安装依赖 (如果需要)
    # install_deps
    
    # 4. 构建项目
    build_project
    
    # 5. 启动生产服务
    # start_prod (可能需要更复杂的逻辑，如使用pm2)
    log_warning "生产环境启动逻辑未完全实现，请手动启动服务。"
    
    log_success "部署流程完成 (部分手动)。"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    local backend_ok=false
    local frontend_ok=false

    # 后端健康检查
    if curl -s --head http://localhost:3000/api/health | grep "200 OK" > /dev/null; then
        log_success "后端API健康 (http://localhost:3000/api/health)"
        backend_ok=true
    else
        log_error "后端API不健康或未运行"
    fi

    # 前端健康检查 (简单检查是否能访问首页)
    if curl -s --head http://localhost:5173 | grep "200 OK" > /dev/null; then
        log_success "前端服务健康 (http://localhost:5173)"
        frontend_ok=true
    else
        log_error "前端服务不健康或未运行"
    fi

    if [ "$backend_ok" = true ] && [ "$frontend_ok" = true ]; then
        log_success "所有服务健康"
    else
        log_error "部分服务不健康，请检查日志。"
        exit 1
    fi
}

# 快速启动开发环境并打开浏览器
quick_start() {
    log_info "快速启动开发环境..."
    
    # 检查并处理端口占用
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "后端端口 3000 已被占用，正在停止占用进程..."
        local pids=$(lsof -Pi :3000 -sTCP:LISTEN -t)
        for pid in $pids; do
            kill -TERM $pid 2>/dev/null || kill -KILL $pid 2>/dev/null
        done
        sleep 2
        log_info "已停止端口 3000 的占用进程"
    fi
    
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "前端端口 5173 已被占用，正在停止占用进程..."
        local pids=$(lsof -Pi :5173 -sTCP:LISTEN -t)
        for pid in $pids; do
            kill -TERM $pid 2>/dev/null || kill -KILL $pid 2>/dev/null
        done
        sleep 2
        log_info "已停止端口 5173 的占用进程"
    fi

    # 启动后端服务 (后台运行)
    log_info "启动后端服务..."
    cd "${SCRIPT_DIR}/backend" && npm start > "${SCRIPT_DIR}/logs/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "${SCRIPT_DIR}/runtime/.backend.pid"
    cd "${SCRIPT_DIR}"

    # 启动前端服务 (后台运行)
    log_info "启动前端服务..."
    cd "${SCRIPT_DIR}/frontend" && npm run dev > "${SCRIPT_DIR}/logs/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "${SCRIPT_DIR}/runtime/.frontend.pid"
    cd "${SCRIPT_DIR}"

    log_info "等待服务启动..."
    sleep 5 # 等待服务启动

    # 健康检查
    local backend_ready=false
    local frontend_ready=false
    local retry_count=0
    local max_retries=3
    
    # 重试机制
    while [ $retry_count -lt $max_retries ]; do
        if curl -s --head http://localhost:3000/api/health | grep "200 OK" > /dev/null; then
            log_success "后端服务启动成功"
            backend_ready=true
            break
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                log_info "后端服务尚未就绪，等待重试... ($retry_count/$max_retries)"
                sleep 3
            else
                log_error "后端服务启动失败，请检查 backend.log"
            fi
        fi
    done
    
    retry_count=0
    while [ $retry_count -lt $max_retries ]; do
        if curl -s --head http://localhost:5173 | grep "200 OK" > /dev/null; then
            log_success "前端服务启动成功"
            frontend_ready=true
            break
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                log_info "前端服务尚未就绪，等待重试... ($retry_count/$max_retries)"
                sleep 3
            else
                log_error "前端服务启动失败，请检查 frontend.log"
            fi
        fi
    done

    if [ "$backend_ready" = true ] && [ "$frontend_ready" = true ]; then
        log_success "🚀 智慧小区生活平台已启动！"
        echo "=================================="
        echo -e "📱 前端地址: ${GREEN}http://localhost:5173${NC}"
        echo -e "🔧 后端地址: ${GREEN}http://localhost:3000${NC}"
        echo -e "📊 API健康检查: ${GREEN}http://localhost:3000/api/health${NC}"
        echo "=================================="
        echo ""
        log_info "💡 使用提示："
        log_info "  - 访问前端查看完整的用户界面"
        log_info "  - 可以注册新用户或使用测试账号："
        log_info "    * 超级管理员: admin / admin"
        log_info "    * 普通用户: 13800138000 / password123"
        log_info "  - 建议反馈和二手市场需要登录后使用"
        log_info "  - 管理员功能需要管理员权限"
        echo ""
        
        # 打开浏览器 (macOS)
        if [[ "$(uname)" == "Darwin" ]]; then
            log_info "正在打开浏览器..."
            open http://localhost:5173
        fi

        log_warning "按 Ctrl+C 停止所有服务"
        
        # 设置信号处理器
        trap 'log_info "收到中断信号，正在停止服务..."; stop_services; exit 0' SIGINT SIGTERM
        
        # 保持脚本运行，等待用户中断
        while true; do
            # 检查进程是否还在运行
            if ! kill -0 $BACKEND_PID 2>/dev/null; then
                log_error "后端服务意外停止"
                break
            fi
            if ! kill -0 $FRONTEND_PID 2>/dev/null; then
                log_error "前端服务意外停止"
                break
            fi
            sleep 1
        done
        
        # 如果到达这里，说明有服务停止了
        stop_services
        exit 1
    else
        log_error "启动失败，请检查日志。"
        stop_services # 尝试停止已启动的服务
        exit 1
    fi
}

# 主逻辑
main() {
    check_project_structure

    local backend_only=false
    local frontend_only=false
    local command=""

    # 解析参数
    while [[ "$#" -gt 0 ]]; do
        case $1 in
            --backend-only)
                backend_only=true
                shift
                ;;
            --frontend-only)
                frontend_only=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                if [ -z "$command" ]; then
                    command=$1
                else
                    log_error "无效参数: $1"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done

    # 执行命令
    case $command in
        install)
            install_deps $backend_only $frontend_only
            ;;
        build)
            build_project $backend_only $frontend_only
            ;;
        dev)
            start_dev $backend_only $frontend_only
            ;;
        start)
            start_prod $backend_only $frontend_only
            ;;
        test)
            run_tests $backend_only $frontend_only
            ;;
        test-services)
            run_service_tests
            ;;
        stop)
            stop_services
            ;;
        clean)
            clean_project
            ;;
        status)
            check_status
            ;;
        logs)
            view_logs
            ;;
        deploy)
            deploy
            ;;
        health)
            health_check
            ;;
        quick-start)
            quick_start
            ;;
        "")
            show_help
            exit 0
            ;;
        *)
            log_error "无效命令: $command"
            show_help
            exit 1
            ;;
    esac
}

main "$@" 