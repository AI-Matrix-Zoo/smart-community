# 智慧小区生活平台 - 测试账户

## 登录凭据

以下是系统中预设的测试账户，您可以使用这些凭据登录系统：

### 超级管理员
- **手机号**: `admin`
- **密码**: `admin`
- **权限**: 完整的系统管理权限，可以管理用户、删除内容、发布公告等

### 管理员
- **手机号**: `admin_phone_01`
- **密码**: `admin123`
- **权限**: 管理员权限

### 物业管理员
- **手机号**: `property_phone_01`
- **密码**: `property123`
- **权限**: 物业管理权限，可以处理建议反馈、发布公告等

### 普通用户 - 张三
- **手机号**: `13800138000`
- **密码**: `password123`
- **权限**: 普通用户权限，可以发布建议、二手物品等

### 普通用户 - 李四
- **手机号**: `13900139000`
- **密码**: `password123`
- **权限**: 普通用户权限

## 快速测试

1. **管理员功能测试**: 使用 `admin` / `admin` 登录，可以访问管理后台
2. **普通用户功能测试**: 使用 `13800138000` / `password123` 登录，可以发布建议和二手物品
3. **物业功能测试**: 使用 `property_phone_01` / `property123` 登录，可以处理用户建议

## 部署后验证

在Render部署后，请使用以上凭据进行测试：
- 确保所有账户都能正常登录
- 验证不同角色的权限功能
- 测试数据的创建和同步

## 注意事项

- 这些是测试账户，仅用于开发和演示
- 在生产环境中，请删除或更改这些默认账户
- 所有密码都已经过 bcrypt 加密存储在数据库中
- **重要**: 部署后如果登录失败，可能需要重新部署以更新数据库

## 功能权限说明

| 功能 | 普通用户 | 物业 | 管理员 |
|------|----------|------|--------|
| 查看公告 | ✅ | ✅ | ✅ |
| 发布建议 | ✅ | ✅ | ✅ |
| 处理建议 | ❌ | ✅ | ✅ |
| 发布公告 | ❌ | ✅ | ✅ |
| 用户管理 | ❌ | ❌ | ✅ |
| 删除内容 | ❌ | ❌ | ✅ |
| 二手市场 | ✅ | ✅ | ✅ |

## 故障排除

如果部署后登录失败：
1. 检查后端日志是否有错误信息
2. 确认数据库初始化是否成功
3. 验证密码哈希是否正确生成
4. 可能需要重新部署以更新数据库结构 