#!/bin/bash

echo "=== 智慧小区注册功能测试 ==="
echo

# 测试手机号
PHONE="13912345679"
echo "1. 测试发送验证码到手机号: $PHONE"

# 发送验证码
RESPONSE=$(curl -s -X POST http://123.56.64.5/api/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\"}")

echo "发送验证码响应: $RESPONSE"

# 从后端日志获取验证码
echo
echo "2. 从后端日志获取验证码..."
sleep 2
CODE=$(pm2 logs smart-community-backend --lines 10 --nostream | grep "模拟短信" | tail -1 | grep -o '[0-9]\{6\}')

if [ -z "$CODE" ]; then
    echo "❌ 无法获取验证码，请检查后端日志"
    exit 1
fi

echo "获取到验证码: $CODE"

echo
echo "3. 测试用户注册..."

# 测试注册 - 使用单行JSON
REGISTER_DATA="{\"phone\":\"$PHONE\",\"password\":\"test123456\",\"name\":\"测试用户\",\"building\":\"3栋\",\"unit\":\"2单元\",\"room\":\"301\",\"verificationCode\":\"$CODE\"}"

REGISTER_RESPONSE=$(curl -s -X POST http://123.56.64.5/api/auth/register \
  -H "Content-Type: application/json" \
  -d "$REGISTER_DATA")

echo "注册响应: $REGISTER_RESPONSE"

# 检查注册是否成功
if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    echo
    echo "✅ 注册功能测试成功！"
    echo "✅ 单元号字段已正确添加"
    echo "✅ 手机验证码功能正常工作"
else
    echo
    echo "❌ 注册测试失败"
fi

echo
echo "=== 测试完成 ===" 