#!/bin/bash

# 智慧小区生活平台 - Render部署脚本
# 版本: 1.0.0

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="智慧小区生活平台"
VERSION="1.0.0"

# 显示标题
show_header() {
    echo -e "${BLUE}"
    cat << "EOF"
  ____  ____  _   _ ____  _____ ____  
 |  _ \| ___|| \ | |  _ \| ____|  _ \ 
 | |_) |___ \|  \| | | | |  _| | |_) |
 |  _ < ___) | |\  | |_| | |___|  _ < 
 |_| \_\____/|_| \_|____/|_____|_| \_\

EOF
    echo -e "${NC}"
    echo -e "${GREEN}${PROJECT_NAME} Render部署脚本 v${VERSION}${NC}"
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
    echo -e "${YELLOW}================================${NC}"
    echo -e "${YELLOW}  $1${NC}"
    echo -e "${YELLOW}================================${NC}"
}

# 检查依赖
check_dependencies() {
    log_header "检查部署依赖"
    
    # 检查Git
    if ! command -v git &> /dev/null; then
        log_error "Git 未安装，请先安装 Git"
        exit 1
    fi
    log_success "Git: $(git --version)"
    
    # 检查curl
    if ! command -v curl &> /dev/null; then
        log_error "curl 未安装，请先安装 curl"
        exit 1
    fi
    log_success "curl: 已安装"
    
    # 检查是否在Git仓库中
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "当前目录不是Git仓库"
        exit 1
    fi
    log_success "Git仓库: 已确认"
}

# 检查项目结构
check_project_structure() {
    log_header "检查项目结构"
    
    # 检查必要目录
    if [ ! -d "backend" ]; then
        log_error "backend 目录不存在"
        exit 1
    fi
    log_success "backend 目录: 存在"
    
    if [ ! -d "frontend" ]; then
        log_error "frontend 目录不存在"
        exit 1
    fi
    log_success "frontend 目录: 存在"
    
    # 检查package.json文件
    if [ ! -f "backend/package.json" ]; then
        log_error "backend/package.json 不存在"
        exit 1
    fi
    log_success "backend/package.json: 存在"
    
    if [ ! -f "frontend/package.json" ]; then
        log_error "frontend/package.json 不存在"
        exit 1
    fi
    log_success "frontend/package.json: 存在"
}

# 准备部署文件
prepare_deployment() {
    log_header "准备部署文件"
    
    # 创建前端生产环境配置
    log_info "创建前端生产环境配置..."
    cat > frontend/.env.production << EOF
# 生产环境配置
VITE_APP_ENV=production
VITE_API_BASE_URL=https://smart-community-backend.onrender.com/api
VITE_APP_NAME=智慧小区生活平台
EOF
    log_success "前端生产环境配置已创建"
    
    # 创建SPA重定向文件
    log_info "创建SPA重定向配置..."
    mkdir -p frontend/public
    echo "/*    /index.html   200" > frontend/public/_redirects
    log_success "SPA重定向配置已创建"
    
    # 检查后端环境配置
    if [ ! -f "backend/.env" ]; then
        log_warning "backend/.env 不存在，将创建示例配置"
        cat > backend/.env << EOF
# 生产环境配置
NODE_ENV=production
PORT=3000

# JWT配置
JWT_SECRET=smart-community-super-secret-jwt-key-2024-production
JWT_EXPIRES_IN=7d

# 数据库配置
DATABASE_PATH=./data/smart-community.db

# CORS配置
FRONTEND_URL=https://smart-community-frontend.onrender.com

# 邮箱服务配置
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@qq.com
EMAIL_PASS=your-email-password
EMAIL_FROM=your-email@qq.com
EMAIL_ENABLED=true

# 短信服务配置
SMS_ENABLED=false

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# 日志级别
LOG_LEVEL=info
EOF
        log_warning "请编辑 backend/.env 文件，配置正确的邮箱和其他服务参数"
    else
        log_success "backend/.env 已存在"
    fi
}

# 检查Git状态
check_git_status() {
    log_header "检查Git状态"
    
    # 检查是否有未提交的更改
    if ! git diff-index --quiet HEAD --; then
        log_warning "检测到未提交的更改"
        echo "未提交的文件:"
        git status --porcelain
        echo ""
        read -p "是否要提交这些更改？(y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            read -p "请输入提交信息: " commit_message
            git commit -m "$commit_message"
            log_success "更改已提交"
        else
            log_warning "跳过提交，继续部署"
        fi
    else
        log_success "工作目录干净，无未提交更改"
    fi
    
    # 检查远程仓库
    if ! git remote get-url origin > /dev/null 2>&1; then
        log_error "未配置远程仓库，请先添加远程仓库"
        echo "示例: git remote add origin https://github.com/username/repository.git"
        exit 1
    fi
    
    REMOTE_URL=$(git remote get-url origin)
    log_success "远程仓库: $REMOTE_URL"
}

# 推送到GitHub
push_to_github() {
    log_header "推送到GitHub"
    
    log_info "推送代码到远程仓库..."
    if git push origin main; then
        log_success "代码推送成功"
    else
        log_error "代码推送失败"
        exit 1
    fi
}

# 显示部署指南
show_deployment_guide() {
    log_header "Render部署指南"
    
    echo -e "${YELLOW}请按照以下步骤在Render.com上部署您的应用：${NC}"
    echo ""
    
    echo -e "${BLUE}1. 部署后端服务${NC}"
    echo "   • 访问 https://render.com 并登录"
    echo "   • 点击 'New +' → 'Web Service'"
    echo "   • 连接GitHub并选择您的仓库"
    echo "   • 配置设置："
    echo "     - Name: smart-community-backend"
    echo "     - Region: Singapore"
    echo "     - Branch: main"
    echo "     - Root Directory: backend"
    echo "     - Build Command: npm install && npm run build"
    echo "     - Start Command: npm start"
    echo ""
    
    echo -e "${BLUE}2. 配置后端环境变量${NC}"
    echo "   在Render Dashboard的Environment页面添加以下变量："
    echo "   • NODE_ENV=production"
    echo "   • PORT=3000"
    echo "   • JWT_SECRET=your-secret-key"
    echo "   • EMAIL_HOST=smtp.qq.com"
    echo "   • EMAIL_USER=your-email@qq.com"
    echo "   • EMAIL_PASS=your-email-password"
    echo "   • EMAIL_FROM=your-email@qq.com"
    echo "   • EMAIL_ENABLED=true"
    echo "   • 其他必要的环境变量..."
    echo ""
    
    echo -e "${BLUE}3. 部署前端服务${NC}"
    echo "   • 在Render Dashboard点击 'New +' → 'Static Site'"
    echo "   • 选择同一个GitHub仓库"
    echo "   • 配置设置："
    echo "     - Name: smart-community-frontend"
    echo "     - Branch: main"
    echo "     - Root Directory: frontend"
    echo "     - Build Command: npm install && npm run build"
    echo "     - Publish Directory: dist"
    echo ""
    
    echo -e "${BLUE}4. 更新CORS配置${NC}"
    echo "   • 获取前端服务的URL"
    echo "   • 在后端服务的环境变量中更新 FRONTEND_URL"
    echo "   • 重新部署后端服务"
    echo ""
    
    echo -e "${GREEN}5. 测试部署${NC}"
    echo "   • 访问前端URL测试页面加载"
    echo "   • 测试API连接和功能"
    echo "   • 验证邮箱验证码发送"
    echo ""
}

# 显示有用的链接
show_useful_links() {
    log_header "有用的链接"
    
    echo "📚 文档和资源:"
    echo "   • Render官方文档: https://render.com/docs"
    echo "   • 部署指南: docs/线上部署指南.md"
    echo "   • 邮箱配置: docs/邮箱验证码问题诊断.md"
    echo ""
    
    echo "🔧 部署后的URL格式:"
    echo "   • 后端: https://smart-community-backend.onrender.com"
    echo "   • 前端: https://smart-community-frontend.onrender.com"
    echo "   • API健康检查: https://smart-community-backend.onrender.com/health"
    echo ""
    
    echo "⚠️  重要提醒:"
    echo "   • 首次部署可能需要5-10分钟"
    echo "   • 免费服务15分钟无活动后会休眠"
    echo "   • 请妥善保管环境变量中的敏感信息"
    echo "   • 定期检查和更新依赖包"
}

# 主函数
main() {
    show_header
    
    # 检查依赖和项目结构
    check_dependencies
    check_project_structure
    
    # 准备部署文件
    prepare_deployment
    
    # 检查Git状态并推送
    check_git_status
    push_to_github
    
    # 显示部署指南
    show_deployment_guide
    show_useful_links
    
    log_success "部署准备完成！"
    echo ""
    echo -e "${GREEN}🎉 您的代码已推送到GitHub，现在可以在Render.com上进行部署了！${NC}"
    echo -e "${YELLOW}📖 详细的部署步骤请参考: docs/线上部署指南.md${NC}"
}

# 运行主函数
main "$@" 