# 智慧小区生活平台 - 后端API

这是智慧小区生活平台的后端API服务，提供用户认证、建议反馈、二手市场、公告管理等功能。

## 技术栈

- **Node.js** + **TypeScript** - 运行时和开发语言
- **Express.js** - Web框架
- **SQLite** - 数据库
- **JWT** - 身份认证
- **bcryptjs** - 密码加密
- **Joi** - 数据验证

## 功能特性

### 🔐 用户认证
- 用户注册/登录
- JWT token认证
- 角色权限管理（用户/物业/管理员）

### 💡 建议反馈
- 提交建议
- 查看建议列表
- 状态更新（物业/管理员）
- 进度跟踪

### 🛒 二手市场
- 发布物品
- 浏览物品列表
- 管理个人物品

### 📢 公告管理
- 发布公告（物业/管理员）
- 查看公告列表
- 编辑/删除公告

### 👥 用户管理
- 用户列表（管理员）
- 用户信息编辑
- 用户删除

## 🚀 快速开始

### 使用管理脚本（推荐）

我们提供了一个强大的管理脚本 `manage.sh` 来简化开发和部署流程：

```bash
# 显示帮助信息
./manage.sh help

# 交互式菜单（无参数运行）
./manage.sh

# 常用命令
./manage.sh install    # 安装依赖
./manage.sh build      # 构建项目
./manage.sh dev        # 启动开发服务器
./manage.sh start      # 启动生产服务器
./manage.sh restart    # 重启服务
./manage.sh status     # 查看服务状态
./manage.sh test-api   # API测试
```

### 传统方式

1. **安装依赖**
   ```bash
   npm install
   ```

2. **环境配置**
   ```bash
   cp env.example .env
   # 编辑 .env 文件，设置必要的环境变量
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **构建生产版本**
   ```bash
   npm run build
   npm start
   ```

## 🛠️ 管理脚本功能

### 开发相关
- `install` - 安装项目依赖
- `build` - 构建TypeScript项目
- `dev` - 启动开发服务器（热重载）
- `start` - 启动生产服务器

### 服务管理
- `restart` - 重启生产服务（后台运行）
- `stop` - 停止后台服务
- `status` - 查看服务运行状态
- `logs` - 查看服务日志

### 测试和验证
- `test` - 运行单元测试
- `test-api` - 执行API端点测试

### 数据库管理
- `database` - 数据库管理菜单
  - 查看数据库信息
  - 备份数据库
  - 恢复数据库
  - 清空数据库

### 环境配置
- `env` - 环境变量配置和查看

## 🧪 API测试

### 使用管理脚本测试
```bash
# 启动服务器
./manage.sh dev

# 在另一个终端运行API测试
./manage.sh test-api
```

### 使用独立测试脚本
```bash
# 确保服务器运行在3001端口
node test-api.js
```

### 手动测试
```bash
# 健康检查
curl http://localhost:3001/health

# 获取公告列表
curl http://localhost:3001/api/announcements

# 测试登录端点
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"password123"}'
```

## 📦 Docker部署

### 构建镜像
```bash
docker build -t smart-community-backend .
```

### 运行容器
```bash
docker run -p 3001:3001 \
  -e JWT_SECRET=your-secret-key \
  -e NODE_ENV=production \
  smart-community-backend
```

## ☁️ Render部署

详细的部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 快速部署步骤
1. 将代码推送到GitHub
2. 在Render创建Web Service
3. 连接GitHub仓库
4. Render会自动检测`render.yaml`配置
5. 等待部署完成

## API文档

### 认证接口

#### POST /api/auth/login
用户登录
```json
{
  "phone": "13800138000",
  "password": "password123"
}
```

#### POST /api/auth/register
用户注册
```json
{
  "phone": "13900139000",
  "password": "password123",
  "name": "张三",
  "building": "1栋",
  "room": "101"
}
```

### 建议接口

#### GET /api/suggestions
获取建议列表（需要认证）

#### POST /api/suggestions
提交新建议（需要认证）
```json
{
  "title": "建议标题",
  "description": "建议描述",
  "category": "建议分类"
}
```

#### PUT /api/suggestions/:id/status
更新建议状态（物业/管理员）
```json
{
  "status": "处理中",
  "progressUpdateText": "正在处理中..."
}
```

### 市场接口

#### GET /api/market
获取市场物品列表

#### POST /api/market
发布新物品（需要认证）
```json
{
  "title": "物品标题",
  "description": "物品描述",
  "price": 100,
  "category": "物品分类",
  "imageUrl": "图片URL",
  "contactInfo": "联系方式"
}
```

### 公告接口

#### GET /api/announcements
获取公告列表

#### POST /api/announcements
发布公告（物业/管理员）
```json
{
  "content": "公告内容"
}
```

## 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| PORT | 服务端口 | 3001 |
| NODE_ENV | 运行环境 | development |
| JWT_SECRET | JWT密钥 | - |
| JWT_EXPIRES_IN | JWT过期时间 | 7d |
| DB_PATH | 数据库路径 | ./data/community.db |
| FRONTEND_URL | 前端URL（CORS） | http://localhost:5173 |

## 数据库结构

### users 表
- id: 用户ID
- phone: 手机号
- password: 加密密码
- name: 显示名称
- role: 用户角色
- building: 楼栋
- room: 房间号

### suggestions 表
- id: 建议ID
- title: 标题
- description: 描述
- category: 分类
- submitted_by: 提交者
- status: 状态

### market_items 表
- id: 物品ID
- title: 标题
- description: 描述
- price: 价格
- category: 分类
- seller: 卖家

### announcements 表
- id: 公告ID
- content: 内容
- author_id: 作者ID
- role_of_author: 作者角色

## 🔧 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口占用
   lsof -i :3001
   # 或使用管理脚本
   ./manage.sh status
   ```

2. **依赖安装失败**
   ```bash
   # 清除缓存重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **TypeScript编译错误**
   ```bash
   # 检查TypeScript配置
   npm run build
   ```

4. **数据库问题**
   ```bash
   # 使用管理脚本管理数据库
   ./manage.sh database
   ```

### 日志查看
```bash
# 使用管理脚本查看日志
./manage.sh logs

# 或直接查看文件
tail -f server.log
```

## 🤝 开发贡献

- 使用TypeScript进行类型安全开发
- 遵循RESTful API设计原则
- 使用Joi进行请求数据验证
- 实现了完整的错误处理机制
- 支持CORS跨域请求

## �� 许可证

MIT License 