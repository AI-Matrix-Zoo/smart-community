#!/bin/bash

# 智慧社区项目 - 外部访问启动脚本
# 确保前后端都能从其他设备访问

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

# 获取服务器IP地址
get_server_ip() {
    # 尝试多种方式获取服务器IP
    local server_ip=""
    
    # 方法1: 通过外部服务获取公网IP
    server_ip=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || true)
    
    if [ -z "$server_ip" ]; then
        # 方法2: 通过ip命令获取内网IP
        server_ip=$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'src \K\S+' || true)
    fi
    
    if [ -z "$server_ip" ]; then
        # 方法3: 通过hostname命令获取IP
        server_ip=$(hostname -I 2>/dev/null | awk '{print $1}' || true)
    fi
    
    if [ -z "$server_ip" ]; then
        # 默认使用localhost
        server_ip="localhost"
        log_warning "无法自动获取服务器IP，使用默认值: localhost"
    fi
    
    echo "$server_ip"
}

# 检查端口占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
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

# 停止现有服务
stop_services() {
    log_info "停止现有服务..."
    
    # 停止PM2进程
    if command -v pm2 >/dev/null 2>&1; then
        pm2 stop all 2>/dev/null || true
        pm2 delete all 2>/dev/null || true
    fi
    
    # 释放端口
    free_port 3000
    free_port 3001
    free_port 5173
    free_port 5174
    
    # 清理PID文件
    rm -f .production.pid .dev-backend.pid .dev-frontend.pid
    
    log_success "现有服务已停止"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
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
    
    # 创建生产环境配置
    cat > .env.production << EOF
# 生产环境配置 - 外部访问
NODE_ENV=production
PORT=3000

# JWT配置
JWT_SECRET=smart-community-external-access-secret-2024
JWT_EXPIRES_IN=7d

# 数据库配置
DB_PATH=./data/community.db

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# CORS配置 - 允许所有来源
FRONTEND_URL=*

# 日志级别
LOG_LEVEL=info

# 邮箱服务配置
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@qq.com
EMAIL_PASS=your-email-password
EMAIL_FROM=智慧小区 <your-email@qq.com>
EMAIL_ENABLED=false

# 短信服务配置
SMS_ENABLED=false
SMS_PROVIDER=mock
EOF

    # 确保数据目录存在
    mkdir -p data uploads logs
    
    # 启动后端服务
    log_info "启动后端服务 (监听所有网络接口)..."
    nohup env NODE_ENV=production PORT=3000 node dist/index.js > ../logs/backend-external-$(date +%Y%m%d-%H%M%S).log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    
    cd ..
    log_success "后端服务已启动 (PID: $BACKEND_PID)"
    
    # 等待后端启动
    log_info "等待后端服务启动..."
    local retry_count=0
    while [ $retry_count -lt 15 ]; do
        if curl -s http://localhost:3000/health >/dev/null 2>&1; then
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
    
    # 创建生产环境配置
    cat > .env.production << EOF
# 生产环境配置 - 外部访问
VITE_API_BASE_URL=http://${server_ip}:3000/api
VITE_APP_TITLE=智慧moma生活平台
VITE_APP_ENV=production
EOF

    # 使用serve启动前端
    if ! command -v serve >/dev/null 2>&1; then
        log_info "安装serve..."
        npm install -g serve
    fi
    
    # 启动前端服务 (监听所有网络接口)
    log_info "启动前端服务 (监听所有网络接口)..."
    nohup serve -s dist -l 5173 -H 0.0.0.0 > ../logs/frontend-external-$(date +%Y%m%d-%H%M%S).log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    
    cd ..
    log_success "前端服务已启动 (PID: $FRONTEND_PID)"
    
    # 等待前端启动
    log_info "等待前端服务启动..."
    sleep 5
    
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        log_success "前端服务启动成功"
        return 0
    else
        log_warning "前端服务可能仍在启动中"
        return 0
    fi
}

# 显示访问信息
show_access_info() {
    local server_ip=$1
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  智慧社区项目启动成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}📱 移动端访问地址：${NC}"
    echo -e "  前端应用: ${YELLOW}http://${server_ip}:5173${NC}"
    echo -e "  后端API: ${YELLOW}http://${server_ip}:3000/api${NC}"
    echo ""
    echo -e "${BLUE}🖥️  电脑端访问地址：${NC}"
    echo -e "  前端应用: ${YELLOW}http://localhost:5173${NC}"
    echo -e "  后端API: ${YELLOW}http://localhost:3000/api${NC}"
    echo ""
    echo -e "${BLUE}🔍 健康检查：${NC}"
    echo -e "  后端健康: ${YELLOW}http://${server_ip}:3000/health${NC}"
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
    echo -e "${BLUE}🛑 停止服务：${NC}"
    echo -e "  运行: ${YELLOW}./stop-external-access.sh${NC}"
    echo ""
}

# 主函数
main() {
    echo -e "${BLUE}"
    cat << "EOF"
  ____  __  __    _    ____ _____   __  __  ___  __  __    _    
 / ___||  \/  |  / \  |  _ \_   _| |  \/  |/ _ \|  \/  |  / \   
 \___ \| |\/| | / _ \ | |_) || |   | |\/| | | | | |\/| | / _ \  
  ___) | |  | |/ ___ \|  _ < | |   | |  | | |_| | |  | |/ ___ \ 
 |____/|_|  |_/_/   \_\_| \_\|_|   |_|  |_|\___/|_|  |_/_/   \_\

EOF
    echo -e "${NC}"
    echo -e "${GREEN}智慧社区项目 - 外部访问启动脚本${NC}"
    echo ""
    
    # 获取服务器IP
    SERVER_IP=$(get_server_ip)
    log_info "检测到服务器IP: $SERVER_IP"
    
    # 创建日志目录
    mkdir -p logs
    
    # 检查依赖
    if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
        log_error "请先安装依赖: ./unified-manager.sh install"
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
    show_access_info "$SERVER_IP"
    
    # 监控服务状态
    log_info "服务监控中... (按 Ctrl+C 停止)"
    
    cleanup() {
        echo ""
        log_info "正在停止服务..."
        if [ -f "backend.pid" ]; then
            kill $(cat backend.pid) 2>/dev/null || true
            rm -f backend.pid
        fi
        if [ -f "frontend.pid" ]; then
            kill $(cat frontend.pid) 2>/dev/null || true
            rm -f frontend.pid
        fi
        log_success "服务已停止"
        exit 0
    }
    
    trap cleanup INT TERM
    
    # 监控循环
    while true; do
        if [ -f "backend.pid" ] && [ -f "frontend.pid" ]; then
            BACKEND_PID=$(cat backend.pid)
            FRONTEND_PID=$(cat frontend.pid)
            
            if ! kill -0 $BACKEND_PID 2>/dev/null; then
                log_error "后端服务意外停止"
                break
            fi
            
            if ! kill -0 $FRONTEND_PID 2>/dev/null; then
                log_error "前端服务意外停止"
                break
            fi
        else
            log_error "PID文件丢失"
            break
        fi
        
        sleep 10
    done
    
    cleanup
}

# 运行主函数
main "$@" 