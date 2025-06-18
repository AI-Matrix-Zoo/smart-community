#!/bin/bash

# 智慧社区项目 - 外部访问统一管理脚本
# 整合前后端的启动、重启、停止、状态检查等功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 配置变量
SERVER_IP="123.56.64.5"
BACKEND_PORT="3000"
FRONTEND_PORT="5173"
PROJECT_NAME="智慧社区项目"

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

# 显示Logo
show_logo() {
    echo -e "${CYAN}"
    cat << "EOF"
  ____  __  __    _    ____ _____   __  __  ___  __  __    _    
 / ___||  \/  |  / \  |  _ \_   _| |  \/  |/ _ \|  \/  |  / \   
 \___ \| |\/| | / _ \ | |_) || |   | |\/| | | | | |\/| | / _ \  
  ___) | |  | |/ ___ \|  _ < | |   | |  | | |_| | |  | |/ ___ \ 
 |____/|_|  |_/_/   \_\_| \_\|_|   |_|  |_|\___/|_|  |_/_/   \_\

EOF
    echo -e "${NC}"
    echo -e "${GREEN}${PROJECT_NAME} - 外部访问统一管理脚本${NC}"
    echo ""
}

# 获取服务器IP地址
get_server_ip() {
    local server_ip=""
    
    # 尝试多种方式获取服务器IP
    server_ip=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || true)
    
    if [ -z "$server_ip" ]; then
        server_ip=$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'src \K\S+' || true)
    fi
    
    if [ -z "$server_ip" ]; then
        server_ip=$(hostname -I 2>/dev/null | awk '{print $1}' || true)
    fi
    
    if [ -z "$server_ip" ]; then
        server_ip="localhost"
        log_warning "无法自动获取服务器IP，使用默认值: localhost"
    fi
    
    echo "$server_ip"
}

# 检查端口占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
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
        sleep 2
    fi
}

# 检查依赖
check_dependencies() {
    log_info "检查项目依赖..."
    
    if [ ! -d "backend/node_modules" ]; then
        log_error "后端依赖未安装，请先运行: cd backend && npm install"
        return 1
    fi
    
    if [ ! -d "frontend/node_modules" ]; then
        log_error "前端依赖未安装，请先运行: cd frontend && npm install"
        return 1
    fi
    
    if ! command -v serve >/dev/null 2>&1; then
        log_info "安装serve工具..."
        npm install -g serve
    fi
    
    log_success "依赖检查完成"
    return 0
}

# 构建项目
build_project() {
    log_header "构建项目"
    
    # 构建后端
    log_info "构建后端..."
    cd backend
    npm run build
    cd ..
    log_success "后端构建完成"
    
    # 构建前端
    log_info "构建前端..."
    cd frontend
    npm run build
    cd ..
    log_success "前端构建完成"
}

# 启动后端服务
start_backend() {
    local server_ip=$1
    
    log_info "启动后端服务..."
    cd backend
    
    # 确保数据目录存在
    mkdir -p data uploads logs
    
    # 启动后端服务
    log_info "启动后端服务 (监听所有网络接口)..."
    nohup env NODE_ENV=production PORT=$BACKEND_PORT FRONTEND_URL=* node dist/index.js > ../logs/backend-external-$(date +%Y%m%d-%H%M%S).log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    
    cd ..
    log_success "后端服务已启动 (PID: $BACKEND_PID)"
    
    # 等待后端启动
    log_info "等待后端服务启动..."
    local retry_count=0
    while [ $retry_count -lt 15 ]; do
        if curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
            log_success "后端服务启动成功"
            return 0
        fi
        sleep 2
        retry_count=$((retry_count + 1))
        log_info "等待后端启动... ($retry_count/15)"
    done
    
    log_error "后端服务启动超时"
    return 1
}

# 启动前端服务
start_frontend() {
    local server_ip=$1
    
    log_info "启动前端服务..."
    cd frontend
    
    # 启动前端服务
    log_info "启动前端服务 (监听所有网络接口)..."
    nohup serve -s dist -l $FRONTEND_PORT > ../logs/frontend-external-$(date +%Y%m%d-%H%M%S).log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    
    cd ..
    log_success "前端服务已启动 (PID: $FRONTEND_PID)"
    
    # 等待前端启动
    log_info "等待前端服务启动..."
    sleep 5
    
    if curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
        log_success "前端服务启动成功"
        return 0
    else
        log_warning "前端服务可能仍在启动中"
        return 0
    fi
}

# 停止服务
stop_services() {
    log_header "停止外部访问服务"
    
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
    free_port $BACKEND_PORT
    free_port $FRONTEND_PORT
    
    # 清理其他PID文件
    rm -f .production.pid .dev-backend.pid .dev-frontend.pid
    
    log_success "所有外部访问服务已停止"
}

# 检查服务状态
check_status() {
    log_header "外部访问状态检查"
    
    # 检查后端进程
    if [ -f "backend.pid" ]; then
        BACKEND_PID=$(cat backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            echo -e "${GREEN}✅ 后端服务运行中${NC} (PID: $BACKEND_PID)"
        else
            echo -e "${RED}❌ 后端服务未运行${NC} (PID文件存在但进程不存在)"
        fi
    else
        echo -e "${RED}❌ 后端服务未运行${NC} (无PID文件)"
    fi
    
    # 检查前端进程
    if [ -f "frontend.pid" ]; then
        FRONTEND_PID=$(cat frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            echo -e "${GREEN}✅ 前端服务运行中${NC} (PID: $FRONTEND_PID)"
        else
            echo -e "${RED}❌ 前端服务未运行${NC} (PID文件存在但进程不存在)"
        fi
    else
        echo -e "${RED}❌ 前端服务未运行${NC} (无PID文件)"
    fi
    
    echo ""
    
    # 检查端口占用
    echo -e "${BLUE}端口占用情况:${NC}"
    if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 端口 $BACKEND_PORT (后端)${NC} - $(lsof -Pi :$BACKEND_PORT -sTCP:LISTEN | tail -1 | awk '{print $1, $2}')"
    else
        echo -e "${RED}❌ 端口 $BACKEND_PORT (后端) 未被占用${NC}"
    fi
    
    if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 端口 $FRONTEND_PORT (前端)${NC} - $(lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN | tail -1 | awk '{print $1, $2}')"
    else
        echo -e "${RED}❌ 端口 $FRONTEND_PORT (前端) 未被占用${NC}"
    fi
    
    echo ""
    
    # 检查服务响应
    echo -e "${BLUE}服务响应检查:${NC}"
    
    # 后端健康检查
    if curl -s --connect-timeout 5 "http://localhost:$BACKEND_PORT/health" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 后端健康检查${NC} - http://localhost:$BACKEND_PORT/health"
    else
        echo -e "${RED}❌ 后端健康检查失败${NC}"
    fi
    
    # 前端页面检查
    if curl -s --connect-timeout 5 "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 前端页面响应${NC} - http://localhost:$FRONTEND_PORT"
    else
        echo -e "${RED}❌ 前端页面响应失败${NC}"
    fi
    
    # 外部访问检查
    if curl -s --connect-timeout 5 "http://${SERVER_IP}:$BACKEND_PORT/health" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 外部后端访问${NC} - http://${SERVER_IP}:$BACKEND_PORT"
    else
        echo -e "${RED}❌ 外部后端访问失败${NC}"
    fi
    
    if curl -s --connect-timeout 5 "http://${SERVER_IP}:$FRONTEND_PORT" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 外部前端访问${NC} - http://${SERVER_IP}:$FRONTEND_PORT"
    else
        echo -e "${RED}❌ 外部前端访问失败${NC}"
    fi
}

# 测试API功能
test_api() {
    log_header "API功能测试"
    
    echo "1. 测试后端健康检查..."
    curl -s "http://${SERVER_IP}:${BACKEND_PORT}/health" | jq . 2>/dev/null || curl -s "http://${SERVER_IP}:${BACKEND_PORT}/health"
    echo ""
    
    echo "2. 测试API健康检查..."
    curl -s "http://${SERVER_IP}:${BACKEND_PORT}/api/health" | jq . 2>/dev/null || curl -s "http://${SERVER_IP}:${BACKEND_PORT}/api/health"
    echo ""
    
    echo "3. 测试市场物品API..."
    curl -s "http://${SERVER_IP}:${BACKEND_PORT}/api/market" | jq . 2>/dev/null || curl -s "http://${SERVER_IP}:${BACKEND_PORT}/api/market"
    echo ""
    
    echo "4. 测试公告API..."
    curl -s "http://${SERVER_IP}:${BACKEND_PORT}/api/announcements" | jq . 2>/dev/null || curl -s "http://${SERVER_IP}:${BACKEND_PORT}/api/announcements"
    echo ""
    
    echo "5. 测试前端页面..."
    if curl -s "http://${SERVER_IP}:${FRONTEND_PORT}" | grep -q "智慧"; then
        echo "✅ 前端页面可访问"
    else
        echo "❌ 前端页面访问失败"
    fi
    echo ""
    
    echo "6. 测试CORS..."
    curl -s -H "Origin: http://example.com" "http://${SERVER_IP}:${BACKEND_PORT}/api/health" | jq . 2>/dev/null || curl -s -H "Origin: http://example.com" "http://${SERVER_IP}:${BACKEND_PORT}/api/health"
    echo ""
}

# 显示访问信息
show_access_info() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ${PROJECT_NAME}启动成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}📱 移动端访问地址：${NC}"
    echo -e "  前端应用: ${YELLOW}http://${SERVER_IP}:${FRONTEND_PORT}${NC}"
    echo -e "  后端API: ${YELLOW}http://${SERVER_IP}:${BACKEND_PORT}/api${NC}"
    echo ""
    echo -e "${BLUE}🖥️  电脑端访问地址：${NC}"
    echo -e "  前端应用: ${YELLOW}http://localhost:${FRONTEND_PORT}${NC}"
    echo -e "  后端API: ${YELLOW}http://localhost:${BACKEND_PORT}/api${NC}"
    echo ""
    echo -e "${BLUE}🔍 健康检查：${NC}"
    echo -e "  后端健康: ${YELLOW}http://${SERVER_IP}:${BACKEND_PORT}/health${NC}"
    echo -e "  API健康: ${YELLOW}http://${SERVER_IP}:${BACKEND_PORT}/api/health${NC}"
    echo ""
    echo -e "${BLUE}📋 演示账户：${NC}"
    echo -e "  业主: ${YELLOW}resident@example.com${NC} / password123"
    echo -e "  物业: ${YELLOW}property@example.com${NC} / property123"
    echo -e "  管理员: ${YELLOW}admin@example.com${NC} / admin123"
    echo ""
    echo -e "${BLUE}📁 日志文件：${NC}"
    echo -e "  后端: logs/backend-external-*.log"
    echo -e "  前端: logs/frontend-external-*.log"
    echo ""
}

# 启动服务
start_services() {
    log_header "启动外部访问服务"
    
    # 获取服务器IP
    SERVER_IP=$(get_server_ip)
    log_info "检测到服务器IP: $SERVER_IP"
    
    # 创建日志目录
    mkdir -p logs
    
    # 检查依赖
    if ! check_dependencies; then
        exit 1
    fi
    
    # 停止现有服务
    stop_services
    
    # 构建项目
    build_project
    
    # 启动后端
    if ! start_backend "$SERVER_IP"; then
        log_error "后端启动失败"
        exit 1
    fi
    
    # 启动前端
    if ! start_frontend "$SERVER_IP"; then
        log_error "前端启动失败"
        exit 1
    fi
    
    # 显示访问信息
    show_access_info
    
    log_success "外部访问服务启动完成！"
}

# 重启服务
restart_services() {
    log_header "重启外部访问服务"
    
    log_info "停止现有服务..."
    stop_services
    
    sleep 3
    
    log_info "重新启动服务..."
    start_services
}

# 查看日志
view_logs() {
    local service=$1
    
    case $service in
        "backend"|"后端")
            log_info "查看后端日志..."
            if ls logs/backend-external-*.log 1> /dev/null 2>&1; then
                tail -f logs/backend-external-*.log
            else
                log_error "未找到后端日志文件"
            fi
            ;;
        "frontend"|"前端")
            log_info "查看前端日志..."
            if ls logs/frontend-external-*.log 1> /dev/null 2>&1; then
                tail -f logs/frontend-external-*.log
            else
                log_error "未找到前端日志文件"
            fi
            ;;
        *)
            log_info "查看所有日志..."
            if ls logs/*external*.log 1> /dev/null 2>&1; then
                tail -f logs/*external*.log
            else
                log_error "未找到日志文件"
            fi
            ;;
    esac
}

# 显示帮助信息
show_help() {
    echo -e "${CYAN}用法: $0 [命令] [选项]${NC}"
    echo ""
    echo -e "${YELLOW}可用命令:${NC}"
    echo -e "  ${GREEN}start${NC}     启动外部访问服务"
    echo -e "  ${GREEN}stop${NC}      停止外部访问服务"
    echo -e "  ${GREEN}restart${NC}   重启外部访问服务"
    echo -e "  ${GREEN}status${NC}    检查服务状态"
    echo -e "  ${GREEN}test${NC}      测试API功能"
    echo -e "  ${GREEN}logs${NC}      查看日志 [backend|frontend|all]"
    echo -e "  ${GREEN}build${NC}     仅构建项目"
    echo -e "  ${GREEN}info${NC}      显示访问信息"
    echo -e "  ${GREEN}help${NC}      显示帮助信息"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo -e "  $0 start          # 启动服务"
    echo -e "  $0 stop           # 停止服务"
    echo -e "  $0 restart        # 重启服务"
    echo -e "  $0 status         # 检查状态"
    echo -e "  $0 test           # 测试API"
    echo -e "  $0 logs backend   # 查看后端日志"
    echo -e "  $0 logs frontend  # 查看前端日志"
    echo ""
}

# 主函数
main() {
    # 显示Logo
    show_logo
    
    # 检查参数
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    # 处理命令
    case $1 in
        "start"|"启动")
            start_services
            ;;
        "stop"|"停止")
            stop_services
            ;;
        "restart"|"重启")
            restart_services
            ;;
        "status"|"状态")
            check_status
            show_access_info
            ;;
        "test"|"测试")
            test_api
            ;;
        "logs"|"日志")
            view_logs $2
            ;;
        "build"|"构建")
            build_project
            ;;
        "info"|"信息")
            show_access_info
            ;;
        "help"|"帮助"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@" 