#!/bin/bash

# 重置生产环境数据库脚本
# 用于修复Render部署后的登录问题

echo "🔄 重置生产环境数据库..."

# 删除现有数据库文件（如果存在）
if [ -f "backend/data/community.db" ]; then
    echo "📁 删除现有数据库文件..."
    rm backend/data/community.db
fi

# 确保数据目录存在
mkdir -p backend/data

echo "✅ 数据库重置完成"
echo "📝 下次启动时将自动创建新的数据库并插入正确的用户数据"
echo ""
echo "🚀 现在可以重新部署到Render："
echo "   1. 提交这些更改到Git"
echo "   2. 推送到GitHub"
echo "   3. Render会自动重新部署"
echo ""
echo "🔑 部署后可用的测试账户："
echo "   - 超级管理员: admin / admin"
echo "   - 普通用户: 13800138000 / password123"
echo "   - 物业: property_phone_01 / property123" 