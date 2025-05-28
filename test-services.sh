#!/bin/bash

# 智慧小区生活平台 - 自动化服务测试脚本
# 用于启动前后端服务并进行基本功能测试

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # 端口被占用
    else
        return 1  # 端口空闲
    fi
}

# 等待服务启动
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    log_info "等待 $service_name 启动..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl --noproxy "*" -s "$url" >/dev/null 2>&1; then
            log_success "$service_name 已启动"
            return 0
        fi
        
        echo -n "."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    log_error "$service_name 启动超时"
    return 1
}

# 测试API端点
test_api_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    log_info "测试: $description"
    
    response=$(curl --noproxy "*" -s -w "%{http_code}" -o /tmp/api_response "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        log_success "✓ $description - 状态码: $response"
        return 0
    else
        log_error "✗ $description - 期望状态码: $expected_status, 实际: $response"
        return 1
    fi
}

# 清理函数
cleanup() {
    log_info "正在清理进程..."
    
    # 停止后端服务
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        log_info "后端服务已停止 (PID: $BACKEND_PID)"
    fi
    
    # 停止前端服务
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        log_info "前端服务已停止 (PID: $FRONTEND_PID)"
    fi
    
    # 清理临时文件
    rm -f /tmp/api_response
    
    log_success "清理完成"
}

# 设置信号处理
trap cleanup EXIT INT TERM

# 主函数
main() {
    log_info "开始智慧小区生活平台服务测试"
    echo "=================================="
    
    # 检查必要的命令
    for cmd in node npm curl lsof; do
        if ! command -v $cmd >/dev/null 2>&1; then
            log_error "缺少必要命令: $cmd"
            exit 1
        fi
    done
    
    # 检查项目结构
    if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        log_error "项目结构不正确，请确保存在 backend 和 frontend 目录"
        exit 1
    fi
    
    # 1. 安装依赖
    log_info "检查并安装依赖..."
    
    # 后端依赖
    if [ ! -d "backend/node_modules" ]; then
        log_info "安装后端依赖..."
        cd backend && npm install && cd ..
    else
        log_success "后端依赖已存在"
    fi
    
    # 前端依赖
    if [ ! -d "frontend/node_modules" ]; then
        log_info "安装前端依赖..."
        cd frontend && npm install && cd ..
    else
        log_success "前端依赖已存在"
    fi
    
    # 2. 构建后端
    log_info "构建后端..."
    cd backend
    npm run build
    cd ..
    log_success "后端构建完成"
    
    # 3. 检查端口占用
    BACKEND_PORT=3000
    FRONTEND_PORT=5173
    
    if check_port $BACKEND_PORT; then
        log_warning "端口 $BACKEND_PORT 已被占用，将尝试使用该服务"
        BACKEND_RUNNING=true
    else
        BACKEND_RUNNING=false
    fi
    
    if check_port $FRONTEND_PORT; then
        log_warning "端口 $FRONTEND_PORT 已被占用，将尝试使用该服务"
        FRONTEND_RUNNING=true
    else
        FRONTEND_RUNNING=false
    fi
    
    # 4. 启动后端服务
    if [ "$BACKEND_RUNNING" = false ]; then
        log_info "启动后端服务..."
        cd backend
        npm start > ../backend.log 2>&1 &
        BACKEND_PID=$!
        cd ..
        
        # 等待后端启动
        if ! wait_for_service "http://localhost:$BACKEND_PORT/api/health" "后端服务"; then
            log_error "后端服务启动失败"
            cat backend.log
            exit 1
        fi
    else
        log_info "使用已运行的后端服务"
    fi
    
    # 5. 启动前端服务
    if [ "$FRONTEND_RUNNING" = false ]; then
        log_info "启动前端服务..."
        cd frontend
        npm run dev > ../frontend.log 2>&1 &
        FRONTEND_PID=$!
        cd ..
        
        # 等待前端启动
        if ! wait_for_service "http://localhost:$FRONTEND_PORT" "前端服务"; then
            log_error "前端服务启动失败"
            cat frontend.log
            exit 1
        fi
    else
        log_info "使用已运行的前端服务"
    fi
    
    # 6. 运行API测试
    log_info "开始API功能测试..."
    echo "=================================="
    
    # 基础健康检查
    test_api_endpoint "http://localhost:$BACKEND_PORT/api/health" "200" "健康检查"
    
    # 认证相关测试 - 使用POST方法
    response=$(curl --noproxy "*" -s -w "%{http_code}" -o /tmp/api_response -X POST "http://localhost:$BACKEND_PORT/api/auth/register" 2>/dev/null || echo "000")
    if [ "$response" = "400" ]; then
        log_success "✓ 注册接口（无参数） - 状态码: $response"
    else
        log_error "✗ 注册接口（无参数） - 期望状态码: 400, 实际: $response"
    fi
    
    response=$(curl --noproxy "*" -s -w "%{http_code}" -o /tmp/api_response -X POST "http://localhost:$BACKEND_PORT/api/auth/login" 2>/dev/null || echo "000")
    if [ "$response" = "400" ]; then
        log_success "✓ 登录接口（无参数） - 状态码: $response"
    else
        log_error "✗ 登录接口（无参数） - 期望状态码: 400, 实际: $response"
    fi
    
    # 其他API端点测试
    test_api_endpoint "http://localhost:$BACKEND_PORT/api/suggestions" "401" "建议列表（未认证）"
    test_api_endpoint "http://localhost:$BACKEND_PORT/api/market" "200" "市场列表（公开访问）"
    test_api_endpoint "http://localhost:$BACKEND_PORT/api/announcements" "200" "公告列表（公开）"
    
    # 7. 前端访问测试
    log_info "测试前端访问..."
    if curl --noproxy "*" -s "http://localhost:$FRONTEND_PORT" | grep -q "智慧小区生活平台"; then
        log_success "✓ 前端页面加载正常"
    else
        log_error "✗ 前端页面加载失败"
    fi
    
    # 8. 显示服务信息
    echo ""
    log_success "所有测试完成！"
    echo "=================================="
    log_info "服务访问地址："
    echo "  前端: http://localhost:$FRONTEND_PORT"
    echo "  后端: http://localhost:$BACKEND_PORT"
    echo "  API文档: http://localhost:$BACKEND_PORT/api"
    echo ""
    log_info "日志文件："
    echo "  后端日志: backend.log"
    echo "  前端日志: frontend.log"
    echo ""
    log_warning "按 Ctrl+C 停止所有服务"
    
    # 保持脚本运行，直到用户中断
    while true; do
        sleep 1
    done
}

# 运行主函数
main "$@" 