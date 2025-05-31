# 项目结构更新说明

## 📁 文件组织优化

### 新增文件夹结构
```
智慧小区生活平台/
├── docs/                  # 📚 项目文档
│   ├── DEMO_ACCOUNTS.md   # 演示账户说明
│   ├── USER_GUIDE.md      # 用户使用指南
│   ├── EMAIL_SETUP_GUIDE.md # 邮箱配置指南
│   └── SMS_SETUP_GUIDE.md # 短信配置指南（备用）
├── tests/                 # 🧪 测试脚本
│   ├── test-email-only-registration.sh # 邮箱注册测试
│   ├── test-real-email.sh # 真实邮箱测试
│   ├── test-smtp.js       # SMTP连接测试
│   └── test-api.js        # API接口测试
├── frontend/              # 前端项目
├── backend/               # 后端项目
└── README.md              # 主要说明文档
```

## 🔄 功能更新

### 用户认证系统简化
- ❌ **移除**: 手机号验证注册
- ✅ **保留**: 邮箱验证注册
- ✅ **保留**: 邮箱登录
- ✅ **保留**: JWT token认证

### 前端更新
- 简化注册页面，移除验证方式选择
- 只保留邮箱输入和验证码功能
- 更新类型定义，移除手机号相关字段

### 后端更新
- 简化认证路由，移除手机号验证逻辑
- 更新数据库模型，邮箱为必填字段
- 保留邮箱服务功能

## 📋 类型定义更新

### 前端类型 (frontend/src/types.ts)
```typescript
export interface RegistrationData {
  email: string;                    // 必填
  password: string;
  name: string;
  building: string;
  unit: string;
  room: string;
  verificationCode: string;
  verificationType: 'email';        // 固定为email
}
```

### 后端类型 (backend/src/types/index.ts)
```typescript
export interface RegisterRequest {
  email: string;                    // 必填
  password: string;
  name: string;
  building: string;
  unit: string;
  room: string;
  verificationCode: string;
  verificationType: 'email';        // 固定为email
}

export interface SendVerificationCodeRequest {
  identifier: string;               // 邮箱地址
  type: 'email';                   // 固定为email
}
```

## 🗄️ 数据库结构

### 用户表更新
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,      -- 邮箱（必填，唯一）
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  building TEXT,                   -- 楼栋
  unit TEXT,                       -- 单元号
  room TEXT,                       -- 房间号
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🧪 测试脚本

### 新增测试
- `test-email-only-registration.sh`: 专门测试邮箱注册流程
- 支持手动输入验证码（生产环境）
- 完整的注册→登录流程验证

### 测试运行
```bash
# 邮箱注册功能测试
./tests/test-email-only-registration.sh

# SMTP连接测试
node tests/test-smtp.js

# API接口测试
node tests/test-api.js
```

## 📚 文档组织

### docs/ 文件夹内容
- **DEMO_ACCOUNTS.md**: 演示账户信息（不在前端显示）
- **USER_GUIDE.md**: 用户使用指南
- **EMAIL_SETUP_GUIDE.md**: 邮箱服务配置指南
- **SMS_SETUP_GUIDE.md**: 短信服务配置（备用）

### 文档特点
- 详细的配置步骤
- 安全注意事项
- 故障排除指南
- 最佳实践建议

## 🔐 安全改进

### 演示账户管理
- 演示账户信息不在前端显示
- 详细的安全说明文档
- 生产环境部署检查清单

### 验证码安全
- 5分钟有效期
- 验证成功后自动删除
- 防暴力破解机制

## 🚀 部署注意事项

### 环境变量检查
```bash
# 必需的邮箱服务配置
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@qq.com
EMAIL_PASS=your-auth-code
EMAIL_FROM=your-email@qq.com
EMAIL_ENABLED=true
```

### 构建和部署
```bash
# 重新构建项目
cd frontend && npm run build
cd ../backend && npm run build

# 重启服务
pm2 restart smart-community-backend
sudo systemctl reload nginx
```

## 📈 性能优化

### 代码简化
- 移除不必要的手机号验证逻辑
- 简化前端组件结构
- 减少类型定义复杂度

### 用户体验
- 更简洁的注册流程
- 清晰的错误提示
- 统一的验证方式

---

**更新完成时间**: 2025-05-31  
**主要改进**: 简化认证系统，优化文件组织，完善文档结构 