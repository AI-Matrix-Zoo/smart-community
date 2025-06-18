#!/bin/bash

# 智慧社区项目 - 数据库修复脚本
# 用于修复数据库表结构问题，确保所有必要的列都存在

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

log_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# 显示Logo
show_logo() {
    echo -e "${CYAN}"
    cat << "EOF"
  ____    _  _____  _    ____    _    ____  _____ 
 |  _ \  / \|_   _|/ \  | __ )  / \  / ___|| ____|
 | | | |/ _ \ | | / _ \ |  _ \ / _ \ \___ \|  _|  
 | |_| / ___ \| |/ ___ \| |_) / ___ \ ___) | |___ 
 |____/_/   \_\_/_/   \_\____/_/   \_\____/|_____|

EOF
    echo -e "${NC}"
    echo -e "${GREEN}智慧社区项目 - 数据库修复脚本${NC}"
    echo ""
}

# 检查数据库文件
check_database() {
    log_info "检查数据库文件..."
    
    if [ ! -f "backend/data/community.db" ]; then
        log_error "数据库文件不存在: backend/data/community.db"
        log_info "请先启动项目以创建数据库"
        exit 1
    fi
    
    log_success "数据库文件存在"
}

# 检查表结构
check_table_structure() {
    local table_name=$1
    local db_path="backend/data/community.db"
    
    log_info "检查表结构: $table_name"
    
    # 获取表结构
    local schema=$(sqlite3 "$db_path" ".schema $table_name" 2>/dev/null || echo "")
    
    if [ -z "$schema" ]; then
        log_error "表 $table_name 不存在"
        return 1
    fi
    
    echo "$schema"
    return 0
}

# 修复market_items表
fix_market_items_table() {
    local db_path="backend/data/community.db"
    
    log_header "修复 market_items 表"
    
    # 检查是否存在image_urls列
    local has_image_urls=$(sqlite3 "$db_path" "PRAGMA table_info(market_items);" | grep "image_urls" || echo "")
    
    if [ -z "$has_image_urls" ]; then
        log_warning "缺少 image_urls 列，正在添加..."
        sqlite3 "$db_path" "ALTER TABLE market_items ADD COLUMN image_urls TEXT;" 2>/dev/null || {
            log_error "添加 image_urls 列失败"
            return 1
        }
        log_success "已添加 image_urls 列"
    else
        log_success "image_urls 列已存在"
    fi
    
    # 检查其他可能缺少的列
    local has_contact_info=$(sqlite3 "$db_path" "PRAGMA table_info(market_items);" | grep "contact_info" || echo "")
    if [ -z "$has_contact_info" ]; then
        log_warning "缺少 contact_info 列，正在添加..."
        sqlite3 "$db_path" "ALTER TABLE market_items ADD COLUMN contact_info TEXT;" 2>/dev/null || {
            log_error "添加 contact_info 列失败"
            return 1
        }
        log_success "已添加 contact_info 列"
    else
        log_success "contact_info 列已存在"
    fi
}

# 修复其他表结构
fix_other_tables() {
    local db_path="backend/data/community.db"
    
    log_header "检查其他表结构"
    
    # 检查用户表的is_verified列
    local has_is_verified=$(sqlite3 "$db_path" "PRAGMA table_info(users);" | grep "is_verified" || echo "")
    if [ -z "$has_is_verified" ]; then
        log_warning "用户表缺少 is_verified 列，正在添加..."
        sqlite3 "$db_path" "ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0;" 2>/dev/null || {
            log_error "添加 is_verified 列失败"
            return 1
        }
        log_success "已添加 is_verified 列到用户表"
    else
        log_success "用户表 is_verified 列已存在"
    fi
}

# 验证修复结果
verify_fixes() {
    local db_path="backend/data/community.db"
    
    log_header "验证修复结果"
    
    # 验证market_items表
    log_info "验证 market_items 表结构..."
    local market_items_schema=$(sqlite3 "$db_path" ".schema market_items")
    
    if echo "$market_items_schema" | grep -q "image_urls"; then
        log_success "✅ market_items.image_urls 列存在"
    else
        log_error "❌ market_items.image_urls 列缺失"
    fi
    
    if echo "$market_items_schema" | grep -q "contact_info"; then
        log_success "✅ market_items.contact_info 列存在"
    else
        log_error "❌ market_items.contact_info 列缺失"
    fi
    
    # 验证users表
    log_info "验证 users 表结构..."
    local users_schema=$(sqlite3 "$db_path" ".schema users")
    
    if echo "$users_schema" | grep -q "is_verified"; then
        log_success "✅ users.is_verified 列存在"
    else
        log_error "❌ users.is_verified 列缺失"
    fi
}

# 备份数据库
backup_database() {
    local db_path="backend/data/community.db"
    local backup_path="backend/data/community.db.backup.$(date +%Y%m%d-%H%M%S)"
    
    log_info "备份数据库..."
    cp "$db_path" "$backup_path"
    log_success "数据库已备份到: $backup_path"
}

# 显示帮助信息
show_help() {
    echo -e "${CYAN}用法: $0 [选项]${NC}"
    echo ""
    echo -e "${YELLOW}选项:${NC}"
    echo -e "  ${GREEN}--check${NC}     仅检查数据库结构，不进行修复"
    echo -e "  ${GREEN}--fix${NC}       检查并修复数据库结构问题"
    echo -e "  ${GREEN}--backup${NC}    备份数据库文件"
    echo -e "  ${GREEN}--help${NC}      显示帮助信息"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo -e "  $0 --check      # 检查数据库结构"
    echo -e "  $0 --fix        # 修复数据库结构"
    echo -e "  $0 --backup     # 备份数据库"
    echo ""
}

# 主函数
main() {
    show_logo
    
    case "${1:-}" in
        "--check")
            check_database
            log_header "检查数据库结构"
            check_table_structure "market_items"
            echo ""
            check_table_structure "users"
            ;;
        "--fix")
            check_database
            backup_database
            fix_market_items_table
            fix_other_tables
            verify_fixes
            log_success "数据库修复完成！"
            ;;
        "--backup")
            check_database
            backup_database
            ;;
        "--help"|"-h"|"")
            show_help
            ;;
        *)
            log_error "未知选项: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@" 