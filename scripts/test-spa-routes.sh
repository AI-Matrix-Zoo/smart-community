#!/bin/bash

# SPA路由测试脚本
# 用于测试所有前端路由是否正常工作

set -e

echo "🧪 开始SPA路由测试..."

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "📁 项目根目录: $PROJECT_ROOT"

# 进入前端目录
cd "$PROJECT_ROOT/frontend"

# 检查是否已构建
if [ ! -d "dist" ]; then
    echo "📦 dist目录不存在，开始构建..."
    npm run build
fi

echo "🔍 检查关键文件..."

# 检查_redirects文件
if [ -f "dist/_redirects" ]; then
    echo "✓ _redirects文件存在"
    echo "📄 _redirects内容:"
    cat dist/_redirects
    echo ""
else
    echo "❌ _redirects文件缺失"
    exit 1
fi

# 检查index.html
if [ -f "dist/index.html" ]; then
    echo "✓ index.html存在"
else
    echo "❌ index.html缺失"
    exit 1
fi

# 启动预览服务器进行测试
echo "🚀 启动预览服务器..."
echo "📝 测试说明:"
echo "   1. 服务器启动后，请在浏览器中测试以下路径:"
echo "      - http://localhost:4173/"
echo "      - http://localhost:4173/login"
echo "      - http://localhost:4173/register"
echo "      - http://localhost:4173/suggestions"
echo "      - http://localhost:4173/market"
echo "      - http://localhost:4173/admin"
echo ""
echo "   2. 在每个页面刷新浏览器，确保不出现404错误"
echo "   3. 按 Ctrl+C 停止测试服务器"
echo ""

# 启动预览服务器
npm run preview 