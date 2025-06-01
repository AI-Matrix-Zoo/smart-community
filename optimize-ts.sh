#!/bin/bash

# TypeScript 内存优化脚本
# 快速清理和优化 TypeScript 服务

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 TypeScript 内存优化工具${NC}"
echo ""

# 1. 清理 TypeScript 缓存
echo -e "${YELLOW}📁 清理 TypeScript 缓存文件...${NC}"
rm -f frontend/.tsbuildinfo backend/.tsbuildinfo
rm -f frontend/tsconfig.tsbuildinfo backend/tsconfig.tsbuildinfo
echo -e "${GREEN}✅ TypeScript 缓存已清理${NC}"

# 2. 清理 node_modules 中的类型缓存
echo -e "${YELLOW}🗂️  清理 node_modules 类型缓存...${NC}"
find . -name ".tsbuildinfo" -type f -delete 2>/dev/null || true
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true
echo -e "${GREEN}✅ node_modules 类型缓存已清理${NC}"

# 3. 显示内存使用情况
echo -e "${YELLOW}📊 当前 TypeScript 相关进程:${NC}"
ps aux | grep -E "(tsserver|typescript)" | grep -v grep || echo "未找到 TypeScript 进程"

# 4. 提示用户重启 TypeScript 服务
echo ""
echo -e "${BLUE}💡 建议操作:${NC}"
echo "1. 在 Cursor/VSCode 中按 Ctrl+Shift+P"
echo "2. 输入 'TypeScript: Restart TS Server'"
echo "3. 或者重新加载窗口: 'Developer: Reload Window'"
echo ""
echo -e "${GREEN}🎯 优化完成！TypeScript 服务应该会使用更少的内存。${NC}" 