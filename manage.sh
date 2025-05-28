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
    if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        log_error "项目结构不正确，请确保存在 backend 和 frontend 目录"
        exit 1
    fi
}

# 安装依赖
install_deps() {
    local backend_only=$1
    local frontend_only=$2
    
    if [ "$frontend_only" != "true" ]; then
        log_info "安装后端依赖..."
        cd backend && npm install && cd ..
        log_success "后端依赖安装完成"
    fi
    
    if [ "$backend_only" != "true" ]; then
        log_info "安装前端依赖..."
        cd frontend && npm install && cd ..
        log_success "前端依赖安装完成"
    fi
}

# 构建项目
build_project() {
    local backend_only=$1
    local frontend_only=$2
    
    if [ "$frontend_only" != "true" ]; then
        log_info "构建后端..."
        cd backend && npm run build && cd ..
        log_success "后端构建完成"
    fi
    
    if [ "$backend_only" != "true" ]; then
        log_info "构建前端..."
        cd frontend && npm run build && cd ..
        log_success "前端构建完成"
    fi
}

# 启动开发环境
start_dev() {
    local backend_only=$1
    local frontend_only=$2
    
    log_info "启动开发环境..."
    
    if [ "$frontend_only" != "true" ]; then
        log_info "启动后端开发服务器..."
        cd backend && npm run dev &
        BACKEND_PID=$!
        cd ..
        echo $BACKEND_PID > .backend.pid
    fi
    
    if [ "$backend_only" != "true" ]; then
        log_info "启动前端开发服务器..."
        cd frontend && npm run dev &
        FRONTEND_PID=$!
        cd ..
        echo $FRONTEND_PID > .frontend.pid
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
        log_info "启动后端生产服务器..."
        cd backend && npm start &
        BACKEND_PID=$!
        cd ..
        echo $BACKEND_PID > .backend.pid
    fi
    
    if [ "$backend_only" != "true" ]; then
        log_info "启动前端预览服务器..."
        cd frontend && npm run preview &
        FRONTEND_PID=$!
        cd ..
        echo $FRONTEND_PID > .frontend.pid
    fi
    
    log_success "生产环境已启动"
}

# 停止服务
stop_services() {
    log_info "停止所有服务..."
    
    if [ -f ".backend.pid" ]; then
        BACKEND_PID=$(cat .backend.pid)
        kill $BACKEND_PID 2>/dev/null || true
        rm .backend.pid
        log_info "后端服务已停止"
    fi
    
    if [ -f ".frontend.pid" ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        kill $FRONTEND_PID 2>/dev/null || true
        rm .frontend.pid
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
        log_info "运行后端测试..."
        cd backend && npm test && cd ..
    fi
    
    if [ "$backend_only" != "true" ]; then
        log_info "运行前端测试..."
        cd frontend && npm test && cd ..
    fi
    
    log_success "所有测试完成"
}

# 运行服务测试
run_service_tests() {
    log_info "启动自动化服务测试..."
    ./test-services.sh
}

# 清理项目
clean_project() {
    log_info "清理项目..."
    
    # 停止服务
    stop_services
    
    # 清理构建文件
    rm -rf backend/dist
    rm -rf frontend/dist
    
    # 清理依赖（可选）
    read -p "是否删除 node_modules? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf backend/node_modules
        rm -rf frontend/node_modules
        log_info "依赖已清理"
    fi
    
    # 清理日志文件
    rm -f *.log
    
    log_success "项目清理完成"
}

# 查看服务状态
check_status() {
    log_info "检查服务状态..."
    
    # 检查后端
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_success "后端服务运行中 (端口 3000)"
    else
        log_warning "后端服务未运行"
    fi
    
    # 检查前端
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_success "前端服务运行中 (端口 5173)"
    else
        log_warning "前端服务未运行"
    fi
}

# 查看日志
view_logs() {
    log_info "查看服务日志..."
    
    if [ -f "backend.log" ]; then
        echo "=== 后端日志 ==="
        tail -n 20 backend.log
    fi
    
    if [ -f "frontend.log" ]; then
        echo "=== 前端日志 ==="
        tail -n 20 frontend.log
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查后端健康
    if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
        log_success "后端健康检查通过"
    else
        log_error "后端健康检查失败"
    fi
    
    # 检查前端
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        log_success "前端健康检查通过"
    else
        log_error "前端健康检查失败"
    fi
}

# 部署到生产环境
deploy() {
    log_info "准备部署到生产环境..."
    
    # 构建项目
    build_project false false
    
    log_info "部署配置："
    echo "  后端: 使用 render.yaml"
    echo "  前端: 使用 frontend/render-frontend.yaml"
    echo ""
    log_info "部署步骤："
    echo "1. 将代码推送到 Git 仓库"
    echo "2. 在 Render 中连接仓库"
    echo "3. 后端会自动使用根目录的 render.yaml"
    echo "4. 前端会自动使用 frontend/render-frontend.yaml"
    echo ""
    log_warning "请确保已配置好环境变量"
}

# 信号处理
cleanup() {
    log_info "正在清理..."
    stop_services
    exit 0
}

trap cleanup EXIT INT TERM

# 主函数
main() {
    # 解析参数
    BACKEND_ONLY=false
    FRONTEND_ONLY=false
    COMMAND=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backend-only)
                BACKEND_ONLY=true
                shift
                ;;
            --frontend-only)
                FRONTEND_ONLY=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                if [ -z "$COMMAND" ]; then
                    COMMAND=$1
                fi
                shift
                ;;
        esac
    done
    
    # 检查项目结构
    check_project_structure
    
    # 执行命令
    case $COMMAND in
        install)
            install_deps $BACKEND_ONLY $FRONTEND_ONLY
            ;;
        build)
            build_project $BACKEND_ONLY $FRONTEND_ONLY
            ;;
        dev)
            start_dev $BACKEND_ONLY $FRONTEND_ONLY
            ;;
        start)
            start_prod $BACKEND_ONLY $FRONTEND_ONLY
            ;;
        test)
            run_tests $BACKEND_ONLY $FRONTEND_ONLY
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
        *)
            log_error "未知命令: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

# 快速启动开发环境并打开浏览器
quick_start() {
    log_info "快速启动开发环境..."
    
    # 检查端口占用
    if check_port 3000; then
        log_warning "后端端口 3000 已被占用"
    else
        log_info "启动后端服务..."
        cd backend && npm start > ../backend.log 2>&1 &
        BACKEND_PID=$!
        cd ..
        echo $BACKEND_PID > .backend.pid
    fi
    
    if check_port 5173; then
        log_warning "前端端口 5173 已被占用"
    else
        log_info "启动前端服务..."
        cd frontend && npm run dev > ../frontend.log 2>&1 &
        FRONTEND_PID=$!
        cd ..
        echo $FRONTEND_PID > .frontend.pid
    fi
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 5
    
    # 健康检查
    if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
        log_success "后端服务启动成功"
    else
        log_error "后端服务启动失败"
    fi
    
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        log_success "前端服务启动成功"
    else
        log_error "前端服务启动失败"
    fi
    
    # 显示访问信息
    echo ""
    log_success "🚀 智慧小区生活平台已启动！"
    echo "=================================="
    echo "📱 前端地址: http://localhost:5173"
    echo "🔧 后端地址: http://localhost:3000"
    echo "📊 API健康检查: http://localhost:3000/api/health"
    echo ""
    log_info "💡 使用提示："
    echo "  - 访问前端查看完整的用户界面"
    echo "  - 可以注册新用户或使用测试账号"
    echo "  - 建议反馈和二手市场需要登录后使用"
    echo "  - 管理员功能需要管理员权限"
    echo ""
    
    # 尝试打开浏览器（macOS）
    if command -v open >/dev/null 2>&1; then
        log_info "正在打开浏览器..."
        open http://localhost:5173
    fi
    
    log_warning "按 Ctrl+C 停止所有服务"
    
    # 保持脚本运行
    while true; do
        sleep 1
    done
}

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # 端口被占用
    else
        return 1  # 端口空闲
    fi
}

# 运行主函数
main "$@" 