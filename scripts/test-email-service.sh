#!/bin/bash

echo "📧 智慧小区邮箱服务测试"
echo "========================"
echo

# 检查后端服务状态
echo "🔍 检查后端服务状态..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ 后端服务运行正常 (端口3001)"
else
    echo "❌ 后端服务未运行，请先启动服务"
    echo "   运行: ./unified-manager.sh dev-start"
    exit 1
fi

echo

# 检查邮箱配置
echo "🔍 检查邮箱服务配置..."
if [ -f "backend/.env" ]; then
    if grep -q "EMAIL_ENABLED=true" backend/.env; then
        EMAIL_USER=$(grep "EMAIL_USER=" backend/.env | cut -d'=' -f2)
        EMAIL_HOST=$(grep "EMAIL_HOST=" backend/.env | cut -d'=' -f2)
        echo "✅ 真实邮箱服务已启用"
        echo "   📧 邮箱: $EMAIL_USER"
        echo "   🌐 SMTP: $EMAIL_HOST"
        REAL_EMAIL=true
    else
        echo "⚠️  当前使用模拟邮箱服务"
        echo "   💡 验证码将在后端控制台显示"
        REAL_EMAIL=false
    fi
else
    echo "❌ 未找到配置文件 backend/.env"
    echo "   请运行: ./scripts/setup-email-service.sh"
    exit 1
fi

echo

# 获取测试邮箱
if [ "$REAL_EMAIL" = true ]; then
    read -p "请输入要测试的邮箱地址: " TEST_EMAIL
    if [ -z "$TEST_EMAIL" ]; then
        echo "❌ 邮箱地址不能为空"
        exit 1
    fi
else
    TEST_EMAIL="test@example.com"
    echo "📧 使用测试邮箱: $TEST_EMAIL"
fi

echo

# 测试发送验证码
echo "📤 发送验证码到: $TEST_EMAIL"
RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"$TEST_EMAIL\",\"type\":\"email\"}")

echo "📋 服务器响应:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

# 检查响应结果
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo
    echo "✅ 验证码发送成功！"
    
    if [ "$REAL_EMAIL" = true ]; then
        echo
        echo "📬 请检查您的邮箱收件箱："
        echo "   📧 发件人: 智慧小区"
        echo "   📋 主题: 智慧小区 - 邮箱验证码"
        echo "   🎨 美观的HTML格式邮件"
        echo "   🔐 6位数字验证码"
        echo "   ⏰ 5分钟有效期"
        echo
        echo "💡 如果没有收到邮件，请检查："
        echo "   1. 垃圾邮件文件夹"
        echo "   2. 邮箱地址是否正确"
        echo "   3. 邮箱服务商是否有延迟"
    else
        echo
        echo "💡 模拟模式下，验证码会显示在后端控制台"
        echo "   查看方法: 在另一个终端运行后端服务并观察输出"
        
        # 尝试从响应中提取验证码（开发环境可能返回）
        CODE=$(echo "$RESPONSE" | grep -o '"code":"[0-9]*"' | cut -d'"' -f4)
        if [ ! -z "$CODE" ]; then
            echo "   🔐 验证码: $CODE"
        fi
    fi
    
    echo
    echo "🧪 测试注册流程："
    echo "   1. 打开前端页面: http://localhost:5174"
    echo "   2. 点击注册"
    echo "   3. 输入邮箱: $TEST_EMAIL"
    echo "   4. 点击发送验证码"
    echo "   5. 输入收到的验证码完成注册"
    
else
    echo
    echo "❌ 验证码发送失败"
    
    # 分析可能的错误原因
    if echo "$RESPONSE" | grep -q "该邮箱或手机号已被注册"; then
        echo "   原因: 该邮箱已被注册"
        echo "   解决: 使用其他邮箱地址"
    elif echo "$RESPONSE" | grep -q "邮件发送失败"; then
        echo "   原因: 邮件发送失败"
        echo "   解决: 检查邮箱服务配置"
    else
        echo "   请检查:"
        echo "   1. 邮箱地址格式是否正确"
        echo "   2. 后端服务是否正常运行"
        echo "   3. 邮箱服务配置是否正确"
    fi
    
    echo
    echo "🔧 故障排除："
    echo "   1. 查看后端日志: 在后端服务终端查看错误信息"
    echo "   2. 检查配置: cat backend/.env | grep EMAIL"
    echo "   3. 重新配置: ./scripts/setup-email-service.sh"
fi

echo
echo "📚 更多帮助："
echo "   - 配置指南: docs/EMAIL_SETUP_GUIDE.md"
echo "   - 重启服务: ./unified-manager.sh dev-restart"
echo "   - 查看日志: 在后端服务终端查看实时日志" 