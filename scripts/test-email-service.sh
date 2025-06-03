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
CONFIG_RESPONSE=$(curl -s http://localhost:3001/debug/email-config)
echo "📋 当前配置:"
echo "$CONFIG_RESPONSE" | jq . 2>/dev/null || echo "$CONFIG_RESPONSE"

echo

# 检查是否启用真实邮箱服务
if echo "$CONFIG_RESPONSE" | grep -q '"EMAIL_ENABLED":"true"'; then
    echo "✅ 真实邮箱服务已启用"
    REAL_EMAIL=true
else
    echo "⚠️  当前使用模拟邮箱服务"
    echo "   💡 验证码将在后端控制台显示"
    REAL_EMAIL=false
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
    echo
    echo "🔧 故障排除建议："
    echo "   1. 检查邮箱服务配置"
    echo "   2. 查看后端日志: tail -f logs/dev-backend-*.log"
    echo "   3. 测试邮箱连接: curl http://localhost:3001/debug/email-config"
    echo "   4. 重启后端服务: ./unified-manager.sh dev-restart"
fi

echo
echo "📊 详细诊断信息："
echo "   🔗 邮箱配置: http://localhost:3001/debug/email-config"
echo "   🔗 系统信息: http://localhost:3001/debug/system-info"
echo "   📋 后端日志: tail -f logs/dev-backend-*.log"

echo
echo "=== 测试完成 ===" 