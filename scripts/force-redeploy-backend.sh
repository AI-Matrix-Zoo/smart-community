#!/bin/bash

# 强制重新部署后端服务脚本
# 用于解决CORS缓存问题

echo "🔄 强制重新部署后端服务..."

# 检查是否在项目根目录
if [ ! -d "backend" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 进入后端目录
cd backend

# 添加时间戳到README以触发重新部署
echo "" >> README.md
echo "# Force redeploy $(date)" >> README.md

# 提交更改
git add README.md
git commit -m "Force redeploy to fix CORS issue - $(date)"

echo "✅ 已提交强制重新部署的更改"
echo "📤 正在推送到远程仓库..."

# 推送到远程仓库
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ 推送成功！"
    echo "🚀 Render将自动检测更改并重新部署后端服务"
    echo "⏱️  预计需要5-10分钟完成部署"
    echo ""
    echo "📊 可以通过以下方式监控部署状态："
    echo "   1. 访问 Render Dashboard"
    echo "   2. 查看后端服务的部署日志"
    echo "   3. 测试健康检查端点："
    echo "      curl https://smart-community-backend.onrender.com/health"
    echo ""
    echo "🧪 部署完成后，可以测试CORS："
    echo "   curl -H \"Origin: https://smart-community-frontend.onrender.com\" \\"
    echo "        https://smart-community-backend.onrender.com/api/cors-test"
else
    echo "❌ 推送失败，请检查Git配置和网络连接"
    exit 1
fi 