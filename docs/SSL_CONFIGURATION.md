# 🔒 SSL证书配置指南

## 📋 配置概述

智慧moma生活平台已成功配置HTTPS支持，提供安全的加密连接。

## 🌐 访问地址

- **HTTPS地址**: https://www.moma.lol
- **HTTP地址**: http://www.moma.lol (自动重定向到HTTPS)

## 🔐 SSL证书信息

### 当前配置
- **证书类型**: 自签名证书（用于测试）
- **证书位置**: `/etc/nginx/ssl/smart-community.crt`
- **私钥位置**: `/etc/nginx/ssl/smart-community.key`
- **有效期**: 365天
- **加密算法**: RSA 2048位

### 证书详情
```
Subject: C=CN, ST=Beijing, L=Beijing, O=Smart Community, OU=IT Department, CN=www.moma.lol
Issuer: C=CN, ST=Beijing, L=Beijing, O=Smart Community, OU=IT Department, CN=www.moma.lol
Valid from: 2025-06-01
Valid to: 2026-06-01
```

## 🛡️ 安全配置

### SSL协议
- 支持 TLS 1.2 和 TLS 1.3
- 禁用不安全的SSL/TLS版本

### 加密套件
```
ECDHE-RSA-AES128-GCM-SHA256
ECDHE-RSA-AES256-GCM-SHA384
ECDHE-RSA-AES128-SHA256
ECDHE-RSA-AES256-SHA384
```

### 安全头
- `Strict-Transport-Security`: 强制HTTPS访问
- `X-Frame-Options`: 防止点击劫持
- `X-Content-Type-Options`: 防止MIME类型嗅探
- `X-XSS-Protection`: XSS保护

## 🔄 HTTP到HTTPS重定向

所有HTTP请求会自动重定向到HTTPS，确保所有通信都是加密的。

## ⚠️ 浏览器警告

由于使用的是自签名证书，浏览器会显示安全警告。这是正常现象，可以选择"继续访问"。

### 解决方案
1. **生产环境推荐**: 使用Let's Encrypt免费证书
2. **企业环境**: 购买商业SSL证书
3. **开发测试**: 在浏览器中添加证书例外

## 🔄 自动续期配置

### 续期脚本
已配置自动续期脚本：`/root/renew-ssl.sh`

### Crontab任务
```bash
# 每周日凌晨2点检查证书续期
0 2 * * 0 /root/renew-ssl.sh
```

### 续期日志
续期日志保存在：`/var/log/ssl-renewal.log`

## 🚀 升级到正式SSL证书

### 使用Let's Encrypt（推荐）

1. **域名已配置**: www.moma.lol 和 moma.lol
2. **DNS解析**: 已正确指向服务器IP 123.56.64.5
3. **ACME挑战**: 已配置支持 `/.well-known/acme-challenge/`

**手动申请证书**:
```bash
# 停止nginx
systemctl stop nginx

# 申请证书
certbot certonly --standalone -d www.moma.lol -d moma.lol --non-interactive --agree-tos --email admin@moma.lol

# 复制证书到nginx目录
cp /etc/letsencrypt/live/www.moma.lol/fullchain.pem /etc/nginx/ssl/smart-community.crt
cp /etc/letsencrypt/live/www.moma.lol/privkey.pem /etc/nginx/ssl/smart-community.key

# 重启nginx
systemctl start nginx
```

### 使用商业证书

1. 生成CSR（证书签名请求）
2. 向CA机构申请证书
3. 下载证书文件
4. 更新nginx配置

## 🔧 配置文件位置

- **Nginx配置**: `/etc/nginx/conf.d/smart-community.conf`
- **SSL证书**: `/etc/nginx/ssl/smart-community.crt`
- **SSL私钥**: `/etc/nginx/ssl/smart-community.key`
- **配置备份**: `/etc/nginx/conf.d/smart-community.conf.backup`
- **续期脚本**: `/root/renew-ssl.sh`

## 📊 SSL测试

### 本地测试
```bash
# 测试HTTPS连接
curl -k -I https://www.moma.lol

# 查看证书信息
openssl x509 -in /etc/nginx/ssl/smart-community.crt -text -noout

# 测试SSL配置
openssl s_client -connect www.moma.lol:443 -servername www.moma.lol

# 检查证书到期时间
openssl x509 -in /etc/nginx/ssl/smart-community.crt -noout -dates
```

### 在线测试
- SSL Labs: https://www.ssllabs.com/ssltest/
- SSL Checker: https://www.sslshopper.com/ssl-checker.html

## 🔄 维护操作

### 手动续期检查
```bash
# 执行续期脚本
/root/renew-ssl.sh

# 查看续期日志
tail -f /var/log/ssl-renewal.log
```

### 重新生成自签名证书
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/smart-community.key \
  -out /etc/nginx/ssl/smart-community.crt \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=Smart Community/OU=IT Department/CN=www.moma.lol"
```

### 重新加载nginx配置
```bash
nginx -t && systemctl reload nginx
```

## 📝 注意事项

1. **自签名证书限制**
   - 浏览器会显示安全警告
   - 不被公共CA信任
   - 仅适用于测试和内部使用

2. **生产环境建议**
   - 使用Let's Encrypt免费证书
   - 配置自动续期
   - 定期检查证书状态

3. **安全最佳实践**
   - 定期更新SSL证书
   - 使用强加密算法
   - 启用HSTS
   - 定期安全审计

## 🎯 下一步

1. ✅ 域名配置完成
2. ✅ 自动续期已配置
3. 🔄 可尝试申请Let's Encrypt正式证书
4. 📊 定期监控证书状态

---

**配置完成时间**: 2025-06-01  
**配置状态**: ✅ 已启用HTTPS  
**访问地址**: https://www.moma.lol  
**自动续期**: ✅ 已配置 