# manage.sh 脚本使用指南

## 概述

`manage.sh` 是智慧小区生活平台的统一管理脚本，支持开发环境和生产环境的完整管理，包括PM2进程管理、部署流程等。

## 功能特性

- 🔧 **开发环境管理**：启动、停止开发服务器
- 🚀 **生产环境管理**：完整的PM2进程管理
- 📦 **部署自动化**：一键部署前端、后端或完整系统
- 📊 **状态监控**：实时查看服务状态和日志
- 🔍 **健康检查**：自动检测服务健康状态

## 快速开始

### 开发环境

```bash
# 快速启动开发环境（推荐）
./manage.sh quick-start

# 或者分步操作
./manage.sh install    # 安装依赖
./manage.sh build      # 构建项目
./manage.sh dev        # 启动开发环境
```

### 生产环境

```bash
# 使用PM2启动生产环境
./manage.sh pm2:start

# 查看PM2状态
./manage.sh pm2:status

# 查看PM2日志
./manage.sh pm2:logs
```

## 命令详解

### 开发环境命令

#### `install` - 安装依赖
```bash
./manage.sh install                    # 安装前后端依赖
./manage.sh install --backend-only     # 仅安装后端依赖
./manage.sh install --frontend-only    # 仅安装前端依赖
```

#### `build` - 构建项目
```bash
./manage.sh build                      # 构建前后端项目
./manage.sh build --backend-only       # 仅构建后端
./manage.sh build --frontend-only      # 仅构建前端
```

#### `dev` - 启动开发环境
```bash
./manage.sh dev                        # 启动前后端开发服务器
./manage.sh dev --backend-only         # 仅启动后端开发服务器
./manage.sh dev --frontend-only        # 仅启动前端开发服务器
```

#### `quick-start` - 快速启动
```bash
./manage.sh quick-start                # 快速启动开发环境并进行健康检查
```
- 自动处理端口占用
- 启动前后端服务
- 进行健康检查
- 显示访问地址和使用提示

### 生产环境命令 (PM2)

#### `pm2:start` - 启动PM2服务
```bash
./manage.sh pm2:start                  # 使用PM2启动后端服务
```
- 自动检查并安装PM2
- 支持ecosystem.config.js配置文件
- 前端由Nginx提供静态文件服务

#### `pm2:stop` - 停止PM2服务
```bash
./manage.sh pm2:stop                   # 停止PM2管理的服务
```

#### `pm2:restart` - 重启PM2服务
```bash
./manage.sh pm2:restart                # 重启PM2管理的服务
```
- 如果服务未运行，会自动启动

#### `pm2:reload` - 重载PM2服务（零停机）
```bash
./manage.sh pm2:reload                 # 零停机重载服务
```
- 适用于生产环境更新

#### `pm2:status` - 查看PM2状态
```bash
./manage.sh pm2:status                 # 显示PM2进程状态表
```

#### `pm2:logs` - 查看PM2日志
```bash
./manage.sh pm2:logs                   # 查看所有PM2日志
./manage.sh pm2:logs --backend-only    # 仅查看后端日志
```

#### `pm2:monit` - PM2监控界面
```bash
./manage.sh pm2:monit                  # 启动PM2实时监控界面
```

#### `pm2:delete` - 删除PM2服务
```bash
./manage.sh pm2:delete                 # 删除PM2管理的服务配置
```
- 需要确认操作

#### `pm2:save` - 保存PM2进程列表
```bash
./manage.sh pm2:save                   # 保存当前PM2进程列表
```

#### `pm2:resurrect` - 恢复PM2进程列表
```bash
./manage.sh pm2:resurrect              # 恢复保存的PM2进程列表
```

### 部署命令

#### `deploy` - 完整部署流程
```bash
./manage.sh deploy                     # 完整部署流程
```
包含以下步骤：
1. 检查Git状态
2. 拉取最新代码
3. 安装依赖
4. 构建项目
5. 部署前端（复制到Nginx目录）
6. 部署后端（PM2重启）
7. 健康检查

#### `deploy:frontend` - 仅部署前端
```bash
./manage.sh deploy:frontend            # 仅部署前端
```
- 构建前端项目
- 复制到Nginx目录
- 重载Nginx配置

#### `deploy:backend` - 仅部署后端
```bash
./manage.sh deploy:backend             # 仅部署后端
```
- 构建后端项目
- 重启PM2服务

### 通用命令

#### `stop` - 停止所有服务
```bash
./manage.sh stop                       # 停止开发环境和PM2服务
```

#### `clean` - 清理项目
```bash
./manage.sh clean                      # 清理构建文件和日志
```
- 可选择是否删除node_modules

#### `status` - 查看服务状态
```bash
./manage.sh status                     # 查看所有服务状态
```
显示：
- 开发环境状态（端口占用情况）
- PM2服务状态
- Nginx服务状态

#### `logs` - 查看日志
```bash
./manage.sh logs                       # 查看服务日志
./manage.sh logs --backend-only        # 仅查看后端日志
./manage.sh logs --frontend-only       # 仅查看前端日志
```

#### `health` - 健康检查
```bash
./manage.sh health                     # 执行健康检查
```
检查：
- 后端API健康状态
- 前端服务可访问性

#### `test` - 运行测试
```bash
./manage.sh test                       # 运行前后端测试
./manage.sh test --backend-only        # 仅运行后端测试
./manage.sh test --frontend-only       # 仅运行前端测试
```

#### `test-services` - 服务功能测试
```bash
./manage.sh test-services              # 运行服务功能测试
```

## 使用场景

### 日常开发

```bash
# 开始开发
./manage.sh quick-start

# 查看状态
./manage.sh status

# 查看日志
./manage.sh logs

# 停止服务
./manage.sh stop
```

### 生产部署

```bash
# 首次部署
./manage.sh deploy

# 仅更新前端
./manage.sh deploy:frontend

# 仅更新后端
./manage.sh deploy:backend

# 查看PM2状态
./manage.sh pm2:status

# 查看PM2日志
./manage.sh pm2:logs
```

### 故障排查

```bash
# 查看所有服务状态
./manage.sh status

# 健康检查
./manage.sh health

# 查看日志
./manage.sh logs

# 重启PM2服务
./manage.sh pm2:restart
```

## 注意事项

1. **权限要求**：
   - 部署命令需要sudo权限（用于操作Nginx）
   - PM2命令可能需要适当的用户权限

2. **端口占用**：
   - 开发环境：前端5173，后端3000
   - 生产环境：后端3000，前端由Nginx提供（80/443）

3. **文件路径**：
   - 脚本会自动检测项目结构
   - 日志文件存储在`logs/`目录
   - 运行时文件存储在`runtime/`目录

4. **依赖要求**：
   - Node.js 18+
   - npm
   - PM2（脚本会自动安装）
   - Nginx（用于生产环境）

## 故障排除

### 常见问题

1. **端口被占用**：
   ```bash
   ./manage.sh stop    # 停止所有服务
   ./manage.sh status  # 检查状态
   ```

2. **PM2服务异常**：
   ```bash
   ./manage.sh pm2:status   # 查看PM2状态
   ./manage.sh pm2:logs     # 查看PM2日志
   ./manage.sh pm2:restart  # 重启PM2服务
   ```

3. **前端部署失败**：
   ```bash
   ./manage.sh build --frontend-only  # 重新构建前端
   ./manage.sh deploy:frontend        # 重新部署前端
   ```

4. **健康检查失败**：
   ```bash
   ./manage.sh status  # 查看服务状态
   ./manage.sh logs    # 查看详细日志
   ```

### 日志位置

- 开发环境日志：`logs/backend.log`, `logs/frontend.log`
- PM2日志：通过`./manage.sh pm2:logs`查看
- Nginx日志：`/var/log/nginx/`

## 最佳实践

1. **开发流程**：
   ```bash
   ./manage.sh quick-start  # 开始开发
   # 进行开发工作
   ./manage.sh test         # 运行测试
   ./manage.sh stop         # 结束开发
   ```

2. **部署流程**：
   ```bash
   git add . && git commit -m "更新内容"
   git push origin main
   ./manage.sh deploy       # 部署到生产环境
   ./manage.sh health       # 验证部署
   ```

3. **监控维护**：
   ```bash
   ./manage.sh pm2:save     # 定期保存PM2配置
   ./manage.sh status       # 定期检查状态
   ./manage.sh health       # 定期健康检查
   ```

---

**提示**：使用`./manage.sh --help`可以随时查看命令帮助信息。 