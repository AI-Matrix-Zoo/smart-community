#!/bin/bash

echo "🔧 智慧小区生活平台 - 部署更新脚本"
echo "=================================="

# 检查前端构建
echo "📦 检查前端构建..."
cd frontend
if npm run build; then
    echo "✅ 前端构建成功"
else
    echo "❌ 前端构建失败"
    exit 1
fi

cd ..

# 检查后端编译
echo "📦 检查后端编译..."
cd backend
if npm run build; then
    echo "✅ 后端编译成功"
else
    echo "❌ 后端编译失败"
    exit 1
fi

cd ..

echo ""
echo "🚀 部署更新完成！"
echo "=================================="
echo "✅ 修复了以下问题："
echo "   - SPA路由刷新404问题（添加了_redirects文件）"
echo "   - 二手市场实时数据更新（30秒自动刷新 + 窗口焦点刷新）"
echo "   - 建议反馈实时数据更新（30秒自动刷新 + 窗口焦点刷新）"
echo "   - 添加了手动刷新按钮"
echo "   - 优化了缓存策略"
echo ""
echo "📋 部署到Render的步骤："
echo "1. 提交代码到Git仓库"
echo "2. 在Render控制台触发重新部署"
echo "3. 前端会自动应用新的路由规则"
echo "4. 用户刷新页面将不再出现404错误"
echo "5. 数据会自动实时更新" 