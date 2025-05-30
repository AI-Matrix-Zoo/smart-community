#!/bin/bash

# 前端部署脚本
# 用于构建和部署前端到Render

set -e  # 遇到错误时退出

echo "🚀 开始前端部署流程..."

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "📁 项目根目录: $PROJECT_ROOT"

# 进入前端目录
cd "$PROJECT_ROOT/frontend"

echo "📦 安装依赖..."
npm install

echo "🔧 设置环境变量..."
export VITE_API_BASE_URL=https://smart-community-backend.onrender.com/api

echo "🏗️  构建前端项目..."
npm run build

echo "✅ 验证构建结果..."
if [ -d "dist" ]; then
    echo "✓ dist目录已创建"
    
    # 检查API地址是否正确
    if grep -q "smart-community-backend.onrender.com/api" dist/assets/index-*.js; then
        echo "✓ API地址配置正确"
    else
        echo "❌ API地址配置错误"
        exit 1
    fi
    
    # 检查SPA路由配置
    if [ -f "dist/_redirects" ]; then
        echo "✓ _redirects文件存在"
        
        # 检查_redirects内容
        if grep -q "/*  /index.html  200" dist/_redirects; then
            echo "✓ SPA路由重定向配置正确"
        else
            echo "❌ SPA路由重定向配置错误"
            exit 1
        fi
    else
        echo "❌ _redirects文件缺失"
        exit 1
    fi
    
    # 检查关键文件
    if [ -f "dist/index.html" ]; then
        echo "✓ index.html存在"
    else
        echo "❌ index.html缺失"
        exit 1
    fi
    
    echo "📊 构建统计:"
    echo "   - HTML文件: $(find dist -name "*.html" | wc -l)"
    echo "   - CSS文件: $(find dist -name "*.css" | wc -l)"
    echo "   - JS文件: $(find dist -name "*.js" | wc -l)"
    echo "   - 总文件数: $(find dist -type f | wc -l)"
    echo "   - 总大小: $(du -sh dist | cut -f1)"
    
else
    echo "❌ 构建失败，dist目录不存在"
    exit 1
fi

echo ""
echo "🎉 前端构建完成！"
echo ""
echo "📋 部署说明:"
echo "1. 将 frontend/dist 目录的内容部署到Render"
echo "2. 确保Render配置中包含以下环境变量:"
echo "   VITE_API_BASE_URL=https://smart-community-backend.onrender.com/api"
echo "3. 确保SPA路由重定向配置正确（_redirects文件）"
echo "4. 移除render.yaml中的routes配置以避免冲突"
echo ""
echo "🔗 相关文件:"
echo "   - 部署配置: frontend/render.yaml"
echo "   - API服务: frontend/src/services/apiService.ts"
echo "   - 路由重定向: frontend/public/_redirects"
echo "   - SPA路由修复: docs/SPA_ROUTING_FIX.md"
echo ""
echo "✨ 部署完成后，前端应该能够："
echo "   - 正确连接到后端API"
echo "   - 所有页面刷新正常工作"
echo "   - 直接访问任何路径都不会出现404" 