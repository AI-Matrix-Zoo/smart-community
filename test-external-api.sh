#!/bin/bash

# 测试外部API访问脚本

SERVER_IP="123.56.64.5"
BACKEND_PORT="3000"
FRONTEND_PORT="5173"

echo "=== 智慧社区外部访问测试 ==="
echo ""

echo "1. 测试后端健康检查..."
curl -s "http://${SERVER_IP}:${BACKEND_PORT}/health" | jq . 2>/dev/null || curl -s "http://${SERVER_IP}:${BACKEND_PORT}/health"
echo ""

echo "2. 测试API健康检查..."
curl -s "http://${SERVER_IP}:${BACKEND_PORT}/api/health" | jq . 2>/dev/null || curl -s "http://${SERVER_IP}:${BACKEND_PORT}/api/health"
echo ""

echo "3. 测试市场物品API..."
curl -s "http://${SERVER_IP}:${BACKEND_PORT}/api/market" | jq . 2>/dev/null || curl -s "http://${SERVER_IP}:${BACKEND_PORT}/api/market"
echo ""

echo "4. 测试公告API..."
curl -s "http://${SERVER_IP}:${BACKEND_PORT}/api/announcements" | jq . 2>/dev/null || curl -s "http://${SERVER_IP}:${BACKEND_PORT}/api/announcements"
echo ""

echo "5. 测试前端页面..."
if curl -s "http://${SERVER_IP}:${FRONTEND_PORT}" | grep -q "智慧"; then
    echo "✅ 前端页面可访问"
else
    echo "❌ 前端页面访问失败"
fi
echo ""

echo "6. 测试CORS..."
curl -s -H "Origin: http://example.com" "http://${SERVER_IP}:${BACKEND_PORT}/api/health" | jq . 2>/dev/null || curl -s -H "Origin: http://example.com" "http://${SERVER_IP}:${BACKEND_PORT}/api/health"
echo ""

echo "=== 访问地址 ==="
echo "前端应用: http://${SERVER_IP}:${FRONTEND_PORT}"
echo "后端API: http://${SERVER_IP}:${BACKEND_PORT}/api"
echo "健康检查: http://${SERVER_IP}:${BACKEND_PORT}/health"
echo "" 