#!/bin/bash

# 智慧小区前端重新部署脚本
# 用于解决SPA路由404问题

echo "🚀 开始重新部署前端..."

# 检查是否在正确的目录
if [ ! -f "frontend/render.yaml" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 进入前端目录
cd frontend

echo "📦 安装依赖..."
npm install

echo "🔨 构建项目..."
npm run build

echo "📋 检查构建产物..."
if [ ! -d "dist" ]; then
    echo "❌ 构建失败：dist目录不存在"
    exit 1
fi

# 检查_redirects文件是否正确复制到dist目录
if [ ! -f "dist/_redirects" ]; then
    echo "⚠️  警告：_redirects文件未找到，正在复制..."
    cp public/_redirects dist/
fi

echo "✅ 前端构建完成！"
echo ""
echo "📝 部署说明："
echo "1. render.yaml已更新，包含SPA路由重定向配置"
echo "2. _redirects文件已确保存在于dist目录"
echo "3. 请在Render.com控制台手动触发重新部署"
echo ""
echo "🔗 Render.com部署步骤："
echo "1. 访问 https://dashboard.render.com"
echo "2. 找到 smart-community-frontend 服务"
echo "3. 点击 'Manual Deploy' -> 'Deploy latest commit'"
echo ""
echo "🎯 修复内容："
echo "- 添加了SPA路由重定向规则"
echo "- 确保所有非静态资源路径重定向到index.html"
echo "- 修复了刷新建议页面(/suggestions)时的404错误"
echo ""
echo "⏰ 部署完成后，请等待2-3分钟让CDN缓存更新"
echo "然后测试访问: https://smart-community-frontend.onrender.com/suggestions" 