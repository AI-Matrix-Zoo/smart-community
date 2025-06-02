#!/bin/bash

# 智慧moma生活平台 - 开发环境管理脚本
# 用于在同一台服务器上隔离开发和生产环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="智慧moma生活平台"
VERSION="2.0.0"
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
    echo -e "${GREEN}${PROJECT_NAME} 开发环境管理脚本 v${VERSION}${NC}"
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

# 检查系统依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查Node.js
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        log_success "Node.js: $NODE_VERSION"
    else
        log_error "Node.js 未安装"
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

# 停止开发环境服务
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
    
    # 停止PM2开发进程
    if command -v pm2 >/dev/null 2>&1; then
        pm2 delete smart-community-dev-backend 2>/dev/null || true
        pm2 delete smart-community-dev-frontend 2>/dev/null || true
        log_success "已停止PM2开发进程"
    fi
    
    log_success "开发环境服务已停止"
}

# 安装依赖
install_deps() {
    log_info "安装项目依赖..."
    
    # 安装后端依赖
    log_info "安装后端依赖..."
    cd backend
    npm install
    cd ..
    log_success "后端依赖安装完成"
    
    # 安装前端依赖
    log_info "安装前端依赖..."
    cd frontend
    npm install
    cd ..
    log_success "前端依赖安装完成"
    
    log_success "所有依赖安装完成"
}

# 初始化开发环境
init_dev() {
    log_info "初始化开发环境..."
    
    # 创建开发环境配置文件
    log_info "创建开发环境配置..."
    
    # 后端开发环境配置
    cat > backend/.env.development << EOF
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
    cat > frontend/.env.development << EOF
# 开发环境配置
VITE_API_BASE_URL=http://localhost:$DEV_PORT_BACKEND/api
VITE_APP_TITLE=智慧moma生活平台（开发环境）
VITE_APP_ENV=development
EOF
    
    # 创建开发环境数据库目录
    mkdir -p backend/database
    
    log_success "开发环境配置创建完成"
    log_info "开发环境端口配置："
    log_info "  前端: http://localhost:$DEV_PORT_FRONTEND"
    log_info "  后端: http://localhost:$DEV_PORT_BACKEND"
}

# 启动开发环境
start_dev() {
    log_info "启动开发环境..."
    
    # 检查端口
    if ! check_port $DEV_PORT_FRONTEND "前端开发服务器"; then
        log_error "前端开发端口 $DEV_PORT_FRONTEND 被占用，请先停止相关服务"
        exit 1
    fi
    
    if ! check_port $DEV_PORT_BACKEND "后端开发服务器"; then
        log_error "后端开发端口 $DEV_PORT_BACKEND 被占用，请先停止相关服务"
        exit 1
    fi
    
    # 启动后端开发服务器
    log_info "启动后端开发服务器..."
    cd backend
    
    # 设置开发环境变量
    export NODE_ENV=development
    export PORT=$DEV_PORT_BACKEND
    
    # 使用开发环境配置启动
    if [ -f ".env.development" ]; then
        export $(cat .env.development | grep -v '^#' | xargs)
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
    cd frontend
    
    # 设置前端开发端口
    export PORT=$DEV_PORT_FRONTEND
    
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

# 查看开发环境状态
status_dev() {
    log_info "开发环境状态："
    
    # 检查前端服务
    if lsof -Pi :$DEV_PORT_FRONTEND -sTCP:LISTEN -t >/dev/null 2>&1; then
        local frontend_pid=$(lsof -Pi :$DEV_PORT_FRONTEND -sTCP:LISTEN -t)
        log_success "前端开发服务器: 运行中 (PID: $frontend_pid, 端口: $DEV_PORT_FRONTEND)"
    else
        log_warning "前端开发服务器: 未运行"
    fi
    
    # 检查后端服务
    if lsof -Pi :$DEV_PORT_BACKEND -sTCP:LISTEN -t >/dev/null 2>&1; then
        local backend_pid=$(lsof -Pi :$DEV_PORT_BACKEND -sTCP:LISTEN -t)
        log_success "后端开发服务器: 运行中 (PID: $backend_pid, 端口: $DEV_PORT_BACKEND)"
    else
        log_warning "后端开发服务器: 未运行"
    fi
    
    # 检查生产环境状态
    log_info "生产环境状态："
    if lsof -Pi :$PROD_PORT_BACKEND -sTCP:LISTEN -t >/dev/null 2>&1; then
        local prod_pid=$(lsof -Pi :$PROD_PORT_BACKEND -sTCP:LISTEN -t)
        log_success "生产环境后端: 运行中 (PID: $prod_pid, 端口: $PROD_PORT_BACKEND)"
    else
        log_warning "生产环境后端: 未运行"
    fi
}

# 清理开发环境
clean_dev() {
    log_info "清理开发环境..."
    
    # 停止服务
    stop_dev
    
    # 删除开发环境配置文件
    rm -f backend/.env.development
    rm -f frontend/.env.development
    
    # 删除开发环境数据库
    rm -f backend/database/community_dev.db
    
    # 删除PID文件
    rm -f .dev-backend.pid
    rm -f .dev-frontend.pid
    
    # 删除开发环境日志
    rm -f logs/dev-*.log
    
    log_success "开发环境清理完成"
}

# 重置开发环境
reset_dev() {
    log_info "重置开发环境..."
    clean_dev
    init_dev
    log_success "开发环境重置完成"
}

# 显示帮助信息
show_help() {
    echo -e "${GREEN}${PROJECT_NAME} 开发环境管理脚本 v${VERSION}${NC}"
    echo ""
    echo "用法:"
    echo "  $0 <命令>"
    echo ""
    echo "可用命令:"
    echo "  install     安装项目依赖"
    echo "  init        初始化开发环境"
    echo "  start       启动开发环境"
    echo "  stop        停止开发环境"
    echo "  restart     重启开发环境"
    echo "  status      查看环境状态"
    echo "  clean       清理开发环境"
    echo "  reset       重置开发环境"
    echo "  help        显示帮助信息"
    echo ""
    echo "端口配置:"
    echo "  开发环境前端: $DEV_PORT_FRONTEND"
    echo "  开发环境后端: $DEV_PORT_BACKEND"
    echo "  生产环境前端: $PROD_PORT_FRONTEND (Nginx)"
    echo "  生产环境后端: $PROD_PORT_BACKEND"
    echo ""
    echo "示例:"
    echo "  $0 install    # 安装依赖"
    echo "  $0 init       # 初始化开发环境"
    echo "  $0 start      # 启动开发环境"
    echo "  $0 status     # 查看状态"
    echo ""
    echo "注意事项:"
    echo "  - 开发环境和生产环境使用不同的端口和数据库"
    echo "  - 开发环境数据库: backend/database/community_dev.db"
    echo "  - 生产环境数据库: backend/data/community.db"
    echo "  - 开发环境配置文件: .env.development"
    echo "  - 生产环境配置文件: .env (需要手动创建)"
}

# 主函数
main() {
    # 创建日志目录
    mkdir -p logs
    
    show_header
    check_dependencies
    
    case "${1:-help}" in
        install)
            install_deps
            ;;
        init)
            init_dev
            ;;
        start)
            start_dev
            ;;
        stop)
            stop_dev
            ;;
        restart)
            stop_dev
            sleep 2
            start_dev
            ;;
        status)
            status_dev
            ;;
        clean)
            clean_dev
            ;;
        reset)
            reset_dev
            ;;
        help|--help|-h)
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

# 执行主函数
main "$@" 