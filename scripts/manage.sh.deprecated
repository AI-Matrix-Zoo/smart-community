#!/bin/bash

# 智慧moma生活平台 - 一键管理脚本
# 版本: 2.0
# 功能: 项目安装、开发、构建、部署的一站式管理

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_NAME="智慧moma生活平台"
VERSION="2.0.0"
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"

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

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js (推荐版本 18+)"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装，请先安装 npm"
        exit 1
    fi
    
    # 显示版本信息
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    log_success "Node.js: $NODE_VERSION"
    log_success "npm: $NPM_VERSION"
}

# 安装依赖
install_dependencies() {
    log_header "安装项目依赖"
    
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
    
    # 检查环境文件
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        log_info "创建后端环境配置文件..."
        cat > "$BACKEND_DIR/.env" << EOF
# 服务器配置
PORT=3000
NODE_ENV=development

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# 邮件配置 (可选，用于邮箱验证)
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email@qq.com
SMTP_PASS=your-email-password

# 阿里云短信配置 (可选)
ALIBABA_CLOUD_ACCESS_KEY_ID=your-access-key-id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your-access-key-secret
ALIBABA_CLOUD_SMS_SIGN_NAME=your-sms-sign
ALIBABA_CLOUD_SMS_TEMPLATE_CODE=your-template-code

# 数据库配置 (使用内存数据库，无需配置)
# 生产环境建议使用 PostgreSQL 或 MySQL
EOF
        log_success "后端环境配置文件已创建"
    fi
    
    # 创建上传目录
    mkdir -p "$BACKEND_DIR/uploads"
    log_success "上传目录已创建"
    
    log_success "项目初始化完成！"
}

# 检查并释放端口
free_port() {
    local port=$1
    local pids=""
    if command -v lsof &>/dev/null; then
        pids=$(lsof -ti tcp:$port)
    elif command -v netstat &>/dev/null; then
        pids=$(netstat -tlnp 2>/dev/null | grep :$port | awk '{print $7}' | cut -d'/' -f1)
    fi
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}[WARNING] 端口 $port 被占用，自动释放...${NC}"
        for pid in $pids; do
            if [ "$pid" != "-" ]; then
                kill -9 $pid 2>/dev/null && echo -e "${GREEN}[SUCCESS] 已终止进程 $pid (端口:$port)${NC}"
            fi
        done
        sleep 1
    fi
}

# 开发模式
dev_mode() {
    log_header "启动开发环境"
    # 启动前自动释放端口
    free_port 3000
    free_port 5173
    
    log_info "启动后端服务..."
    cd $BACKEND_DIR
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # 等待后端启动
    sleep 3
    
    log_info "启动前端服务..."
    cd $FRONTEND_DIR
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    log_success "开发环境启动成功！"
    log_info "前端地址: http://localhost:5173"
    log_info "后端地址: http://localhost:3000"
    log_info "API文档: http://localhost:3000/health"
    
    # 等待用户中断
    log_info "按 Ctrl+C 停止服务..."
    
    # 捕获中断信号
    trap 'log_info "正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; log_success "服务已停止"; exit 0' INT
    
    # 等待进程
    wait
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
    free_port 3000

    # 构建项目
    build_project

    # 修复权限，确保Nginx可以访问文件
    log_info "修复文件权限..."
    chmod 755 /root 2>/dev/null || true
    chmod -R 755 /root/smart-community/frontend/dist 2>/dev/null || true
    log_success "文件权限已修复"

    # Nginx现在直接指向项目构建目录，无需复制文件
    log_info "Nginx配置已指向项目构建目录: /root/smart-community/frontend/dist"
    
    # 重载Nginx配置
    if command -v nginx &>/dev/null; then
        sudo nginx -t && sudo nginx -s reload && log_success "Nginx 配置已重载"
    else
        log_warning "未检测到 nginx 命令，请手动重载Nginx配置"
    fi

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

    # 启动生产服务，日志输出到logs文件夹
    log_info "启动生产环境后端服务..."
    cd $BACKEND_DIR
    LOG_FILE="../logs/backend-$(date +%Y%m%d-%H%M%S).log"
    nohup env NODE_ENV=production node dist/index.js > "$LOG_FILE" 2>&1 &
    PROD_PID=$!
    cd ..

    log_success "生产环境部署完成！"
    log_info "服务PID: $PROD_PID"
    log_info "前端地址: http://123.56.64.5"
    log_info "后端地址: http://localhost:3000"
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

# 清理项目
clean_project() {
    log_header "清理项目"
    
    log_info "清理后端..."
    cd $BACKEND_DIR
    rm -rf node_modules dist
    cd ..
    
    log_info "清理前端..."
    cd $FRONTEND_DIR
    rm -rf node_modules dist
    cd ..
    
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
    
    # 检查生产服务状态
    if [ -f ".production.pid" ]; then
        PID=$(cat .production.pid)
        if kill -0 $PID 2>/dev/null; then
            log_success "生产服务: 运行中 (PID: $PID)"
        else
            log_warning "生产服务: 已停止 (PID文件存在但进程不存在)"
        fi
    else
        log_info "生产服务: 未启动"
    fi
}

# 显示帮助
show_help() {
    echo -e "${CYAN}$PROJECT_NAME 管理脚本 v$VERSION${NC}"
    echo ""
    echo -e "${YELLOW}用法:${NC}"
    echo "  ./manage.sh <命令>"
    echo ""
    echo -e "${YELLOW}可用命令:${NC}"
    echo -e "  ${GREEN}install${NC}     安装项目依赖"
    echo -e "  ${GREEN}init${NC}        初始化项目配置"
    echo -e "  ${GREEN}dev${NC}         启动开发环境"
    echo -e "  ${GREEN}build${NC}       构建项目"
    echo -e "  ${GREEN}deploy${NC}      部署到生产环境"
    echo -e "  ${GREEN}stop${NC}        停止生产服务"
    echo -e "  ${GREEN}clean${NC}       清理项目文件"
    echo -e "  ${GREEN}reset${NC}       重置项目"
    echo -e "  ${GREEN}status${NC}      查看项目状态"
    echo -e "  ${GREEN}help${NC}        显示帮助信息"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo "  ./manage.sh install    # 安装依赖"
    echo "  ./manage.sh dev        # 启动开发环境"
    echo "  ./manage.sh deploy     # 部署生产环境"
    echo ""
    echo -e "${YELLOW}演示账户:${NC}"
    echo -e "  业主: ${CYAN}resident@example.com${NC} / password123"
    echo -e "  物业: ${CYAN}property@example.com${NC} / property123"
    echo -e "  管理员: ${CYAN}admin@example.com${NC} / admin123"
}

# 主函数
main() {
    # 显示项目信息
    echo -e "${CYAN}"
    echo "  ____  __  __    _    ____ _____   __  __  ___  __  __    _    "
    echo " / ___||  \/  |  / \  |  _ \_   _| |  \/  |/ _ \|  \/  |  / \   "
    echo " \___ \| |\/| | / _ \ | |_) || |   | |\/| | | | | |\/| | / _ \  "
    echo "  ___) | |  | |/ ___ \|  _ < | |   | |  | | |_| | |  | |/ ___ \ "
    echo " |____/|_|  |_/_/   \_\_| \_\|_|   |_|  |_|\___/|_|  |_/_/   \_\\"
    echo ""
    echo -e "${NC}${PURPLE}$PROJECT_NAME 管理脚本 v$VERSION${NC}"
    echo ""
    
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
            dev_mode
            ;;
        "build")
            build_project
            ;;
        "deploy")
            deploy_production
            ;;
        "stop")
            stop_production
            ;;
        "clean")
            clean_project
            ;;
        "reset")
            reset_project
            ;;
        "status")
            show_status
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