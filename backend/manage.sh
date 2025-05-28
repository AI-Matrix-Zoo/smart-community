#!/bin/bash

# 智慧小区生活平台后端管理脚本
# 使用方法: ./manage.sh [命令]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_NAME="智慧小区生活平台后端"
PORT=${PORT:-3001}
NODE_ENV=${NODE_ENV:-development}

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
    log_info "检查依赖..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    if [ ! -f "package.json" ]; then
        log_error "package.json 不存在，请确保在项目根目录运行"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 安装依赖
install_deps() {
    log_header "安装依赖"
    npm install
    log_success "依赖安装完成"
}

# 构建项目
build_project() {
    log_header "构建项目"
    npm run build
    log_success "项目构建完成"
}

# 启动开发服务器
start_dev() {
    log_header "启动开发服务器"
    log_info "端口: $PORT"
    log_info "环境: development"
    log_info "按 Ctrl+C 停止服务器"
    npm run dev
}

# 启动生产服务器
start_prod() {
    log_header "启动生产服务器"
    
    # 确保构建是最新的
    if [ ! -d "dist" ]; then
        log_warning "dist 目录不存在，正在构建..."
        build_project
    fi
    
    log_info "端口: $PORT"
    log_info "环境: production"
    log_info "按 Ctrl+C 停止服务器"
    NODE_ENV=production npm start
}

# 重启服务
restart_service() {
    log_header "重启服务"
    
    # 查找并杀死现有进程
    if pgrep -f "node.*index.js" > /dev/null; then
        log_info "停止现有服务..."
        pkill -f "node.*index.js" || true
        sleep 2
    fi
    
    # 重新构建和启动
    build_project
    log_info "启动新服务..."
    NODE_ENV=production nohup npm start > server.log 2>&1 &
    
    sleep 3
    if pgrep -f "node.*index.js" > /dev/null; then
        log_success "服务重启成功"
        log_info "服务运行在端口 $PORT"
        log_info "日志文件: server.log"
    else
        log_error "服务启动失败，请检查 server.log"
        exit 1
    fi
}

# 停止服务
stop_service() {
    log_header "停止服务"
    
    if pgrep -f "node.*index.js" > /dev/null; then
        pkill -f "node.*index.js"
        log_success "服务已停止"
    else
        log_warning "没有运行中的服务"
    fi
}

# 查看服务状态
check_status() {
    log_header "服务状态"
    
    if pgrep -f "node.*index.js" > /dev/null; then
        PID=$(pgrep -f "node.*index.js")
        log_success "服务正在运行 (PID: $PID)"
        
        # 检查端口
        if command -v lsof &> /dev/null; then
            if lsof -i :$PORT > /dev/null 2>&1; then
                log_success "端口 $PORT 正在监听"
            else
                log_warning "端口 $PORT 未在监听"
            fi
        fi
        
        # 健康检查
        if command -v curl &> /dev/null; then
            if curl -s "http://localhost:$PORT/health" > /dev/null; then
                log_success "健康检查通过"
            else
                log_warning "健康检查失败"
            fi
        fi
    else
        log_warning "服务未运行"
    fi
}

# 查看日志
view_logs() {
    log_header "查看日志"
    
    if [ -f "server.log" ]; then
        log_info "显示最近50行日志 (按 Ctrl+C 退出):"
        tail -f -n 50 server.log
    else
        log_warning "日志文件不存在"
        log_info "如果服务正在运行，日志可能在终端输出"
    fi
}

# 运行测试
run_tests() {
    log_header "运行测试"
    
    # 检查是否有测试文件
    if [ -d "tests" ] || [ -d "test" ] || grep -q "test" package.json; then
        npm test
    else
        log_warning "未找到测试配置"
        log_info "可以添加测试脚本到 package.json"
    fi
}

# API测试
test_api() {
    log_header "API测试"
    
    BASE_URL="http://localhost:$PORT"
    
    log_info "测试健康检查端点..."
    if command -v curl &> /dev/null; then
        if curl -s "$BASE_URL/health" | grep -q "success"; then
            log_success "健康检查端点正常"
        else
            log_error "健康检查端点异常"
        fi
        
        log_info "测试API端点..."
        # 测试登录端点（应该返回400，因为没有提供数据）
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/login" -H "Content-Type: application/json")
        if [ "$HTTP_CODE" = "400" ]; then
            log_success "登录端点响应正常"
        else
            log_warning "登录端点响应异常 (HTTP $HTTP_CODE)"
        fi
        
        # 测试获取公告端点
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/announcements")
        if [ "$HTTP_CODE" = "200" ]; then
            log_success "公告端点响应正常"
        else
            log_warning "公告端点响应异常 (HTTP $HTTP_CODE)"
        fi
    else
        log_warning "curl 未安装，无法进行API测试"
    fi
}

# 数据库操作
manage_database() {
    log_header "数据库管理"
    
    DB_PATH=${DB_PATH:-"./data/community.db"}
    
    echo "1. 查看数据库信息"
    echo "2. 备份数据库"
    echo "3. 恢复数据库"
    echo "4. 清空数据库"
    echo "5. 返回主菜单"
    
    read -p "请选择操作 (1-5): " choice
    
    case $choice in
        1)
            if [ -f "$DB_PATH" ]; then
                log_info "数据库文件: $DB_PATH"
                log_info "文件大小: $(du -h "$DB_PATH" | cut -f1)"
                log_info "修改时间: $(stat -f "%Sm" "$DB_PATH" 2>/dev/null || stat -c "%y" "$DB_PATH" 2>/dev/null)"
            else
                log_warning "数据库文件不存在: $DB_PATH"
            fi
            ;;
        2)
            if [ -f "$DB_PATH" ]; then
                BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).db"
                cp "$DB_PATH" "$BACKUP_FILE"
                log_success "数据库已备份到: $BACKUP_FILE"
            else
                log_error "数据库文件不存在"
            fi
            ;;
        3)
            read -p "请输入备份文件路径: " backup_file
            if [ -f "$backup_file" ]; then
                cp "$backup_file" "$DB_PATH"
                log_success "数据库已恢复"
            else
                log_error "备份文件不存在"
            fi
            ;;
        4)
            read -p "确定要清空数据库吗？(y/N): " confirm
            if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
                rm -f "$DB_PATH"
                log_success "数据库已清空，重启服务后将重新初始化"
            fi
            ;;
        5)
            return
            ;;
        *)
            log_error "无效选择"
            ;;
    esac
}

# 环境配置
setup_env() {
    log_header "环境配置"
    
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            cp env.example .env
            log_success "已创建 .env 文件"
            log_info "请编辑 .env 文件配置环境变量"
        else
            log_warning "env.example 文件不存在"
        fi
    else
        log_info ".env 文件已存在"
    fi
    
    log_info "当前环境变量:"
    echo "NODE_ENV: ${NODE_ENV}"
    echo "PORT: ${PORT}"
    
    if [ -f ".env" ]; then
        log_info ".env 文件内容:"
        cat .env | grep -v "^#" | grep -v "^$"
    fi
}

# 显示帮助
show_help() {
    log_header "$PROJECT_NAME 管理脚本"
    
    echo "使用方法: ./manage.sh [命令]"
    echo ""
    echo "可用命令:"
    echo "  install     - 安装依赖"
    echo "  build       - 构建项目"
    echo "  dev         - 启动开发服务器"
    echo "  start       - 启动生产服务器"
    echo "  restart     - 重启服务"
    echo "  stop        - 停止服务"
    echo "  status      - 查看服务状态"
    echo "  logs        - 查看日志"
    echo "  test        - 运行测试"
    echo "  test-api    - API测试"
    echo "  database    - 数据库管理"
    echo "  env         - 环境配置"
    echo "  help        - 显示帮助"
    echo ""
    echo "示例:"
    echo "  ./manage.sh dev         # 启动开发服务器"
    echo "  ./manage.sh restart     # 重启生产服务"
    echo "  ./manage.sh status      # 查看服务状态"
}

# 交互式菜单
interactive_menu() {
    while true; do
        log_header "$PROJECT_NAME 管理菜单"
        
        echo "1.  安装依赖"
        echo "2.  构建项目"
        echo "3.  启动开发服务器"
        echo "4.  启动生产服务器"
        echo "5.  重启服务"
        echo "6.  停止服务"
        echo "7.  查看服务状态"
        echo "8.  查看日志"
        echo "9.  运行测试"
        echo "10. API测试"
        echo "11. 数据库管理"
        echo "12. 环境配置"
        echo "13. 退出"
        
        read -p "请选择操作 (1-13): " choice
        
        case $choice in
            1) install_deps ;;
            2) build_project ;;
            3) start_dev ;;
            4) start_prod ;;
            5) restart_service ;;
            6) stop_service ;;
            7) check_status ;;
            8) view_logs ;;
            9) run_tests ;;
            10) test_api ;;
            11) manage_database ;;
            12) setup_env ;;
            13) log_info "再见！"; exit 0 ;;
            *) log_error "无效选择，请重试" ;;
        esac
        
        echo ""
        read -p "按回车键继续..."
        clear
    done
}

# 主函数
main() {
    # 检查是否在正确的目录
    if [ ! -f "package.json" ]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 如果没有参数，显示交互式菜单
    if [ $# -eq 0 ]; then
        interactive_menu
        exit 0
    fi
    
    # 处理命令行参数
    case $1 in
        install)
            check_dependencies
            install_deps
            ;;
        build)
            check_dependencies
            build_project
            ;;
        dev)
            check_dependencies
            start_dev
            ;;
        start)
            check_dependencies
            start_prod
            ;;
        restart)
            check_dependencies
            restart_service
            ;;
        stop)
            stop_service
            ;;
        status)
            check_status
            ;;
        logs)
            view_logs
            ;;
        test)
            check_dependencies
            run_tests
            ;;
        test-api)
            test_api
            ;;
        database)
            manage_database
            ;;
        env)
            setup_env
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@" 