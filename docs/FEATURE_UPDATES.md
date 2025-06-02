# 📱 功能更新文档

## 🎯 本次更新内容

### 1. 手机号注册功能

#### 🔧 技术实现
- **后端集成Twilio短信服务**
  - 安装并配置Twilio SDK
  - 创建短信服务模块 `backend/src/services/smsService.ts`
  - 支持中国大陆手机号格式验证
  - 自动添加+86国际区号

#### 📝 配置要求
在后端环境变量中添加：
```bash
# Twilio短信服务配置
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# 短信服务配置
SMS_ENABLED=true
SMS_PROVIDER=twilio
```

#### 🎨 前端优化
- 注册页面支持邮箱或手机号注册
- 自动检测输入类型（邮箱/手机号）
- 统一的验证码发送界面
- 倒计时防重复发送

#### 🔄 API更新
- `POST /api/auth/send-verification-code` - 支持邮箱和短信
- `POST /api/auth/register` - 支持identifier字段（邮箱或手机号）
- `POST /api/auth/login` - 支持邮箱或手机号登录

### 2. 开发环境隔离

#### 🛠️ 开发环境管理脚本
创建了 `dev-manager.sh` 脚本，实现开发和生产环境完全隔离：

**端口配置：**
- 开发环境前端：5174
- 开发环境后端：3001
- 生产环境前端：5173 (Nginx)
- 生产环境后端：3000

**数据库隔离：**
- 开发环境：`backend/database/community_dev.db`
- 生产环境：`backend/data/community.db`

#### 📋 使用方法
```bash
# 安装依赖
./dev-manager.sh install

# 初始化开发环境
./dev-manager.sh init

# 启动开发环境
./dev-manager.sh start

# 查看状态
./dev-manager.sh status

# 停止开发环境
./dev-manager.sh stop

# 清理开发环境
./dev-manager.sh clean
```

#### 🔧 配置文件
- 开发环境后端：`backend/.env.development`
- 开发环境前端：`frontend/.env.development`
- 生产环境：使用现有配置

### 3. 用户管理后台优化

#### 🐛 问题修复
- **后端查询修复**：添加缺失的 `email` 和 `unit` 字段
- **前端表格优化**：分离楼栋、单元、房号为独立列
- **数据显示修复**：正确显示用户的联系方式和住址信息

#### 🎨 界面改进
- 新增"单元号"列
- "邮箱"列改为"联系方式"列，显示邮箱或手机号
- 楼栋、单元、房号分别显示，避免N/A问题
- 更清晰的表格布局

#### 📊 表格结构
| 列名 | 显示内容 | 说明 |
|------|----------|------|
| ID | 用户ID | 系统生成的唯一标识 |
| 姓名 | 用户姓名 | 显示名称 |
| 联系方式 | 邮箱或手机号 | 优先显示邮箱，其次手机号 |
| 角色 | 用户角色 | ADMIN/PROPERTY/USER |
| 楼栋 | 楼栋信息 | 如：1栋 |
| 单元 | 单元信息 | 如：1单元 |
| 房号 | 房号信息 | 如：101 |
| 操作 | 编辑/删除 | 管理操作按钮 |

## 🔄 数据库更新

### 用户表结构
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  phone TEXT,           -- 手机号（新增支持）
  email TEXT,           -- 邮箱
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  building TEXT,        -- 楼栋
  unit TEXT,           -- 单元号
  room TEXT,           -- 房号
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(phone),
  UNIQUE(email)
);
```

## 🚀 部署说明

### 生产环境部署
```bash
# 正常部署（不影响开发环境）
./manage.sh deploy
```

### 开发环境使用
```bash
# 初始化开发环境
./dev-manager.sh init

# 启动开发环境
./dev-manager.sh start

# 访问开发环境
# 前端：http://localhost:5174
# 后端：http://localhost:3001
```

## 📱 短信服务配置

### Twilio配置步骤
1. 注册Twilio账户
2. 获取Account SID和Auth Token
3. 购买Twilio电话号码
4. 在环境变量中配置相关信息

### 开发环境测试
- 开发环境下短信服务会使用Mock模式
- 验证码会在控制台输出，方便测试
- 生产环境需要配置真实的Twilio凭据

## 🔧 技术栈更新

### 新增依赖
- **后端**：`twilio` - Twilio SDK
- **前端**：无新增依赖

### 类型定义更新
- 支持 `identifier` 字段（邮箱或手机号）
- 验证类型支持 `'email' | 'sms'`
- 用户类型完善 `phone` 和 `unit` 字段

## 🎯 下一步计划

1. **短信模板优化**：自定义短信内容和格式
2. **国际化支持**：支持更多国家的手机号格式
3. **验证码安全**：添加频率限制和IP限制
4. **用户体验**：优化注册流程和错误提示
5. **监控告警**：添加短信发送状态监控

## 📞 联系支持

如有问题，请联系开发团队或查看相关文档：
- 开发环境管理：`./dev-manager.sh help`
- 生产环境管理：`./manage.sh help`
- 项目文档：`docs/` 目录 