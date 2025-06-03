#!/bin/bash

# 智慧moma生活平台 - 快速启动脚本
# 适合新手快速上手使用

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "🚀 智慧moma生活平台 - 快速启动"
echo "================================"
echo -e "${NC}"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js 18+${NC}"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js 版本: $(node --version)${NC}"

# 清理可能的后台进程
echo -e "${YELLOW}🧹 清理环境...${NC}"
./unified-manager.sh dev-stop 2>/dev/null || true

# 检查是否首次运行
if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 首次运行，正在安装依赖...${NC}"
    ./unified-manager.sh install
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
fi

# 检查是否已初始化
if [ ! -f "backend/.env.development" ]; then
    echo -e "${YELLOW}⚙️ 正在初始化配置...${NC}"
    ./unified-manager.sh init
    echo -e "${GREEN}✅ 配置初始化完成${NC}"
fi

echo -e "${BLUE}"
echo "🎯 启动开发环境..."
echo "前端地址: http://localhost:5174"
echo "后端地址: http://localhost:3001"
echo "按 Ctrl+C 停止服务"
echo "================================"
echo -e "${NC}"

# 启动开发环境（使用后台启动模式）
echo -e "${YELLOW}正在启动服务，请稍候...${NC}"

# 启动开发环境
./unified-manager.sh dev-start

# 等待服务完全启动
echo -e "${YELLOW}等待服务完全启动...${NC}"
sleep 5

# 检查服务状态
echo -e "${GREEN}检查服务状态...${NC}"
./unified-manager.sh status

echo -e "${GREEN}"
echo "✅ 服务启动完成！"
echo ""
echo "🌐 访问地址："
echo "  前端应用: http://localhost:5174"
echo "  后端API: http://localhost:3001/api"
echo "  健康检查: http://localhost:3001/health"
echo ""
echo "📋 演示账户："
echo "  业主: resident@example.com / password123"
echo "  物业: property@example.com / property123"
echo "  管理员: admin@example.com / admin123"
echo ""
echo "🛠️ 管理命令："
echo "  查看状态: ./unified-manager.sh status"
echo "  停止服务: ./unified-manager.sh dev-stop"
echo "  重启服务: ./unified-manager.sh dev-stop && ./unified-manager.sh dev-start"
echo -e "${NC}" 