# 智慧moma生活平台

一个现代化的智慧社区生活服务平台，提供业主服务、物业管理、社区互动等功能。

## 🏗️ 项目架构

```
智慧moma生活平台/
├── frontend/              # 前端项目 (React + TypeScript + Vite)
├── backend/               # 后端项目 (Node.js + TypeScript + Express)
├── scripts/               # 辅助脚本和已废弃脚本
├── docs/                  # 项目文档
├── unified-manager.sh     # 统一管理脚本 (推荐)
├── quick-start.sh         # 快速启动脚本 (新手推荐)
└── README.md              # 项目说明文档
```

## ✨ 功能特色

- 🏠 **业主服务**: 房屋信息管理、缴费记录、维修申请
- 🏢 **物业管理**: 公告发布、费用管理、维修处理
- 💬 **社区互动**: 建议反馈、邻里交流
- 🛒 **二手市场**: 闲置物品交易平台
- 👥 **用户管理**: 多角色权限控制
- 📱 **响应式设计**: 支持手机、平板、桌面设备

## 🚀 快速开始

### 🎯 推荐方式 - 一键启动

```bash
# 新手推荐：一键启动（自动处理依赖和配置）
./quick-start.sh
```

### 🔧 统一管理脚本

项目提供了统一的管理脚本 `unified-manager.sh`，支持开发、构建、部署的全流程管理：

```bash
# 查看帮助
./unified-manager.sh help

# 安装依赖
./unified-manager.sh install

# 初始化项目
./unified-manager.sh init

# 启动开发环境（交互式）
./unified-manager.sh dev

# 启动开发环境（后台运行）
./unified-manager.sh dev-start

# 停止开发环境
./unified-manager.sh dev-stop

# 构建项目
./unified-manager.sh build

# 部署到生产环境
./unified-manager.sh deploy

# 查看项目状态
./unified-manager.sh status
```

### 📋 端口配置

- **开发环境**:
  - 前端: http://localhost:5174
  - 后端: http://localhost:3001
- **生产环境**:
  - 前端: http://localhost:5173
  - 后端: http://localhost:3000

## 🎯 演示账户

| 角色 | 邮箱 | 密码 | 权限 |
|------|------|------|------|
| 管理员 | admin@example.com | admin123 | 全部功能 |
| 物业 | property@example.com | property123 | 物业管理 |
| 业主 | resident@example.com | password123 | 业主服务 |

## 🛠️ 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件**: Ant Design
- **路由**: React Router
- **状态管理**: React Context
- **HTTP客户端**: Axios

### 后端
- **运行时**: Node.js + TypeScript
- **框架**: Express.js
- **数据存储**: 内存数据库 (开发环境)
- **身份验证**: JWT
- **文件上传**: Multer
- **短信服务**: 阿里云短信

## 📁 项目结构

```
智慧moma生活平台/
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── components/      # 通用组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API服务
│   │   ├── types/          # TypeScript类型
│   │   └── utils/          # 工具函数
│   └── package.json
├── backend/                  # 后端应用
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # 路由
│   │   ├── services/       # 业务服务
│   │   ├── types/          # TypeScript类型
│   │   └── utils/          # 工具函数
│   └── package.json
├── scripts/                  # 辅助脚本文件夹
│   ├── README.md            # 脚本说明文档
│   ├── dev-manager.sh.deprecated    # 已废弃的开发管理脚本
│   ├── manage.sh.deprecated         # 已废弃的生产管理脚本
│   ├── optimize-ts.sh              # TypeScript优化脚本
│   ├── test-services.sh            # 服务测试脚本
│   └── ...                         # 其他辅助脚本
├── docs/                     # 项目文档
│   ├── 本地开发测试指南.md    # 开发指南
│   ├── 脚本合并说明.md       # 脚本迁移指南
│   └── 修复总结.md          # 问题修复记录
├── unified-manager.sh        # 统一管理脚本 (推荐)
├── quick-start.sh           # 快速启动脚本 (新手推荐)
└── README.md
```

## ⚡ 性能优化

### TypeScript 内存优化

项目已经过 TypeScript 内存优化配置，如果遇到 tsserver 占用内存过高的问题：

```bash
# 运行 TypeScript 优化脚本
./scripts/optimize-ts.sh

# 或者在 Cursor/VSCode 中重启 TypeScript 服务
# Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

详细的优化说明请查看 `docs/` 文件夹中的相关文档。

### 主要优化措施

- ✅ 启用 `skipLibCheck` 跳过库文件检查
- ✅ 配置增量编译缓存
- ✅ 精确的文件包含/排除规则
- ✅ 禁用不必要的 TypeScript 功能
- ✅ 优化 VSCode/Cursor 工作区设置

## 🚀 部署

### 开发环境
```bash
# 推荐方式
./quick-start.sh

# 或者使用统一管理脚本
./unified-manager.sh dev-start
```

### 生产环境
```bash
# 构建并部署
./unified-manager.sh deploy

# 停止服务
./unified-manager.sh prod-stop
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # 后端 API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # 文件上传大小限制
    client_max_body_size 50M;
}
```

## 📝 开发指南

### 添加新功能

1. **后端 API**
   ```bash
   # 在 backend/src/routes/ 添加路由
   # 在 backend/src/controllers/ 添加控制器
   # 在 backend/src/services/ 添加业务逻辑
   ```

2. **前端页面**
   ```bash
   # 在 frontend/src/pages/ 添加页面组件
   # 在 frontend/src/services/ 添加 API 调用
   # 更新路由配置
   ```

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 编写单元测试

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 问题反馈

如果遇到问题，请：

1. 查看 `docs/` 文件夹中的相关文档了解详细指南
2. 运行 `./unified-manager.sh status` 检查项目状态
3. 查看 `logs/` 文件夹中的日志文件
4. 尝试运行 `./quick-start.sh` 重新启动
5. 查看控制台错误信息
6. 提交 Issue 描述问题

### 📚 相关文档

- `docs/本地开发测试指南.md` - 详细的开发环境搭建指南
- `docs/脚本合并说明.md` - 从旧脚本迁移的指南
- `docs/修复总结.md` - 常见问题的修复记录
- `scripts/README.md` - 辅助脚本使用说明

---

**智慧moma生活平台** - 让社区生活更美好 🏡
