# 项目文件组织结构

## 文件夹说明

### 根目录
- `README.md` - 项目主要文档
- `manage.sh` - 项目管理脚本（启动、停止、构建等）
- `prepare-deploy.sh` - 部署准备脚本
- `update-deployment.sh` - 部署更新脚本
- `final_review_gate.py` - 交互式审查脚本
- `.gitignore` - Git忽略文件配置
- `metadata.json` - 项目元数据

### `/docs` - 文档目录
- `LOGIN_CREDENTIALS.md` - 测试账户登录凭据
- `FIXES_SUMMARY.md` - 修复问题总结
- `DEPLOYMENT_GUIDE.md` - 部署指南
- `DEPLOY_CHECKLIST.md` - 部署检查清单
- `OPTIMIZATION_SUMMARY.md` - 优化总结
- `PROJECT_STRUCTURE.md` - 项目结构说明
- `DEPLOYMENT_SUMMARY.md` - 部署总结
- `FILE_ORGANIZATION.md` - 本文件，文件组织说明

### `/scripts` - 脚本目录
- `test-routes.sh` - 路由测试脚本
- `test-services.sh` - 服务测试脚本

### `/tests` - 测试文件目录
- `debug-info.html` - 调试信息页面
- `test-page.html` - 测试页面

### `/logs` - 日志文件目录
- `*.log` - 各种日志文件
- 运行时生成的日志文件会自动存放在此目录

### `/runtime` - 运行时文件目录
- `.backend.pid` - 后端服务进程ID文件
- `.frontend.pid` - 前端服务进程ID文件
- 其他运行时临时文件

### `/temp` - 临时文件目录
- `render.yaml` - Render部署配置（旧版）
- 其他临时文件和配置文件

### `/frontend` - 前端项目目录
- React + TypeScript 前端应用

### `/backend` - 后端项目目录
- Node.js + Express 后端API

## 文件分类规则

### 新文件创建规则
1. **文档文件** (`.md`) → `/docs`
2. **脚本文件** (`.sh`, `.py`) → `/scripts` (重要的管理脚本可放在根目录)
3. **测试文件** (`.html`, 测试相关) → `/tests`
4. **日志文件** (`.log`) → `/logs`
5. **临时配置文件** (`.yaml`, `.json` 等临时文件) → `/temp`
6. **重要配置文件** (`.gitignore`, `package.json` 等) → 根目录

### 根目录保留文件
- 项目主要文档 (`README.md`)
- 核心管理脚本 (`manage.sh`, `prepare-deploy.sh`, `update-deployment.sh`)
- 重要配置文件 (`.gitignore`, `metadata.json`)
- 交互式工具 (`final_review_gate.py`)

## 维护建议

1. 定期清理 `/temp` 目录中的过期文件
2. 日志文件超过一定大小时进行归档
3. 新增脚本时，优先考虑放在 `/scripts` 目录
4. 重要的项目文档应放在 `/docs` 目录并在 `README.md` 中引用
5. 测试相关的HTML文件和工具放在 `/tests` 目录 