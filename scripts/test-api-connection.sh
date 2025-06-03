#!/bin/bash

# API连接测试脚本
echo "🧪 测试API连接..."

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 测试后端健康检查
echo "测试后端健康检查..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ 后端健康检查: 正常${NC}"
else
    echo -e "${RED}❌ 后端健康检查: 失败${NC}"
    exit 1
fi

# 测试公告API
echo "测试公告API..."
if curl -s http://localhost:3001/api/announcements > /dev/null; then
    echo -e "${GREEN}✅ 公告API: 正常${NC}"
else
    echo -e "${RED}❌ 公告API: 失败${NC}"
fi

# 测试建议API
echo "测试建议API..."
if curl -s http://localhost:3001/api/suggestions > /dev/null; then
    echo -e "${GREEN}✅ 建议API: 正常${NC}"
else
    echo -e "${RED}❌ 建议API: 失败${NC}"
fi

# 测试市场API
echo "测试市场API..."
if curl -s http://localhost:3001/api/market > /dev/null; then
    echo -e "${GREEN}✅ 市场API: 正常${NC}"
else
    echo -e "${RED}❌ 市场API: 失败${NC}"
fi

# 测试前端服务
echo "测试前端服务..."
if curl -s http://localhost:5174 > /dev/null; then
    echo -e "${GREEN}✅ 前端服务: 正常${NC}"
else
    echo -e "${RED}❌ 前端服务: 失败${NC}"
fi

echo ""
echo -e "${GREEN}🎉 API连接测试完成！${NC}"
echo ""
echo "访问地址："
echo "  前端: http://localhost:5174"
echo "  后端API: http://localhost:3001/api"
echo "  健康检查: http://localhost:3001/health" 