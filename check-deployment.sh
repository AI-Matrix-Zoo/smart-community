#!/bin/bash

# 智慧小区生活平台 - 部署状态检查脚本

echo "🚀 智慧小区生活平台 - 部署状态检查"
echo "=================================="

# 检查nginx状态
echo "📋 检查nginx服务状态..."
if systemctl is-active --quiet nginx; then
    echo "✅ nginx服务正在运行"
else
    echo "❌ nginx服务未运行"
fi

# 检查PM2状态
echo "📋 检查后端服务状态..."
if pm2 list | grep -q "smart-community-backend.*online"; then
    echo "✅ 后端服务正在运行"
    pm2 list
else
    echo "❌ 后端服务未运行"
fi

# 检查前端页面
echo "📋 检查前端页面..."
if curl -s -I http://localhost/ | grep -q "200 OK"; then
    echo "✅ 前端页面可访问"
else
    echo "❌ 前端页面无法访问"
fi

# 检查API健康状态
echo "📋 检查API健康状态..."
if curl -s http://localhost/api/health | grep -q "success.*true"; then
    echo "✅ API服务正常"
else
    echo "❌ API服务异常"
fi

# 检查公网访问
echo "📋 检查公网访问..."
if curl -s -I http://123.56.64.5/ | grep -q "200 OK"; then
    echo "✅ 公网前端可访问"
else
    echo "❌ 公网前端无法访问"
fi

if curl -s http://123.56.64.5/api/health | grep -q "success.*true"; then
    echo "✅ 公网API可访问"
else
    echo "❌ 公网API无法访问"
fi

echo ""
echo "🌐 访问地址："
echo "前端页面: http://123.56.64.5/"
echo "API健康检查: http://123.56.64.5/api/health"
echo ""
echo "📊 服务管理命令："
echo "查看后端日志: pm2 logs smart-community-backend"
echo "重启后端: pm2 restart smart-community-backend"
echo "重启nginx: systemctl restart nginx"
echo "查看nginx日志: tail -f /var/log/nginx/error.log" 