#!/bin/bash

echo "=== 智慧moma生活平台 - 移动端API测试 ==="
echo ""

echo "1. 测试健康检查API..."
curl -s -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" \
     -H "Accept: application/json" \
     http://123.56.64.5/api/health
echo ""
echo ""

echo "2. 测试市场数据API..."
curl -s -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" \
     -H "Accept: application/json" \
     http://123.56.64.5/api/market | head -500
echo ""
echo ""

echo "3. 测试公告数据API..."
curl -s -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" \
     -H "Accept: application/json" \
     http://123.56.64.5/api/announcements
echo ""
echo ""

echo "4. 测试CORS头部..."
curl -s -I -H "Origin: http://123.56.64.5" \
     -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" \
     http://123.56.64.5/api/market | grep -i "access-control"
echo ""

echo "=== 测试完成 ===" 