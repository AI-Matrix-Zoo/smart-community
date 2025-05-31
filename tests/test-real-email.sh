#!/bin/bash

echo "=== 智慧小区真实邮箱验证码测试 ==="
echo

# 检查是否提供了邮箱参数
if [ -z "$1" ]; then
    echo "使用方法: $0 <your-email@example.com>"
    echo "示例: $0 your-email@qq.com"
    echo
    echo "注意：需要先配置真实邮箱服务："
    echo "1. 复制 backend/email-config-example.env 为 backend/.env"
    echo "2. 填入真实的邮箱配置信息"
    echo "3. 重启后端服务"
    exit 1
fi

EMAIL="$1"
echo "测试邮箱: $EMAIL"
echo

echo "1. 发送验证码到真实邮箱..."
RESPONSE=$(curl -s -X POST http://123.56.64.5/api/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"$EMAIL\",\"type\":\"email\"}")

echo "响应: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ 验证码发送成功！"
    echo
    echo "请检查您的邮箱收件箱，您应该会收到一封包含验证码的邮件。"
    echo "邮件特性："
    echo "  📧 发件人: 智慧小区"
    echo "  📋 主题: 智慧小区 - 邮箱验证码"
    echo "  🎨 美观的HTML格式"
    echo "  🔐 6位数字验证码"
    echo "  ⏰ 5分钟有效期"
    echo
    echo "收到验证码后，您可以使用以下命令测试注册："
    echo "curl -X POST http://123.56.64.5/api/auth/register \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -d '{\"email\":\"$EMAIL\",\"password\":\"test123456\",\"name\":\"真实邮箱用户\",\"building\":\"测试楼\",\"unit\":\"测试单元\",\"room\":\"测试房间\",\"verificationCode\":\"您收到的验证码\",\"verificationType\":\"email\"}'"
else
    echo "❌ 验证码发送失败"
    echo "可能的原因："
    echo "1. 邮箱服务未正确配置"
    echo "2. 网络连接问题"
    echo "3. 邮箱服务商限制"
    echo
    echo "请检查后端日志："
    echo "pm2 logs smart-community-backend"
fi

echo
echo "=== 测试完成 ===" 