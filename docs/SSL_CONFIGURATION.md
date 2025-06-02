# 🔒 SSL证书配置指南

## 📋 配置概述

智慧moma生活平台当前配置为HTTP访问模式，已准备好SSL证书支持，可随时升级到HTTPS。

## 🌐 访问地址

- **HTTP地址**: http://www.moma.lol
- **备用地址**: http://moma.lol
- **HTTPS地址**: 暂时禁用（可随时启用）

## 🔐 SSL证书信息

### 当前状态
- **访问模式**: HTTP（无SSL警告）
- **证书准备**: 自签名证书已生成
- **证书位置**: `/etc/nginx/ssl/smart-community.crt`
- **私钥位置**: `/etc/nginx/ssl/smart-community.key`
- **ACME支持**: 已配置Let's Encrypt验证路径

### 证书详情
```
Subject: C=CN, ST=Beijing, L=Beijing, O=Smart Community, OU=IT Department, CN=www.moma.lol
Issuer: C=CN, ST=Beijing, L=Beijing, O=Smart Community, OU=IT Department, CN=www.moma.lol
Valid from: 2025-06-01
Valid to: 2026-06-01
```

## 🌐 当前访问模式：HTTP

### 优势
- ✅ 无浏览器SSL警告
- ✅ 访问速度快
- ✅ 配置简单
- ✅ 兼容性好

### 适用场景
- 内网环境
- 开发测试
- 演示展示
- 对安全要求不高的应用

## 🛡️ SSL准备就绪

虽然当前使用HTTP，但SSL证书和配置已准备完毕：

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

## 🔄 快速启用HTTPS

如需启用HTTPS，只需几个简单步骤：

### 方法1：启用自签名证书HTTPS

```bash
# 备份当前HTTP配置
cp /etc/nginx/conf.d/smart-community.conf /etc/nginx/conf.d/smart-community-http-backup.conf

# 创建HTTPS配置
cat > /etc/nginx/conf.d/smart-community.conf << 'EOF'
# HTTP重定向
server {
    listen 80;
    server_name www.moma.lol moma.lol;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS服务器
server {
    listen 443 ssl http2;
    server_name www.moma.lol moma.lol;
    
    ssl_certificate /etc/nginx/ssl/smart-community.crt;
    ssl_certificate_key /etc/nginx/ssl/smart-community.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    client_max_body_size 50M;
    
    location / {
        root /root/smart-community/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_Set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_Set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_Set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 重新加载配置
nginx -t && systemctl reload nginx
```

### 方法2：获取Let's Encrypt正式证书

参考 `docs/SSL_CROSS_SERVER_GUIDE.md` 中的跨服务器获取方法。

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

## 🔧 配置文件位置

- **Nginx配置**: `/etc/nginx/conf.d/smart-community.conf`
- **SSL证书**: `/etc/nginx/ssl/smart-community.crt`
- **SSL私钥**: `/etc/nginx/ssl/smart-community.key`
- **配置备份**: `/etc/nginx/conf.d/smart-community.conf.backup`
- **续期脚本**: `/root/renew-ssl.sh`

## 📊 测试方法

### HTTP测试
```bash
# 测试HTTP连接
curl -I http://www.moma.lol

# 测试API接口
curl http://www.moma.lol/api/health

# 检查响应时间
time curl -s http://www.moma.lol > /dev/null
```

### SSL准备测试
```bash
# 查看证书信息
openssl x509 -in /etc/nginx/ssl/smart-community.crt -text -noout

# 检查证书到期时间
openssl x509 -in /etc/nginx/ssl/smart-community.crt -noout -dates

# 测试SSL配置（如果启用HTTPS）
openssl s_client -connect www.moma.lol:443 -servername www.moma.lol
```

## 🔄 维护操作

### 切换到HTTPS模式
```bash
# 使用上面的方法1配置
```

### 切换回HTTP模式
```bash
# 恢复HTTP配置
cp /etc/nginx/conf.d/smart-community-http-backup.conf /etc/nginx/conf.d/smart-community.conf
nginx -t && systemctl reload nginx
```

### 重新生成自签名证书
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/smart-community.key \
  -out /etc/nginx/ssl/smart-community.crt \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=Smart Community/OU=IT Department/CN=www.moma.lol"
```

## 📝 注意事项

1. **HTTP模式特点**
   - 数据传输未加密
   - 适合内网或测试环境
   - 无浏览器安全警告
   - 访问速度较快

2. **安全建议**
   - 生产环境建议使用HTTPS
   - 敏感数据传输需要加密
   - 定期评估安全需求

3. **升级策略**
   - 可随时切换到HTTPS
   - SSL证书已准备就绪
   - 支持Let's Encrypt正式证书

## 🎯 当前状态

1. ✅ HTTP访问正常
2. ✅ 域名配置完成
3. ✅ SSL证书已准备
4. ✅ 自动续期已配置
5. 🔄 可随时启用HTTPS

---

**配置完成时间**: 2025-06-01  
**当前状态**: ✅ HTTP访问模式  
**访问地址**: http://www.moma.lol  
**SSL准备**: ✅ 随时可启用