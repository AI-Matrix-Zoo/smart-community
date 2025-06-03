# Scripts 文件夹说明

本文件夹包含项目的各种辅助脚本和已废弃的脚本。

## 📁 文件分类

### 🗂️ 已废弃的脚本
这些脚本已被 `unified-manager.sh` 统一管理脚本替代：

- `dev-manager.sh.deprecated` - 旧的开发环境管理脚本
- `manage.sh.deprecated` - 旧的生产环境管理脚本
- `unified-manager.sh.backup` - 统一管理脚本的备份版本

### 🔧 辅助工具脚本
- `optimize-ts.sh` - TypeScript 优化脚本
- `test-phone-registration.js` - 手机注册功能测试脚本
- `final_review_gate.py` - 交互式审查脚本

### 🧪 测试脚本
- `test-services.sh` - 服务测试脚本
- `test-routes.sh` - 路由测试脚本
- `test-spa-routes.sh` - SPA路由测试脚本
- `test-api-connection.sh` - API连接测试脚本

### 🚀 部署脚本
- `update-frontend-deployment.sh` - 前端部署更新脚本
- `force-redeploy-backend.sh` - 强制重新部署后端脚本
- `reset-production-db.sh` - 重置生产数据库脚本

## ⚠️ 重要说明

### 推荐使用
请使用项目根目录下的统一管理脚本：
- `unified-manager.sh` - 统一管理脚本（推荐）
- `quick-start.sh` - 快速启动脚本（新手推荐）

### 废弃脚本
标记为 `.deprecated` 的脚本已不再维护，仅作为参考保留。

## 📋 使用指南

### 运行测试脚本
```bash
# 从项目根目录运行
./scripts/test-services.sh
./scripts/test-routes.sh
./scripts/test-api-connection.sh  # 测试API连接
```

### 运行部署脚本
```bash
# 从项目根目录运行
./scripts/update-frontend-deployment.sh
./scripts/force-redeploy-backend.sh
```

### 数据库重置
```bash
# 谨慎使用，会清空数据
./scripts/reset-production-db.sh
```

### API连接测试
```bash
# 测试前后端API连接是否正常
./scripts/test-api-connection.sh
```

## 🔄 迁移说明

如果您之前使用的是旧脚本，请参考以下迁移指南：

### 从 dev-manager.sh 迁移
```bash
# 旧命令
./dev-manager.sh start

# 新命令
./unified-manager.sh dev-start
```

### 从 manage.sh 迁移
```bash
# 旧命令
./manage.sh deploy

# 新命令
./unified-manager.sh deploy
```

详细的迁移指南请参考 `docs/脚本合并说明.md`。