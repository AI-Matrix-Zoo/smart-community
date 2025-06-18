#!/bin/bash

# 智慧社区外部访问状态检查脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVER_IP="123.56.64.5"

echo -e "${BLUE}=== 智慧社区外部访问状态检查 ===${NC}"
echo ""

# 检查后端进程
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${GREEN}✅ 后端服务运行中${NC} (PID: $BACKEND_PID)"
    else
        echo -e "${RED}❌ 后端服务未运行${NC} (PID文件存在但进程不存在)"
    fi
else
    echo -e "${RED}❌ 后端服务未运行${NC} (无PID文件)"
fi

# 检查前端进程
if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${GREEN}✅ 前端服务运行中${NC} (PID: $FRONTEND_PID)"
    else
        echo -e "${RED}❌ 前端服务未运行${NC} (PID文件存在但进程不存在)"
    fi
else
    echo -e "${RED}❌ 前端服务未运行${NC} (无PID文件)"
fi

echo ""

# 检查端口占用
echo -e "${BLUE}端口占用情况:${NC}"
if lsof -Pi :3000 -sTCP:LISTEN >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 端口 3000 (后端)${NC} - $(lsof -Pi :3000 -sTCP:LISTEN | tail -1 | awk '{print $1, $2}')"
else
    echo -e "${RED}❌ 端口 3000 (后端) 未被占用${NC}"
fi

if lsof -Pi :5173 -sTCP:LISTEN >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 端口 5173 (前端)${NC} - $(lsof -Pi :5173 -sTCP:LISTEN | tail -1 | awk '{print $1, $2}')"
else
    echo -e "${RED}❌ 端口 5173 (前端) 未被占用${NC}"
fi

echo ""

# 检查服务响应
echo -e "${BLUE}服务响应检查:${NC}"

# 后端健康检查
if curl -s --connect-timeout 5 "http://localhost:3000/health" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端健康检查${NC} - http://localhost:3000/health"
else
    echo -e "${RED}❌ 后端健康检查失败${NC}"
fi

# 前端页面检查
if curl -s --connect-timeout 5 "http://localhost:5173" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 前端页面响应${NC} - http://localhost:5173"
else
    echo -e "${RED}❌ 前端页面响应失败${NC}"
fi

# 外部访问检查
if curl -s --connect-timeout 5 "http://${SERVER_IP}:3000/health" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 外部后端访问${NC} - http://${SERVER_IP}:3000"
else
    echo -e "${RED}❌ 外部后端访问失败${NC}"
fi

if curl -s --connect-timeout 5 "http://${SERVER_IP}:5173" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 外部前端访问${NC} - http://${SERVER_IP}:5173"
else
    echo -e "${RED}❌ 外部前端访问失败${NC}"
fi

echo ""
echo -e "${BLUE}=== 访问地址 ===${NC}"
echo -e "📱 移动端访问: ${YELLOW}http://${SERVER_IP}:5173${NC}"
echo -e "🖥️  电脑端访问: ${YELLOW}http://localhost:5173${NC}"
echo -e "🔗 后端API: ${YELLOW}http://${SERVER_IP}:3000/api${NC}"
echo -e "💚 健康检查: ${YELLOW}http://${SERVER_IP}:3000/health${NC}"
echo "" 