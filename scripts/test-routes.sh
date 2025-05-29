#!/bin/bash

echo "🧪 测试 SPA 路由是否正常工作"
echo "================================"

BASE_URL="http://localhost:5173"
ROUTES=("/" "/market" "/suggestions" "/login" "/register" "/admin")

for route in "${ROUTES[@]}"; do
    echo -n "测试路由 $route ... "
    
    # 获取HTTP状态码
    status_code=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL$route")
    
    if [ "$status_code" = "200" ]; then
        echo "✅ 成功 (200)"
    else
        echo "❌ 失败 ($status_code)"
    fi
done

echo ""
echo "🔍 详细测试 /market 路由内容..."
response=$(curl -s "$BASE_URL/market")
if echo "$response" | grep -q "<!doctype html>"; then
    echo "✅ /market 返回正确的HTML页面"
else
    echo "❌ /market 返回内容异常"
fi

echo ""
echo "📋 测试总结："
echo "- 所有路由都应该返回200状态码"
echo "- 所有路由都应该返回相同的HTML页面(index.html)"
echo "- React Router会在客户端处理路由逻辑"
echo ""
echo "🌐 请在浏览器中测试："
echo "1. 访问 http://localhost:5173/market"
echo "2. 刷新页面，应该不会出现404错误"
echo "3. 直接在地址栏输入 http://localhost:5173/suggestions 并回车" 