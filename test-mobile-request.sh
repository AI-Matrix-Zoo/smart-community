#!/bin/bash

echo "测试手机端API请求..."

# 测试健康检查
echo "1. 测试健康检查:"
curl -v -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" \
     -H "Origin: http://123.56.64.5" \
     http://123.56.64.5:3000/health

echo -e "\n\n2. 测试API健康检查:"
curl -v -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" \
     -H "Origin: http://123.56.64.5" \
     http://123.56.64.5:3000/api/health

echo -e "\n\n3. 测试CORS预检请求:"
curl -v -X OPTIONS \
     -H "Origin: http://123.56.64.5" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     http://123.56.64.5:3000/api/health

echo -e "\n\n4. 测试建议列表API:"
curl -v -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" \
     -H "Origin: http://123.56.64.5" \
     http://123.56.64.5:3000/api/suggestions 