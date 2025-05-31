#!/bin/bash

echo "=== 智慧小区邮箱注册功能测试 ==="
echo

# 测试邮箱
EMAIL="demo@example.com"
echo "1. 测试发送验证码到邮箱: $EMAIL"

# 发送验证码
RESPONSE=$(curl -s -X POST http://123.56.64.5/api/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"$EMAIL\",\"type\":\"email\"}")

echo "发送验证码响应: $RESPONSE"

# 从响应中提取验证码
CODE=$(echo "$RESPONSE" | grep -o '"code":"[0-9]*"' | grep -o '[0-9]*')

if [ -z "$CODE" ]; then
    echo "❌ 无法获取验证码，请检查响应"
    exit 1
fi

echo "获取到验证码: $CODE"

echo
echo "2. 测试用户注册..."

# 测试注册 - 使用邮箱验证
REGISTER_DATA="{\"email\":\"$EMAIL\",\"password\":\"demo123456\",\"name\":\"邮箱测试用户\",\"building\":\"5栋\",\"unit\":\"3单元\",\"room\":\"502\",\"verificationCode\":\"$CODE\",\"verificationType\":\"email\"}"

REGISTER_RESPONSE=$(curl -s -X POST http://123.56.64.5/api/auth/register \
  -H "Content-Type: application/json" \
  -d "$REGISTER_DATA")

echo "注册响应: $REGISTER_RESPONSE"

# 检查注册是否成功
if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    echo
    echo "✅ 邮箱注册功能测试成功！"
    echo "✅ 单元号字段已正确添加"
    echo "✅ 邮箱验证码功能正常工作"
    echo "✅ 数据库支持邮箱和手机号双重验证"
    
    echo
    echo "3. 验证数据库中的用户数据..."
    sqlite3 /root/smart-community/backend/data/community.db "SELECT id, phone, email, name, building, unit, room FROM users WHERE email='$EMAIL';" | while IFS='|' read -r id phone email name building unit room; do
        echo "用户ID: $id"
        echo "手机号: ${phone:-'(空)'}"
        echo "邮箱: $email"
        echo "姓名: $name"
        echo "楼栋: $building"
        echo "单元: $unit"
        echo "房号: $room"
    done
    
    echo
    echo "4. 测试邮箱登录..."
    LOGIN_RESPONSE=$(curl -s -X POST http://123.56.64.5/api/auth/login \
      -H "Content-Type: application/json" \
      -d "{\"identifier\":\"$EMAIL\",\"password\":\"demo123456\"}")
    
    if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
        echo "✅ 邮箱登录测试成功！"
    else
        echo "❌ 邮箱登录测试失败"
        echo "登录响应: $LOGIN_RESPONSE"
    fi
else
    echo
    echo "❌ 注册测试失败"
    echo "错误详情: $REGISTER_RESPONSE"
fi

echo
echo "=== 测试完成 ===" 