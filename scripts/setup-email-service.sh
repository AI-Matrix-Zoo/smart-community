#!/bin/bash

echo "📧 智慧小区邮箱服务配置向导"
echo "================================"
echo

# 检查是否存在.env文件
if [ ! -f "backend/.env" ]; then
    echo "📝 创建环境配置文件..."
    cp backend/email-config-example.env backend/.env
    # 修改端口为开发环境端口
    sed -i '' 's/PORT=3000/PORT=3001/' backend/.env
    sed -i '' 's/NODE_ENV=production/NODE_ENV=development/' backend/.env
    echo "✅ 已创建 backend/.env 文件"
else
    echo "✅ 环境配置文件已存在"
fi

echo
echo "🔍 当前邮箱服务状态："

# 检查当前配置
if grep -q "EMAIL_ENABLED=true" backend/.env; then
    echo "✅ 真实邮箱服务已启用"
    EMAIL_USER=$(grep "EMAIL_USER=" backend/.env | cut -d'=' -f2)
    EMAIL_HOST=$(grep "EMAIL_HOST=" backend/.env | cut -d'=' -f2)
    echo "   📧 邮箱: $EMAIL_USER"
    echo "   🌐 SMTP: $EMAIL_HOST"
else
    echo "⚠️  当前使用模拟邮箱服务（验证码只在控制台显示）"
fi

echo
echo "📋 配置真实邮箱服务的步骤："
echo "1. 选择邮箱服务商（推荐QQ邮箱）"
echo "2. 开启邮箱的SMTP服务"
echo "3. 获取授权码（不是登录密码）"
echo "4. 编辑 backend/.env 文件"
echo "5. 重启后端服务"

echo
echo "🎯 快速配置选项："
echo "1) QQ邮箱配置"
echo "2) Gmail配置"
echo "3) 163邮箱配置"
echo "4) 查看配置指南"
echo "5) 测试当前配置"
echo "0) 退出"

read -p "请选择 (0-5): " choice

case $choice in
    1)
        echo
        echo "📧 QQ邮箱配置步骤："
        echo "1. 登录 mail.qq.com"
        echo "2. 设置 → 账户 → POP3/IMAP/SMTP服务"
        echo "3. 开启 IMAP/SMTP 服务"
        echo "4. 发送短信获取16位授权码"
        echo
        read -p "请输入您的QQ邮箱地址: " qq_email
        read -p "请输入16位授权码: " qq_auth_code
        
        if [ ! -z "$qq_email" ] && [ ! -z "$qq_auth_code" ]; then
            # 更新配置文件
            sed -i '' "s/# EMAIL_HOST=smtp.qq.com/EMAIL_HOST=smtp.qq.com/" backend/.env
            sed -i '' "s/# EMAIL_PORT=587/EMAIL_PORT=587/" backend/.env
            sed -i '' "s/# EMAIL_SECURE=false/EMAIL_SECURE=false/" backend/.env
            sed -i '' "s/# EMAIL_USER=your-email@qq.com/EMAIL_USER=$qq_email/" backend/.env
            sed -i '' "s/# EMAIL_PASS=your-16-digit-auth-code/EMAIL_PASS=$qq_auth_code/" backend/.env
            sed -i '' "s/# EMAIL_FROM=智慧小区 <your-email@qq.com>/EMAIL_FROM=智慧小区 <$qq_email>/" backend/.env
            sed -i '' "s/EMAIL_ENABLED=false/EMAIL_ENABLED=true/" backend/.env
            
            echo "✅ QQ邮箱配置已保存"
            echo "🔄 请重启后端服务: ./unified-manager.sh dev-restart"
        fi
        ;;
    2)
        echo
        echo "📧 Gmail配置步骤："
        echo "1. 登录 Gmail"
        echo "2. 账户设置 → 安全性"
        echo "3. 开启两步验证"
        echo "4. 生成应用专用密码"
        echo
        read -p "请输入您的Gmail地址: " gmail_email
        read -p "请输入应用专用密码: " gmail_password
        
        if [ ! -z "$gmail_email" ] && [ ! -z "$gmail_password" ]; then
            # 更新配置文件（使用Gmail配置）
            sed -i '' "s/EMAIL_HOST=.*/EMAIL_HOST=smtp.gmail.com/" backend/.env
            sed -i '' "s/EMAIL_PORT=.*/EMAIL_PORT=587/" backend/.env
            sed -i '' "s/EMAIL_SECURE=.*/EMAIL_SECURE=false/" backend/.env
            sed -i '' "s/EMAIL_USER=.*/EMAIL_USER=$gmail_email/" backend/.env
            sed -i '' "s/EMAIL_PASS=.*/EMAIL_PASS=$gmail_password/" backend/.env
            sed -i '' "s/EMAIL_FROM=.*/EMAIL_FROM=Smart Community <$gmail_email>/" backend/.env
            sed -i '' "s/EMAIL_ENABLED=false/EMAIL_ENABLED=true/" backend/.env
            
            echo "✅ Gmail配置已保存"
            echo "🔄 请重启后端服务: ./unified-manager.sh dev-restart"
        fi
        ;;
    3)
        echo
        echo "📧 163邮箱配置步骤："
        echo "1. 登录 mail.163.com"
        echo "2. 设置 → POP3/SMTP/IMAP"
        echo "3. 开启SMTP服务"
        echo "4. 获取授权码"
        echo
        read -p "请输入您的163邮箱地址: " email_163
        read -p "请输入授权码: " auth_163
        
        if [ ! -z "$email_163" ] && [ ! -z "$auth_163" ]; then
            # 更新配置文件（使用163配置）
            sed -i '' "s/EMAIL_HOST=.*/EMAIL_HOST=smtp.163.com/" backend/.env
            sed -i '' "s/EMAIL_PORT=.*/EMAIL_PORT=587/" backend/.env
            sed -i '' "s/EMAIL_SECURE=.*/EMAIL_SECURE=false/" backend/.env
            sed -i '' "s/EMAIL_USER=.*/EMAIL_USER=$email_163/" backend/.env
            sed -i '' "s/EMAIL_PASS=.*/EMAIL_PASS=$auth_163/" backend/.env
            sed -i '' "s/EMAIL_FROM=.*/EMAIL_FROM=智慧小区 <$email_163>/" backend/.env
            sed -i '' "s/EMAIL_ENABLED=false/EMAIL_ENABLED=true/" backend/.env
            
            echo "✅ 163邮箱配置已保存"
            echo "🔄 请重启后端服务: ./unified-manager.sh dev-restart"
        fi
        ;;
    4)
        echo
        echo "📖 详细配置指南："
        echo "请查看文档: docs/EMAIL_SETUP_GUIDE.md"
        echo "或访问: https://github.com/your-repo/docs/EMAIL_SETUP_GUIDE.md"
        ;;
    5)
        echo
        echo "🧪 测试邮箱服务..."
        if [ -f "scripts/test-email-service.sh" ]; then
            ./scripts/test-email-service.sh
        else
            echo "❌ 测试脚本不存在"
        fi
        ;;
    0)
        echo "👋 退出配置向导"
        exit 0
        ;;
    *)
        echo "❌ 无效选择"
        ;;
esac

echo
echo "📚 更多帮助："
echo "- 配置指南: docs/EMAIL_SETUP_GUIDE.md"
echo "- 测试邮箱: scripts/test-email-service.sh"
echo "- 重启服务: ./unified-manager.sh dev-restart" 