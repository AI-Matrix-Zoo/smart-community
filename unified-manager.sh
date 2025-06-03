#!/bin/bash

# 智慧moma生活平台 - 统一管理脚本
# 版本: 3.0.0
# 功能: 开发环境和生产环境的一站式管理

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="智慧moma生活平台"
VERSION="3.0.0"
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"

# 端口配置
DEV_PORT_FRONTEND=5174  # 开发环境前端端口
DEV_PORT_BACKEND=3001   # 开发环境后端端口
PROD_PORT_FRONTEND=5173 # 生产环境前端端口
PROD_PORT_BACKEND=3000  # 生产环境后端端口

# 显示标题
show_header() {
    echo -e "${BLUE}"
    cat << "EOF"
  ____  __  __    _    ____ _____   __  __  ___  __  __    _    
 / ___||  \/  |  / \  |  _ \_   _| |  \/  |/ _ \|  \/  |  / \   
 \___ \| |\/| | / _ \ | |_) || |   | |\/| | | | | |\/| | / _ \  
  ___) | |  | |/ ___ \|  _ < | |   | |  | | |_| | |  | |/ ___ \ 
 |____/|_|  |_/_/   \_\_| \_\|_|   |_|  |_|\___/|_|  |_/_/   \_\

EOF
    echo -e "${NC}"
    echo -e "${GREEN}${PROJECT_NAME} 统一管理脚本 v${VERSION}${NC}"
    echo ""
}

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

# 检查系统依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查Node.js
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        log_success "Node.js: $NODE_VERSION"
    else
        log_error "Node.js 未安装，请先安装 Node.js (推荐版本 18+)"
        exit 1
    fi
    
    # 检查npm
    if command -v npm >/dev/null 2>&1; then
        NPM_VERSION=$(npm --version)
        log_success "npm: $NPM_VERSION"
    else
        log_error "npm 未安装"
        exit 1
    fi
    
    # 检查PM2
    if command -v pm2 >/dev/null 2>&1; then
        PM2_VERSION=$(pm2 --version)
        log_success "PM2: $PM2_VERSION"
    else
        log_warning "PM2 未安装，将使用npm start启动服务"
    fi
}

# 检查端口占用
check_port() {
    local port=$1
    local service_name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
        log_warning "端口 $port 被占用 (PID: $pid)，$service_name"
        return 1
    else
        log_success "端口 $port 可用"
        return 0
    fi
}

# 释放端口
free_port() {
    local port=$1
    local pids=""
    if command -v lsof &>/dev/null; then
        pids=$(lsof -ti tcp:$port)
    elif command -v netstat &>/dev/null; then
        pids=$(netstat -tlnp 2>/dev/null | grep :$port | awk '{print $7}' | cut -d'/' -f1)
    fi
    if [ -n "$pids" ]; then
        log_warning "端口 $port 被占用，自动释放..."
        for pid in $pids; do
            if [ "$pid" != "-" ]; then
                kill -9 $pid 2>/dev/null && log_success "已终止进程 $pid (端口:$port)"
            fi
        done
        sleep 1
    fi
}

# 安装依赖
install_dependencies() {
    log_header "安装项目依赖"
    
    # 安装根目录依赖
    if [ -f "package.json" ]; then
        log_info "安装根目录依赖..."
        npm install
        log_success "根目录依赖安装完成"
    fi
    
    # 安装后端依赖
    log_info "安装后端依赖..."
    cd $BACKEND_DIR
    npm install
    cd ..
    log_success "后端依赖安装完成"
    
    # 安装前端依赖
    log_info "安装前端依赖..."
    cd $FRONTEND_DIR
    npm install
    cd ..
    log_success "前端依赖安装完成"
    
    log_success "所有依赖安装完成！"
}

# 初始化项目
init_project() {
    log_header "初始化项目"
    
    # 创建必要目录
    mkdir -p logs
    mkdir -p $BACKEND_DIR/database
    mkdir -p $BACKEND_DIR/uploads
    
    # 创建生产环境配置
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        log_info "创建生产环境配置文件..."
        cat > "$BACKEND_DIR/.env" << EOF
# 生产环境配置
PORT=$PROD_PORT_BACKEND
NODE_ENV=production

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# 数据库配置
DB_PATH=./data/community.db

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# CORS配置
FRONTEND_URL=http://localhost:$PROD_PORT_FRONTEND

# 日志级别
LOG_LEVEL=info

# Twilio短信服务配置
TWILIO_ACCOUNT_SID=\${TWILIO_ACCOUNT_SID}
TWILIO_AUTH_TOKEN=\${TWILIO_AUTH_TOKEN}
TWILIO_PHONE_NUMBER=\${TWILIO_PHONE_NUMBER}

# 短信服务配置
SMS_ENABLED=true
SMS_PROVIDER=twilio

# 邮箱服务配置
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@qq.com
EMAIL_PASS=your-email-password
EMAIL_FROM=智慧小区 <your-email@qq.com>
EMAIL_ENABLED=false
EOF
        log_success "生产环境配置文件已创建"
    fi
    
    # 创建开发环境配置
    log_info "创建开发环境配置..."
    
    # 后端开发环境配置
    cat > $BACKEND_DIR/.env.development << EOF
# 开发环境配置
PORT=$DEV_PORT_BACKEND
NODE_ENV=development

# JWT配置
JWT_SECRET=dev-secret-key-2024
JWT_EXPIRES_IN=7d

# 数据库配置
DB_PATH=./database/community_dev.db

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# CORS配置
FRONTEND_URL=http://localhost:$DEV_PORT_FRONTEND

# 日志级别
LOG_LEVEL=debug

# Twilio短信服务配置（开发环境）
TWILIO_ACCOUNT_SID=\${TWILIO_ACCOUNT_SID}
TWILIO_AUTH_TOKEN=\${TWILIO_AUTH_TOKEN}
TWILIO_PHONE_NUMBER=\${TWILIO_PHONE_NUMBER}

# 短信服务配置
SMS_ENABLED=true
SMS_PROVIDER=twilio

# 邮箱服务配置
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@qq.com
EMAIL_PASS=your-email-password
EMAIL_FROM=智慧小区开发 <your-email@qq.com>
EMAIL_ENABLED=false
EOF
    
    # 前端开发环境配置
    cat > $FRONTEND_DIR/.env.development << EOF
# 开发环境配置
VITE_API_BASE_URL=http://localhost:$DEV_PORT_BACKEND/api
VITE_APP_TITLE=智慧moma生活平台（开发环境）
VITE_APP_ENV=development
EOF
    
    # 前端生产环境配置
    cat > $FRONTEND_DIR/.env.production << EOF
# 生产环境配置
VITE_API_BASE_URL=http://localhost:$PROD_PORT_BACKEND/api
VITE_APP_TITLE=智慧moma生活平台
VITE_APP_ENV=production
EOF
    
    log_success "项目初始化完成！"
    log_info "配置文件已创建："
    log_info "  生产环境: $BACKEND_DIR/.env"
    log_info "  开发环境: $BACKEND_DIR/.env.development"
    log_info "  前端开发: $FRONTEND_DIR/.env.development"
    log_info "  前端生产: $FRONTEND_DIR/.env.production"
}

# 启动开发环境
start_dev() {
    log_header "启动开发环境"
    
    # 检查端口
    if ! check_port $DEV_PORT_FRONTEND "前端开发服务器"; then
        free_port $DEV_PORT_FRONTEND
    fi
    
    if ! check_port $DEV_PORT_BACKEND "后端开发服务器"; then
        free_port $DEV_PORT_BACKEND
    fi
    
    # 启动后端开发服务器
    log_info "启动后端开发服务器..."
    cd $BACKEND_DIR
    
    # 设置开发环境变量
    export NODE_ENV=development
    export PORT=$DEV_PORT_BACKEND
    
    # 使用开发环境配置启动
    if [ -f ".env.development" ]; then
        set -a; source .env.development; set +a
    fi
    
    # 构建TypeScript
    npm run build
    
    # 启动开发服务器
    nohup npm start > ../logs/dev-backend-$(date +%Y%m%d-%H%M%S).log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../.dev-backend.pid
    
    cd ..
    log_success "后端开发服务器已启动 (PID: $BACKEND_PID, 端口: $DEV_PORT_BACKEND)"
    
    # 等待后端启动
    sleep 3
    
    # 启动前端开发服务器
    log_info "启动前端开发服务器..."
    cd $FRONTEND_DIR
    
    # 启动前端开发服务器
    nohup npm run dev -- --port $DEV_PORT_FRONTEND --host 0.0.0.0 > ../logs/dev-frontend-$(date +%Y%m%d-%H%M%S).log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../.dev-frontend.pid
    
    cd ..
    log_success "前端开发服务器已启动 (PID: $FRONTEND_PID, 端口: $DEV_PORT_FRONTEND)"
    
    log_success "开发环境启动完成！"
    log_info "访问地址："
    log_info "  前端: http://localhost:$DEV_PORT_FRONTEND"
    log_info "  后端API: http://localhost:$DEV_PORT_BACKEND/api"
    log_info "  后端健康检查: http://localhost:$DEV_PORT_BACKEND/health"
    
    log_info "日志文件："
    log_info "  后端: logs/dev-backend-*.log"
    log_info "  前端: logs/dev-frontend-*.log"
}

# 启动开发环境（交互式）
dev_interactive() {
    log_header "启动开发环境（交互式）"
    
    # 检查依赖是否已安装
    if [ ! -d "$BACKEND_DIR/node_modules" ] || [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        log_warning "检测到依赖未安装，正在安装..."
        install_dependencies
    fi
    
    # 检查配置文件
    if [ ! -f "$BACKEND_DIR/.env.development" ]; then
        log_warning "开发环境配置文件不存在，正在初始化..."
        init_project
    fi
    
    # 启动前自动释放端口
    log_info "清理端口..."
    free_port $DEV_PORT_BACKEND
    free_port $DEV_PORT_FRONTEND
    
    # 检查后端依赖
    log_info "检查后端依赖..."
    cd $BACKEND_DIR
    if ! npm list nodemon &>/dev/null; then
        log_warning "nodemon未安装，正在安装..."
        npm install --save-dev nodemon
    fi
    
    # 构建后端
    log_info "构建后端代码..."
    if ! npm run build; then
        log_error "后端构建失败"
        cd ..
        return 1
    fi
    
    log_info "启动后端服务..."
    # 设置开发环境
    export NODE_ENV=development
    export PORT=$DEV_PORT_BACKEND
    if [ -f ".env.development" ]; then
        set -a; source .env.development; set +a
    fi
    
    # 启动后端开发服务器（后台模式）
    nohup npm run dev > ../logs/dev-backend-interactive-$(date +%Y%m%d-%H%M%S).log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../.dev-backend.pid
    cd ..
    
    # 等待后端启动
    log_info "等待后端服务启动..."
    sleep 5
    
    # 检查后端是否启动成功
    local retry_count=0
    while [ $retry_count -lt 10 ]; do
        if curl -s http://localhost:$DEV_PORT_BACKEND/health &>/dev/null; then
            log_success "后端服务启动成功"
            break
        fi
        log_info "等待后端服务启动... ($((retry_count + 1))/10)"
        sleep 2
        retry_count=$((retry_count + 1))
    done
    
    if [ $retry_count -eq 10 ]; then
        log_error "后端服务启动超时"
        return 1
    fi
    
    log_info "启动前端服务..."
    cd $FRONTEND_DIR
    
    # 启动前端开发服务器（后台模式）
    nohup npm run dev -- --port $DEV_PORT_FRONTEND --host 0.0.0.0 > ../logs/dev-frontend-interactive-$(date +%Y%m%d-%H%M%S).log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../.dev-frontend.pid
    cd ..
    
    # 等待前端启动
    log_info "等待前端服务启动..."
    sleep 5
    
    log_success "开发环境启动成功！"
    echo ""
    log_info "🌐 访问地址："
    log_info "  前端应用: http://localhost:$DEV_PORT_FRONTEND"
    log_info "  后端API: http://localhost:$DEV_PORT_BACKEND/api"
    log_info "  健康检查: http://localhost:$DEV_PORT_BACKEND/health"
    echo ""
    log_info "📋 演示账户："
    log_info "  业主: resident@example.com / password123"
    log_info "  物业: property@example.com / property123"
    log_info "  管理员: admin@example.com / admin123"
    echo ""
    log_info "📁 日志文件："
    log_info "  后端: logs/dev-backend-interactive-*.log"
    log_info "  前端: logs/dev-frontend-interactive-*.log"
    echo ""
    log_info "按 Ctrl+C 停止服务..."
    
    # 捕获中断信号
    cleanup_dev() {
        echo ""
        log_info "正在停止服务..."
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
        # 等待进程结束
        sleep 2
        # 强制清理端口
        free_port $DEV_PORT_BACKEND
        free_port $DEV_PORT_FRONTEND
        # 清理PID文件
        rm -f .dev-backend.pid .dev-frontend.pid
        log_success "服务已停止"
        exit 0
    }
    
    trap cleanup_dev INT TERM
    
    # 监控进程状态
    while true; do
        if ! kill -0 $BACKEND_PID 2>/dev/null; then
            log_error "后端服务意外停止"
            break
        fi
        if ! kill -0 $FRONTEND_PID 2>/dev/null; then
            log_error "前端服务意外停止"
            break
        fi
        sleep 5
    done
    
    # 如果到这里说明有服务停止了
    cleanup_dev
}

# 停止开发环境
stop_dev() {
    log_info "停止开发环境服务..."
    
    # 停止前端开发服务器
    if lsof -Pi :$DEV_PORT_FRONTEND -sTCP:LISTEN -t >/dev/null 2>&1; then
        local frontend_pid=$(lsof -Pi :$DEV_PORT_FRONTEND -sTCP:LISTEN -t)
        kill $frontend_pid 2>/dev/null || true
        log_success "已停止前端开发服务器 (端口 $DEV_PORT_FRONTEND)"
    fi
    
    # 停止后端开发服务器
    if lsof -Pi :$DEV_PORT_BACKEND -sTCP:LISTEN -t >/dev/null 2>&1; then
        local backend_pid=$(lsof -Pi :$DEV_PORT_BACKEND -sTCP:LISTEN -t)
        kill $backend_pid 2>/dev/null || true
        log_success "已停止后端开发服务器 (端口 $DEV_PORT_BACKEND)"
    fi
    
    # 删除PID文件
    rm -f .dev-backend.pid
    rm -f .dev-frontend.pid
    
    log_success "开发环境服务已停止"
}

# 构建项目
build_project() {
    log_header "构建项目"
    
    # 构建后端
    log_info "构建后端..."
    cd $BACKEND_DIR
    npm run build
    cd ..
    log_success "后端构建完成"
    
    # 构建前端
    log_info "构建前端..."
    cd $FRONTEND_DIR
    npm run build
    cd ..
    log_success "前端构建完成"
    
    log_success "项目构建完成！"
    log_info "后端构建文件: $BACKEND_DIR/dist"
    log_info "前端构建文件: $FRONTEND_DIR/dist"
}

# 生产部署
deploy_production() {
    log_header "生产环境部署"
    
    # 启动前自动释放端口
    free_port $PROD_PORT_BACKEND

    # 构建项目
    build_project

    # 修复权限，确保Nginx可以访问文件
    log_info "修复文件权限..."
    chmod 755 /root 2>/dev/null || true
    chmod -R 755 $(pwd)/$FRONTEND_DIR/dist 2>/dev/null || true
    log_success "文件权限已修复"

    # 创建logs目录
    mkdir -p logs
    
    # 停止现有的生产服务
    if [ -f ".production.pid" ]; then
        OLD_PID=$(cat .production.pid)
        if kill -0 $OLD_PID 2>/dev/null; then
            kill $OLD_PID
            sleep 2
        fi
        rm -f .production.pid
    fi

    log_info "启动生产环境后端服务..."
    cd $BACKEND_DIR
    LOG_FILE="../logs/backend-$(date +%Y%m%d-%H%M%S).log"
    nohup env NODE_ENV=production node dist/index.js > "$LOG_FILE" 2>&1 &
    PROD_PID=$!
    cd ..

    log_success "生产环境部署完成！"
    log_info "服务PID: $PROD_PID"
    log_info "前端地址: http://localhost:$PROD_PORT_FRONTEND"
    log_info "后端地址: http://localhost:$PROD_PORT_BACKEND"
    log_info "日志文件: $LOG_FILE"

    # 保存PID到文件
    echo $PROD_PID > .production.pid
    log_info "PID已保存到 .production.pid"
}

# 停止生产服务
stop_production() {
    log_header "停止生产服务"
    
    if [ -f ".production.pid" ]; then
        PID=$(cat .production.pid)
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            rm .production.pid
            log_success "生产服务已停止"
        else
            log_warning "进程 $PID 不存在"
            rm .production.pid
        fi
    else
        log_warning "未找到生产服务PID文件"
    fi
}

# 查看状态
show_status() {
    log_header "项目状态"
    
    # 检查依赖安装状态
    if [ -d "$BACKEND_DIR/node_modules" ]; then
        log_success "后端依赖: 已安装"
    else
        log_warning "后端依赖: 未安装"
    fi
    
    if [ -d "$FRONTEND_DIR/node_modules" ]; then
        log_success "前端依赖: 已安装"
    else
        log_warning "前端依赖: 未安装"
    fi
    
    # 检查构建状态
    if [ -d "$BACKEND_DIR/dist" ]; then
        log_success "后端构建: 已完成"
    else
        log_warning "后端构建: 未完成"
    fi
    
    if [ -d "$FRONTEND_DIR/dist" ]; then
        log_success "前端构建: 已完成"
    else
        log_warning "前端构建: 未完成"
    fi
    
    # 检查开发环境状态
    log_info "开发环境状态："
    if lsof -Pi :$DEV_PORT_FRONTEND -sTCP:LISTEN -t >/dev/null 2>&1; then
        local frontend_pid=$(lsof -Pi :$DEV_PORT_FRONTEND -sTCP:LISTEN -t)
        log_success "前端开发服务器: 运行中 (PID: $frontend_pid, 端口: $DEV_PORT_FRONTEND)"
    else
        log_warning "前端开发服务器: 未运行"
    fi
    
    if lsof -Pi :$DEV_PORT_BACKEND -sTCP:LISTEN -t >/dev/null 2>&1; then
        local backend_pid=$(lsof -Pi :$DEV_PORT_BACKEND -sTCP:LISTEN -t)
        log_success "后端开发服务器: 运行中 (PID: $backend_pid, 端口: $DEV_PORT_BACKEND)"
    else
        log_warning "后端开发服务器: 未运行"
    fi
    
    # 检查生产服务状态
    log_info "生产环境状态："
    if [ -f ".production.pid" ]; then
        PID=$(cat .production.pid)
        if kill -0 $PID 2>/dev/null; then
            log_success "生产服务: 运行中 (PID: $PID, 端口: $PROD_PORT_BACKEND)"
        else
            log_warning "生产服务: 已停止 (PID文件存在但进程不存在)"
        fi
    else
        log_info "生产服务: 未启动"
    fi
}

# 清理项目
clean_project() {
    log_header "清理项目"
    
    # 停止所有服务
    stop_dev
    stop_production
    
    log_info "清理后端..."
    cd $BACKEND_DIR
    rm -rf node_modules dist
    cd ..
    
    log_info "清理前端..."
    cd $FRONTEND_DIR
    rm -rf node_modules dist
    cd ..
    
    # 清理日志
    rm -f logs/*.log
    
    # 清理配置文件
    rm -f $BACKEND_DIR/.env.development
    rm -f $FRONTEND_DIR/.env.development
    rm -f $FRONTEND_DIR/.env.production
    
    log_success "项目清理完成！"
}

# 重置项目
reset_project() {
    log_header "重置项目"
    
    clean_project
    install_dependencies
    init_project
    
    log_success "项目重置完成！"
}

# 显示帮助
show_help() {
    echo -e "${CYAN}$PROJECT_NAME 统一管理脚本 v$VERSION${NC}"
    echo ""
    echo -e "${YELLOW}用法:${NC}"
    echo "  ./unified-manager.sh <命令>"
    echo ""
    echo -e "${YELLOW}基础命令:${NC}"
    echo -e "  ${GREEN}install${NC}     安装项目依赖"
    echo -e "  ${GREEN}init${NC}        初始化项目配置"
    echo -e "  ${GREEN}status${NC}      查看项目状态"
    echo -e "  ${GREEN}clean${NC}       清理项目文件"
    echo -e "  ${GREEN}reset${NC}       重置项目"
    echo ""
    echo -e "${YELLOW}开发环境:${NC}"
    echo -e "  ${GREEN}dev${NC}         启动开发环境（交互式）"
    echo -e "  ${GREEN}dev-start${NC}   启动开发环境（后台运行）"
    echo -e "  ${GREEN}dev-stop${NC}    停止开发环境"
    echo ""
    echo -e "${YELLOW}生产环境:${NC}"
    echo -e "  ${GREEN}build${NC}       构建项目"
    echo -e "  ${GREEN}deploy${NC}      部署到生产环境"
    echo -e "  ${GREEN}prod-stop${NC}   停止生产服务"
    echo ""
    echo -e "${YELLOW}端口配置:${NC}"
    echo -e "  开发环境前端: ${CYAN}http://localhost:$DEV_PORT_FRONTEND${NC}"
    echo -e "  开发环境后端: ${CYAN}http://localhost:$DEV_PORT_BACKEND${NC}"
    echo -e "  生产环境前端: ${CYAN}http://localhost:$PROD_PORT_FRONTEND${NC}"
    echo -e "  生产环境后端: ${CYAN}http://localhost:$PROD_PORT_BACKEND${NC}"
    echo ""
    echo -e "${YELLOW}快速开始:${NC}"
    echo "  ./unified-manager.sh install    # 安装依赖"
    echo "  ./unified-manager.sh init       # 初始化配置"
    echo "  ./unified-manager.sh dev        # 启动开发环境"
    echo ""
    echo -e "${YELLOW}演示账户:${NC}"
    echo -e "  业主: ${CYAN}resident@example.com${NC} / password123"
    echo -e "  物业: ${CYAN}property@example.com${NC} / property123"
    echo -e "  管理员: ${CYAN}admin@example.com${NC} / admin123"
}

# 主函数
main() {
    # 创建日志目录
    mkdir -p logs
    
    show_header
    
    # 检查参数
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    # 检查系统依赖
    check_dependencies
    
    # 执行命令
    case "$1" in
        "install")
            install_dependencies
            ;;
        "init")
            init_project
            ;;
        "dev")
            dev_interactive
            ;;
        "dev-start")
            start_dev
            ;;
        "dev-stop")
            stop_dev
            ;;
        "build")
            build_project
            ;;
        "deploy")
            deploy_production
            ;;
        "prod-stop")
            stop_production
            ;;
        "status")
            show_status
            ;;
        "clean")
            clean_project
            ;;
        "reset")
            reset_project
            ;;
        "help"|"-h"|"--help")
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