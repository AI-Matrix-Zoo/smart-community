#!/bin/bash

# 智慧小区生活平台 - 全栈项目管理脚本
# 支持前后端统一管理和PM2生产环境管理

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

# 检查PM2是否安装
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log_warning "PM2 未安装，正在安装..."
        npm install -g pm2
        log_success "PM2 安装完成"
    fi
}

# 显示帮助信息
show_help() {
    echo "智慧小区生活平台 - 全栈项目管理脚本"
    echo ""
    echo "用法: $0 [命令] [选项]"
    echo ""
    echo "开发环境命令:"
    echo "  install          安装前后端依赖"
    echo "  build           构建前后端项目"
    echo "  dev             启动开发环境（前后端同时）"
    echo "  quick-start     快速启动开发环境并打开浏览器"
    echo "  test            运行自动化测试"
    echo "  test-services   启动服务并进行功能测试"
    echo ""
    echo "生产环境命令 (PM2):"
    echo "  pm2:start       使用PM2启动生产环境"
    echo "  pm2:stop        停止PM2管理的服务"
    echo "  pm2:restart     重启PM2管理的服务"
    echo "  pm2:reload      重载PM2管理的服务（零停机）"
    echo "  pm2:status      查看PM2服务状态"
    echo "  pm2:logs        查看PM2服务日志"
    echo "  pm2:monit       启动PM2监控界面"
    echo "  pm2:delete      删除PM2管理的服务"
    echo "  pm2:save        保存PM2进程列表"
    echo "  pm2:resurrect   恢复PM2进程列表"
    echo ""
    echo "部署命令:"
    echo "  deploy          完整部署流程（构建+PM2启动+Nginx重载）"
    echo "  deploy:frontend 仅部署前端（构建+复制到Nginx目录）"
    echo "  deploy:backend  仅部署后端（PM2重启）"
    echo ""
    echo "通用命令:"
    echo "  stop            停止所有服务（开发+生产）"
    echo "  clean           清理构建文件和依赖"
    echo "  status          查看所有服务状态"
    echo "  logs            查看服务日志"
    echo "  health          健康检查"
    echo ""
    echo "选项:"
    echo "  --backend-only   仅操作后端"
    echo "  --frontend-only  仅操作前端"
    echo "  --help          显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 install                    # 安装所有依赖"
    echo "  $0 dev --backend-only         # 仅启动后端开发环境"
    echo "  $0 pm2:start                  # 使用PM2启动生产环境"
    echo "  $0 deploy                     # 完整部署流程"
    echo "  $0 pm2:logs --backend-only    # 查看后端PM2日志"
}

# 检查项目结构
check_project_structure() {
    if [ ! -d "${SCRIPT_DIR}/backend" ] || [ ! -d "${SCRIPT_DIR}/frontend" ]; then
        log_error "项目结构不正确，请确保存在 backend 和 frontend 目录 (相对于脚本位置: ${SCRIPT_DIR})"
        exit 1
    fi
    
    # 创建必要的目录
    mkdir -p "${SCRIPT_DIR}/runtime"
    mkdir -p "${SCRIPT_DIR}/logs"
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

# PM2启动生产环境
pm2_start() {
    local backend_only=$1
    local frontend_only=$2
    
    check_pm2
    log_info "使用PM2启动生产环境..."
    
    if [ "$frontend_only" != "true" ]; then
        log_info "启动后端服务 (PM2)..."
        cd "${SCRIPT_DIR}/backend"
        
        # 检查是否存在ecosystem.config.js
        if [ -f "ecosystem.config.js" ]; then
            pm2 start ecosystem.config.js
        else
            # 使用默认配置启动
            pm2 start npm --name "smart-community-backend" -- start
        fi
        
        cd "${SCRIPT_DIR}"
        log_success "后端服务已通过PM2启动"
    fi
    
    # 前端在生产环境通常由Nginx提供静态文件服务
    if [ "$backend_only" != "true" ]; then
        log_info "前端在生产环境由Nginx提供服务"
        log_info "如需构建前端，请运行: $0 build --frontend-only"
    fi
}

# PM2停止服务
pm2_stop() {
    local backend_only=$1
    local frontend_only=$2
    
    check_pm2
    log_info "停止PM2管理的服务..."
    
    if [ "$frontend_only" != "true" ]; then
        pm2 stop smart-community-backend 2>/dev/null || log_warning "后端服务未在PM2中运行"
    fi
    
    log_success "PM2服务已停止"
}

# PM2重启服务
pm2_restart() {
    local backend_only=$1
    local frontend_only=$2
    
    check_pm2
    log_info "重启PM2管理的服务..."
    
    if [ "$frontend_only" != "true" ]; then
        pm2 restart smart-community-backend 2>/dev/null || {
            log_warning "后端服务未在PM2中运行，尝试启动..."
            pm2_start $backend_only $frontend_only
        }
    fi
    
    log_success "PM2服务已重启"
}

# PM2重载服务（零停机）
pm2_reload() {
    local backend_only=$1
    local frontend_only=$2
    
    check_pm2
    log_info "重载PM2管理的服务（零停机）..."
    
    if [ "$frontend_only" != "true" ]; then
        pm2 reload smart-community-backend 2>/dev/null || {
            log_warning "后端服务未在PM2中运行，尝试启动..."
            pm2_start $backend_only $frontend_only
        }
    fi
    
    log_success "PM2服务已重载"
}

# PM2查看状态
pm2_status() {
    check_pm2
    log_info "PM2服务状态:"
    pm2 status
}

# PM2查看日志
pm2_logs() {
    local backend_only=$1
    local frontend_only=$2
    
    check_pm2
    
    if [ "$frontend_only" != "true" ]; then
        log_info "查看后端PM2日志..."
        pm2 logs smart-community-backend
    else
        pm2 logs
    fi
}

# PM2监控界面
pm2_monit() {
    check_pm2
    log_info "启动PM2监控界面..."
    pm2 monit
}

# PM2删除服务
pm2_delete() {
    local backend_only=$1
    local frontend_only=$2
    
    check_pm2
    log_warning "这将删除PM2管理的服务配置"
    read -p "确认删除? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ "$frontend_only" != "true" ]; then
            pm2 delete smart-community-backend 2>/dev/null || log_warning "后端服务未在PM2中运行"
        fi
        log_success "PM2服务已删除"
    else
        log_info "操作已取消"
    fi
}

# PM2保存进程列表
pm2_save() {
    check_pm2
    log_info "保存PM2进程列表..."
    pm2 save
    log_success "PM2进程列表已保存"
}

# PM2恢复进程列表
pm2_resurrect() {
    check_pm2
    log_info "恢复PM2进程列表..."
    pm2 resurrect
    log_success "PM2进程列表已恢复"
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

# 停止所有服务
stop_all_services() {
    log_info "停止所有服务（开发环境 + PM2）..."
    
    # 停止开发环境服务
    if [ -f "${SCRIPT_DIR}/runtime/.backend.pid" ]; then
        BACKEND_PID=$(cat "${SCRIPT_DIR}/runtime/.backend.pid")
        kill $BACKEND_PID 2>/dev/null || true
        rm "${SCRIPT_DIR}/runtime/.backend.pid"
        log_info "开发环境后端服务已停止"
    fi
    
    if [ -f "${SCRIPT_DIR}/runtime/.frontend.pid" ]; then
        FRONTEND_PID=$(cat "${SCRIPT_DIR}/runtime/.frontend.pid")
        kill $FRONTEND_PID 2>/dev/null || true
        rm "${SCRIPT_DIR}/runtime/.frontend.pid"
        log_info "开发环境前端服务已停止"
    fi
    
    # 强制停止可能的残留进程
    pkill -f "npm.*dev" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "node.*dist" 2>/dev/null || true
    
    # 停止PM2服务
    if command -v pm2 &> /dev/null; then
        pm2 stop all 2>/dev/null || true
        log_info "PM2服务已停止"
    fi
    
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
    if [ -f "${SCRIPT_DIR}/tests/test-email-only-registration.sh" ]; then
        "${SCRIPT_DIR}/tests/test-email-only-registration.sh"
    else
        log_warning "测试脚本不存在: tests/test-email-only-registration.sh"
    fi
}

# 清理项目
clean_project() {
    log_info "清理项目..."
    
    # 停止服务
    stop_all_services
    
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
    
    echo "=== 开发环境状态 ==="
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
    
    echo ""
    echo "=== PM2状态 ==="
    if command -v pm2 &> /dev/null; then
        pm2 status
    else
        log_warning "PM2 未安装"
    fi
    
    echo ""
    echo "=== Nginx状态 ==="
    if systemctl is-active --quiet nginx; then
        log_success "Nginx 运行中"
    else
        log_warning "Nginx 未运行"
    fi
}

# 查看日志
view_logs() {
    local backend_only=$1
    local frontend_only=$2
    
    log_info "查看日志..."
    
    if [ "$frontend_only" != "true" ]; then
        if [ -f "${SCRIPT_DIR}/logs/backend.log" ]; then
            log_info "后端日志 (logs/backend.log):"
            tail -f "${SCRIPT_DIR}/logs/backend.log"
        else
            log_warning "后端日志文件不存在"
        fi
    fi
    
    if [ "$backend_only" != "true" ]; then
        if [ -f "${SCRIPT_DIR}/logs/frontend.log" ]; then
            log_info "前端日志 (logs/frontend.log):"
            tail -f "${SCRIPT_DIR}/logs/frontend.log"
        else
            log_warning "前端日志文件不存在"
        fi
    fi
}

# 部署前端
deploy_frontend() {
    log_info "部署前端..."
    
    # 构建前端
    build_project false true
    
    # 复制到Nginx目录
    if [ -d "/usr/share/nginx/html" ]; then
        log_info "复制前端文件到Nginx目录..."
        sudo cp -r "${SCRIPT_DIR}/frontend/dist/"* /usr/share/nginx/html/
        
        # 重载Nginx
        log_info "重载Nginx配置..."
        sudo systemctl reload nginx
        
        log_success "前端部署完成"
    else
        log_warning "Nginx目录不存在，请手动复制前端文件"
    fi
}

# 部署后端
deploy_backend() {
    log_info "部署后端..."
    
    # 构建后端
    build_project false true
    
    # 重启PM2服务
    pm2_restart false true
    
    log_success "后端部署完成"
}

# 完整部署
deploy_full() {
    log_info "开始完整部署流程..."
    
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

    # 2. 拉取最新代码
    log_info "拉取最新代码..."
    git pull origin main
    
    # 3. 安装依赖
    install_deps
    
    # 4. 构建项目
    build_project
    
    # 5. 部署前端
    deploy_frontend
    
    # 6. 部署后端
    deploy_backend
    
    # 7. 健康检查
    sleep 3
    health_check
    
    log_success "完整部署流程完成！"
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

    # 前端健康检查（生产环境检查80端口）
    if curl -s --head http://localhost | grep "200 OK" > /dev/null; then
        log_success "前端服务健康 (http://localhost)"
        frontend_ok=true
    elif curl -s --head http://localhost:5173 | grep "200 OK" > /dev/null; then
        log_success "前端开发服务健康 (http://localhost:5173)"
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
        log_info "    * 管理员: admin@example.com / admin123"
        log_info "    * 业主: resident@example.com / password123"
        log_info "    * 物业: property@example.com / property123"
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
        trap 'log_info "收到中断信号，正在停止服务..."; stop_all_services; exit 0' SIGINT SIGTERM
        
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
        stop_all_services
        exit 1
    else
        log_error "启动失败，请检查日志。"
        stop_all_services # 尝试停止已启动的服务
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
        quick-start)
            quick_start
            ;;
        test)
            run_tests $backend_only $frontend_only
            ;;
        test-services)
            run_service_tests
            ;;
        pm2:start)
            pm2_start $backend_only $frontend_only
            ;;
        pm2:stop)
            pm2_stop $backend_only $frontend_only
            ;;
        pm2:restart)
            pm2_restart $backend_only $frontend_only
            ;;
        pm2:reload)
            pm2_reload $backend_only $frontend_only
            ;;
        pm2:status)
            pm2_status
            ;;
        pm2:logs)
            pm2_logs $backend_only $frontend_only
            ;;
        pm2:monit)
            pm2_monit
            ;;
        pm2:delete)
            pm2_delete $backend_only $frontend_only
            ;;
        pm2:save)
            pm2_save
            ;;
        pm2:resurrect)
            pm2_resurrect
            ;;
        deploy)
            deploy_full
            ;;
        deploy:frontend)
            deploy_frontend
            ;;
        deploy:backend)
            deploy_backend
            ;;
        stop)
            stop_all_services
            ;;
        clean)
            clean_project
            ;;
        status)
            check_status
            ;;
        logs)
            view_logs $backend_only $frontend_only
            ;;
        health)
            health_check
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