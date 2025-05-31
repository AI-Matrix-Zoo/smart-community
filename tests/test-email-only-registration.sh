#!/bin/bash

# 测试邮箱注册功能
echo "🧪 测试邮箱注册功能..."

BASE_URL="http://localhost:3000"
TEST_EMAIL="test$(date +%s)@example.com"

echo "📧 测试邮箱: $TEST_EMAIL"

# 1. 发送验证码
echo "1️⃣ 发送邮箱验证码..."
SEND_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/send-verification-code" \
  -H "Content-Type: application/json" \
  -d "{
    \"identifier\": \"$TEST_EMAIL\",
    \"type\": \"email\"
  }")

echo "发送验证码响应: $SEND_RESPONSE"

# 提取验证码（开发环境会返回）
VERIFICATION_CODE=$(echo $SEND_RESPONSE | grep -o '"code":"[0-9]*"' | cut -d'"' -f4)

if [ -z "$VERIFICATION_CODE" ]; then
  echo "⚠️  开发环境未返回验证码，请查看后端日志获取验证码"
  echo "💡 运行: pm2 logs smart-community-backend --lines 5"
  echo "🔍 请输入6位验证码:"
  read -r VERIFICATION_CODE
  
  if [ -z "$VERIFICATION_CODE" ]; then
    echo "❌ 验证码不能为空"
    exit 1
  fi
fi

echo "✅ 验证码: $VERIFICATION_CODE"

# 2. 注册用户
echo "2️⃣ 注册新用户..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"password123\",
    \"name\": \"测试用户\",
    \"building\": \"1栋\",
    \"unit\": \"1单元\",
    \"room\": \"101\",
    \"verificationCode\": \"$VERIFICATION_CODE\",
    \"verificationType\": \"email\"
  }")

echo "注册响应: $REGISTER_RESPONSE"

# 检查注册是否成功
if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
  echo "✅ 注册成功！"
  
  # 提取token
  TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  echo "🔑 Token: ${TOKEN:0:20}..."
  
  # 3. 测试登录
  echo "3️⃣ 测试登录..."
  LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"identifier\": \"$TEST_EMAIL\",
      \"password\": \"password123\"
    }")
  
  echo "登录响应: $LOGIN_RESPONSE"
  
  if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "✅ 登录成功！"
    echo "🎉 邮箱注册功能测试通过！"
  else
    echo "❌ 登录失败"
    exit 1
  fi
else
  echo "❌ 注册失败"
  echo "响应详情: $REGISTER_RESPONSE"
  exit 1
fi

echo ""
echo "📊 测试总结:"
echo "- ✅ 邮箱验证码发送"
echo "- ✅ 邮箱注册"
echo "- ✅ 邮箱登录"
echo "- ✅ 所有功能正常" 