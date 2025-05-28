#!/bin/bash

# 智慧小区生活平台 - 部署准备脚本
# 此脚本帮助检查和准备Render部署环境

set -e

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

# 检查命令是否存在
check_command() {
    if command -v $1 >/dev/null 2>&1; then
        log_success "$1 已安装"
        return 0
    else
        log_error "$1 未安装"
        return 1
    fi
}

# 检查文件是否存在
check_file() {
    if [ -f "$1" ]; then
        log_success "文件存在: $1"
        return 0
    else
        log_warning "文件不存在: $1"
        return 1
    fi
}

# 检查目录是否存在
check_directory() {
    if [ -d "$1" ]; then
        log_success "目录存在: $1"
        return 0
    else
        log_error "目录不存在: $1"
        return 1
    fi
}

echo "🚀 智慧小区生活平台 - Render部署准备检查"
echo "=============================================="

# 1. 检查基本环境
log_info "检查基本环境..."
check_command "node" || exit 1
check_command "npm" || exit 1
check_command "git" || exit 1

# 2. 检查项目结构
log_info "检查项目结构..."
check_directory "backend" || exit 1
check_directory "frontend" || exit 1
check_file "backend/package.json" || exit 1
check_file "frontend/package.json" || exit 1

# 3. 检查配置文件
log_info "检查配置文件..."
check_file "render.yaml" || log_warning "后端render.yaml不存在，将使用手动配置"
check_file "frontend/render.yaml" || log_warning "前端render.yaml不存在，将使用手动配置"

# 4. 检查后端配置
log_info "检查后端配置..."
if [ -f "backend/package.json" ]; then
    # 检查构建脚本
    if grep -q '"build"' backend/package.json; then
        log_success "后端构建脚本存在"
    else
        log_error "后端缺少构建脚本"
        exit 1
    fi
    
    # 检查启动脚本
    if grep -q '"start"' backend/package.json; then
        log_success "后端启动脚本存在"
    else
        log_error "后端缺少启动脚本"
        exit 1
    fi
fi

# 5. 检查前端配置
log_info "检查前端配置..."
if [ -f "frontend/package.json" ]; then
    # 检查构建脚本
    if grep -q '"build"' frontend/package.json; then
        log_success "前端构建脚本存在"
    else
        log_error "前端缺少构建脚本"
        exit 1
    fi
fi

# 6. 测试本地构建
log_info "测试本地构建..."

# 测试后端构建
log_info "测试后端构建..."
cd backend
if npm install && npm run build; then
    log_success "后端构建成功"
else
    log_error "后端构建失败"
    exit 1
fi
cd ..

# 测试前端构建
log_info "测试前端构建..."
cd frontend
if npm install && npm run build; then
    log_success "前端构建成功"
else
    log_error "前端构建失败"
    exit 1
fi
cd ..

# 7. 检查Git状态
log_info "检查Git状态..."
if git status >/dev/null 2>&1; then
    log_success "Git仓库已初始化"
    
    # 检查是否有未提交的更改
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "有未提交的更改，建议先提交代码"
        git status --short
    else
        log_success "工作目录干净"
    fi
    
    # 检查远程仓库
    if git remote -v | grep -q origin; then
        log_success "远程仓库已配置"
        git remote -v
    else
        log_warning "未配置远程仓库，部署前需要推送到Git托管平台"
    fi
else
    log_error "不是Git仓库，请先初始化Git"
    exit 1
fi

# 8. 生成部署清单
log_info "生成部署清单..."
cat > DEPLOY_CHECKLIST.md << EOF
# 部署清单

## ✅ 准备工作完成
- [x] 项目结构检查通过
- [x] 本地构建测试通过
- [x] Git仓库状态正常

## 📋 部署步骤

### 1. 推送代码到Git仓库
\`\`\`bash
git add .
git commit -m "准备部署到Render"
git push origin main
\`\`\`

### 2. 在Render创建后端服务
- 服务类型: Web Service
- 名称: smart-community-backend
- 环境: Node
- 构建命令: \`cd backend && npm install && npm run build\`
- 启动命令: \`cd backend && npm start\`
- 健康检查: \`/api/health\`

### 3. 配置后端环境变量
\`\`\`
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=https://smart-community-frontend.onrender.com
\`\`\`

### 4. 在Render创建前端服务
- 服务类型: Static Site
- 名称: smart-community-frontend
- 构建命令: \`cd frontend && npm install && npm run build\`
- 发布目录: \`frontend/dist\`

### 5. 配置前端环境变量
\`\`\`
VITE_API_BASE_URL=https://smart-community-backend.onrender.com
VITE_APP_TITLE=智慧小区生活平台
VITE_NODE_ENV=production
\`\`\`

### 6. 验证部署
- [ ] 后端健康检查通过
- [ ] 前端页面正常加载
- [ ] 用户注册登录功能正常
- [ ] API调用正常

## 📞 需要帮助？
查看详细部署指南: DEPLOYMENT_GUIDE.md
EOF

log_success "部署清单已生成: DEPLOY_CHECKLIST.md"

# 9. 显示总结
echo ""
echo "🎉 部署准备检查完成！"
echo "=============================================="
log_success "所有检查都通过了，项目已准备好部署到Render"
echo ""
echo "📋 下一步操作："
echo "1. 查看部署清单: cat DEPLOY_CHECKLIST.md"
echo "2. 阅读详细指南: cat DEPLOYMENT_GUIDE.md"
echo "3. 推送代码到Git仓库"
echo "4. 在Render控制台创建服务"
echo ""
echo "🌐 部署后的访问地址："
echo "- 前端: https://smart-community-frontend.onrender.com"
echo "- 后端: https://smart-community-backend.onrender.com"
echo ""
log_info "祝你部署顺利！🚀" 