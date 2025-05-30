# Render部署登录问题修复指南

## 问题描述

部署到Render后，使用测试账户登录时出现"手机号或密码错误"的提示。

## 问题原因

1. **密码哈希不匹配**: 代码中的初始用户数据使用了错误的密码哈希值
2. **数据库未更新**: Render上的数据库仍然使用旧的密码哈希
3. **本地vs生产环境差异**: 本地手动修复了密码，但代码中的哈希值未更新

## 解决方案

### 步骤1: 更新密码哈希（已完成）

已更新 `backend/src/config/database.ts` 中的密码哈希：

```typescript
// 正确的密码哈希值
{
  phone: 'admin',
  password: '$2a$10$5Yge6MXqtSAHvFuhIDnwGOYk/vjD366QbUByjit/4yL2HDHsiojnm', // admin
},
{
  phone: '13800138000', 
  password: '$2a$10$8Dj9C.RwL7dLorzT/p8Q3e5vH83KQbcOB7FN1sW9zZiRKSgr0NCyy', // password123
},
{
  phone: 'property_phone_01',
  password: '$2a$10$qoBKfGUObEwe1TWKJE3lJeKkHCsaJoO7ABQypvMNOfTTkYnCBL2ee', // property123
}
```

### 步骤2: 重置数据库（已完成）

运行了数据库重置脚本：
```bash
./scripts/reset-production-db.sh
```

### 步骤3: 重新部署到Render

1. **提交更改到Git**:
   ```bash
   git add .
   git commit -m "fix: 修复Render部署后的登录问题 - 更新正确的密码哈希"
   ```

2. **推送到GitHub**:
   ```bash
   git push origin main
   ```

3. **Render自动重新部署**: 
   - Render会检测到代码更改并自动重新部署
   - 新的部署会使用正确的密码哈希创建数据库

### 步骤4: 验证修复

部署完成后，使用以下账户测试登录：

| 账户类型 | 手机号 | 密码 |
|---------|--------|------|
| 超级管理员 | `admin` | `admin` |
| 普通用户 | `13800138000` | `password123` |
| 物业管理 | `property_phone_01` | `property123` |
| 管理员 | `admin_phone_01` | `admin123` |

## 技术细节

### 密码哈希生成

使用bcrypt生成的哈希值：
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('password', 10);
```

### 数据库初始化逻辑

在 `backend/src/config/database.ts` 中：
- 检查用户表是否为空
- 如果为空，插入初始用户数据
- 使用正确的密码哈希值

### 验证登录流程

1. 用户提交登录表单
2. 后端接收手机号和明文密码
3. 查询数据库获取用户记录
4. 使用bcrypt比较明文密码和存储的哈希值
5. 如果匹配，生成JWT令牌并返回

## 预防措施

1. **密码哈希一致性**: 确保代码中的哈希值与实际密码匹配
2. **环境同步**: 本地修改需要同步到代码中
3. **测试验证**: 部署前在本地验证所有测试账户
4. **文档更新**: 及时更新登录凭据文档

## 故障排除

如果登录仍然失败：

1. **检查Render日志**:
   - 在Render控制台查看部署日志
   - 检查是否有数据库初始化错误

2. **验证密码哈希**:
   ```bash
   # 在本地测试密码验证
   node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.compareSync('admin', '$2a$10$5Yge6MXqtSAHvFuhIDnwGOYk/vjD366QbUByjit/4yL2HDHsiojnm'));"
   ```

3. **强制重新部署**:
   - 在Render控制台手动触发重新部署
   - 确保使用最新的代码版本

4. **数据库检查**:
   - 如果可能，连接到Render的数据库检查用户数据
   - 验证密码哈希值是否正确存储

## 联系支持

如果问题持续存在，请提供：
- Render部署日志
- 登录尝试的具体错误信息
- 使用的账户和密码
- 浏览器开发者工具中的网络请求详情 