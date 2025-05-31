# 邮箱验证码服务配置指南

## 概述

本指南将帮助您配置邮箱验证码服务，为智慧小区平台添加邮箱验证功能。

## 1. 支持的邮箱服务商

### 1.1 QQ邮箱（推荐）
- **SMTP服务器**: smtp.qq.com
- **端口**: 587 (STARTTLS) 或 465 (SSL)
- **安全性**: 支持
- **费用**: 免费

### 1.2 163邮箱
- **SMTP服务器**: smtp.163.com
- **端口**: 587 或 465
- **安全性**: 支持
- **费用**: 免费

### 1.3 Gmail
- **SMTP服务器**: smtp.gmail.com
- **端口**: 587 或 465
- **安全性**: 支持
- **费用**: 免费（需要应用专用密码）

## 2. QQ邮箱配置步骤

### 2.1 开启SMTP服务
1. 登录QQ邮箱 (mail.qq.com)
2. 点击"设置" → "账户"
3. 找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
4. 开启"IMAP/SMTP服务"
5. 按照提示发送短信验证
6. 获取授权码（16位字符）

### 2.2 记录配置信息
- **邮箱地址**: your-email@qq.com
- **授权码**: 16位授权码（不是QQ密码）
- **SMTP服务器**: smtp.qq.com
- **端口**: 587

## 3. 环境变量配置

### 3.1 创建环境配置文件
在 `backend/.env` 文件中添加：

```bash
# 邮箱服务配置
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@qq.com
EMAIL_PASS=your-16-digit-auth-code
EMAIL_FROM=智慧小区 <your-email@qq.com>
EMAIL_ENABLED=true
```

### 3.2 参数说明
- `EMAIL_HOST`: SMTP服务器地址
- `EMAIL_PORT`: SMTP端口号
- `EMAIL_SECURE`: 是否使用SSL（587端口用false，465端口用true）
- `EMAIL_USER`: 发送邮箱地址
- `EMAIL_PASS`: 邮箱授权码（不是登录密码）
- `EMAIL_FROM`: 发件人显示名称
- `EMAIL_ENABLED`: 是否启用真实邮箱服务

## 4. 测试配置

### 4.1 开发环境测试
```bash
# 设置为模拟模式
EMAIL_ENABLED=false

# 验证码会在控制台显示
```

### 4.2 生产环境测试
```bash
# 启用真实邮箱服务
EMAIL_ENABLED=true

# 使用真实邮箱地址测试
curl -X POST http://your-domain/api/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","type":"email"}'
```

## 5. 邮件模板

### 5.1 验证码邮件特性
- 🎨 **美观设计**: 现代化的HTML邮件模板
- 🔐 **安全提醒**: 包含有效期和安全提示
- 📱 **响应式**: 支持手机和电脑查看
- 🕒 **时间戳**: 显示发送时间

### 5.2 邮件内容包含
- 智慧小区品牌标识
- 6位数字验证码（大字体显示）
- 5分钟有效期提醒
- 安全使用提示
- 发送时间戳

## 6. 安全建议

### 6.1 授权码安全
- 不要在代码中硬编码授权码
- 使用环境变量存储敏感信息
- 定期更换授权码
- 不要将授权码提交到版本控制

### 6.2 发送频率限制
- 同一邮箱每分钟最多发送1次
- 同一IP每小时最多发送10次
- 实现验证码缓存机制
- 记录发送日志

### 6.3 验证码安全
- 6位随机数字
- 5分钟有效期
- 验证成功后立即失效
- 防止暴力破解

## 7. 故障排除

### 7.1 常见错误

#### 535 Authentication failed
- 检查邮箱地址是否正确
- 确认使用的是授权码而不是登录密码
- 验证SMTP服务是否已开启

#### Connection timeout
- 检查网络连接
- 确认SMTP服务器地址和端口
- 检查防火墙设置

#### Invalid login
- 确认邮箱服务商的SMTP设置
- 检查授权码是否过期
- 尝试重新生成授权码

### 7.2 调试方法
```bash
# 查看邮箱服务日志
pm2 logs smart-community-backend | grep "邮箱"

# 测试邮箱连接
# 系统启动时会自动测试连接
```

## 8. 监控和运维

### 8.1 监控指标
- 邮件发送成功率
- 验证码验证成功率
- 发送响应时间
- 错误率统计

### 8.2 日志记录
```bash
# 邮件发送日志
✅ 邮箱验证码已发送到: user@example.com
❌ 邮箱验证码发送失败: [错误信息]

# 验证码验证日志
✅ 验证码验证成功: user@example.com
❌ 验证码验证失败: user@example.com
```

## 9. 成本优化

### 9.1 免费邮箱服务限制
- QQ邮箱：每天500封
- 163邮箱：每天200封
- Gmail：每天100封

### 9.2 企业邮箱推荐
- 腾讯企业邮箱
- 阿里云邮箱推送
- SendGrid
- Mailgun

## 10. 示例配置

### 10.1 QQ邮箱完整配置
```bash
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=smartcommunity2025@qq.com
EMAIL_PASS=abcdefghijklmnop
EMAIL_FROM=智慧小区 <smartcommunity2025@qq.com>
EMAIL_ENABLED=true
```

### 10.2 Gmail配置
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=smartcommunity2025@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=Smart Community <smartcommunity2025@gmail.com>
EMAIL_ENABLED=true
```

---

**注意**: 
1. 请使用专门的邮箱账户用于发送验证码
2. 定期检查邮箱服务状态
3. 建议设置邮件发送监控告警
4. 生产环境建议使用企业级邮箱服务 