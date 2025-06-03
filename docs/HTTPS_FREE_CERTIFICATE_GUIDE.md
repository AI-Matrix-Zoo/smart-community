# 本机获取HTTPS免费证书完整指南

## 概述

本指南将详细介绍如何在本机环境中获取和配置HTTPS免费证书，包括开发环境和生产环境的多种解决方案。

## 目录

1. [开发环境解决方案](#开发环境解决方案)
2. [生产环境解决方案](#生产环境解决方案)
3. [自签名证书](#自签名证书)
4. [Let's Encrypt证书](#lets-encrypt证书)
5. [mkcert工具](#mkcert工具)
6. [证书配置示例](#证书配置示例)
7. [常见问题解决](#常见问题解决)

## 开发环境解决方案

### 1. mkcert - 推荐方案

mkcert是一个简单的工具，用于制作本地信任的开发证书。

#### 安装mkcert

**macOS:**
```bash
# 使用Homebrew安装
brew install mkcert
brew install nss # 如果使用Firefox

# 或使用MacPorts
sudo port selfupdate
sudo port install mkcert
```

**Windows:**
```bash
# 使用Chocolatey
choco install mkcert

# 或使用Scoop
scoop bucket add extras
scoop install mkcert
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install libnss3-tools
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v*-linux-amd64
chmod +x mkcert
sudo mv mkcert /usr/local/bin/

# 或使用包管理器
sudo apt install mkcert  # Ubuntu 20.04+
```

#### 使用mkcert生成证书

```bash
# 1. 安装本地CA
mkcert -install

# 2. 生成localhost证书
mkcert localhost 127.0.0.1 ::1

# 3. 生成自定义域名证书
mkcert example.com "*.example.com" localhost 127.0.0.1

# 4. 生成特定域名证书
mkcert myapp.local
```

生成的文件：
- `localhost+2.pem` - 证书文件
- `localhost+2-key.pem` - 私钥文件

### 2. 自签名证书

#### 使用OpenSSL生成自签名证书

```bash
# 1. 生成私钥
openssl genrsa -out localhost.key 2048

# 2. 生成证书签名请求
openssl req -new -key localhost.key -out localhost.csr

# 3. 生成自签名证书
openssl x509 -req -days 365 -in localhost.csr -signkey localhost.key -out localhost.crt

# 或一步生成
openssl req -x509 -newkey rsa:4096 -keyout localhost.key -out localhost.crt -days 365 -nodes
```

#### 配置文件方式生成

创建配置文件 `localhost.conf`：
```ini
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=CN
ST=Beijing
L=Beijing
O=Development
OU=IT Department
CN=localhost

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
```

使用配置文件生成证书：
```bash
openssl req -x509 -newkey rsa:2048 -keyout localhost.key -out localhost.crt -days 365 -nodes -config localhost.conf -extensions v3_req
```

## 生产环境解决方案

### 1. Let's Encrypt - 免费SSL证书

#### 使用Certbot

**安装Certbot:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot

# CentOS/RHEL
sudo yum install certbot

# macOS
brew install certbot
```

**获取证书:**
```bash
# 独立模式（需要停止Web服务器）
sudo certbot certonly --standalone -d yourdomain.com

# Webroot模式（Web服务器继续运行）
sudo certbot certonly --webroot -w /var/www/html -d yourdomain.com

# Nginx插件
sudo certbot --nginx -d yourdomain.com

# Apache插件
sudo certbot --apache -d yourdomain.com
```

**自动续期:**
```bash
# 测试续期
sudo certbot renew --dry-run

# 设置自动续期（添加到crontab）
0 12 * * * /usr/bin/certbot renew --quiet
```

#### 使用acme.sh

```bash
# 安装acme.sh
curl https://get.acme.sh | sh

# 获取证书
acme.sh --issue -d yourdomain.com --webroot /var/www/html

# 安装证书
acme.sh --install-cert -d yourdomain.com \
--key-file /path/to/keyfile/in/nginx/key.pem \
--fullchain-file /path/to/fullchain/nginx/cert.pem \
--reloadcmd "service nginx force-reload"
```

### 2. 云服务商免费证书

#### 阿里云免费证书
1. 登录阿里云控制台
2. 进入SSL证书服务
3. 选择免费证书
4. 填写域名信息
5. 完成域名验证
6. 下载证书

#### 腾讯云免费证书
1. 登录腾讯云控制台
2. 进入SSL证书管理
3. 申请免费证书
4. 域名验证
5. 下载证书

## 证书配置示例

### Node.js/Express配置

```javascript
const https = require('https');
const fs = require('fs');
const express = require('express');

const app = express();

// 读取证书文件
const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem')
};

// 创建HTTPS服务器
https.createServer(options, app).listen(443, () => {
  console.log('HTTPS Server running on port 443');
});

// 重定向HTTP到HTTPS
const http = require('http');
http.createServer((req, res) => {
  res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
  res.end();
}).listen(80);
```

### Nginx配置

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.pem;
    ssl_certificate_key /path/to/private-key.pem;
    
    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
    
    location / {
        root /var/www/html;
        index index.html index.htm;
    }
}
```

### Apache配置

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    Redirect permanent / https://yourdomain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    DocumentRoot /var/www/html
    
    SSLEngine on
    SSLCertificateFile /path/to/certificate.pem
    SSLCertificateKeyFile /path/to/private-key.pem
    
    # SSL配置
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256
    SSLHonorCipherOrder off
    
    # HSTS
    Header always set Strict-Transport-Security "max-age=63072000"
</VirtualHost>
```

### Docker配置

```dockerfile
# Dockerfile
FROM nginx:alpine

# 复制证书文件
COPY certificates/ /etc/nginx/ssl/
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./certificates:/etc/nginx/ssl:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

## 开发环境快速设置

### 使用mkcert的完整流程

```bash
# 1. 安装mkcert
brew install mkcert  # macOS

# 2. 安装本地CA
mkcert -install

# 3. 生成证书
mkcert localhost 127.0.0.1 ::1

# 4. 移动证书到项目目录
mkdir -p ssl
mv localhost+2.pem ssl/cert.pem
mv localhost+2-key.pem ssl/key.pem
```

### 在项目中使用

```javascript
// server.js
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();

// 开发环境HTTPS配置
if (process.env.NODE_ENV === 'development') {
  const options = {
    key: fs.readFileSync(path.join(__dirname, 'ssl/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl/cert.pem'))
  };
  
  https.createServer(options, app).listen(3000, () => {
    console.log('HTTPS Server running on https://localhost:3000');
  });
} else {
  app.listen(3000, () => {
    console.log('HTTP Server running on port 3000');
  });
}
```

## 常见问题解决

### 1. 证书不被信任

**问题:** 浏览器显示"不安全"或"证书无效"

**解决方案:**
- 确保已安装本地CA（mkcert -install）
- 检查证书的SAN字段是否包含访问的域名
- 清除浏览器缓存和证书缓存

### 2. 证书过期

**问题:** 证书已过期

**解决方案:**
```bash
# 检查证书有效期
openssl x509 -in certificate.pem -text -noout | grep "Not After"

# 重新生成证书
mkcert localhost 127.0.0.1 ::1
```

### 3. 端口占用

**问题:** 443端口被占用

**解决方案:**
```bash
# 查看端口占用
sudo lsof -i :443

# 使用其他端口
https.createServer(options, app).listen(8443);
```

### 4. 权限问题

**问题:** 无法绑定443端口（需要root权限）

**解决方案:**
```bash
# 使用sudo运行
sudo node server.js

# 或使用端口转发
sudo iptables -t nat -A OUTPUT -p tcp --dport 443 -j REDIRECT --to-port 8443

# 或使用authbind
sudo apt install authbind
sudo touch /etc/authbind/byport/443
sudo chmod 500 /etc/authbind/byport/443
sudo chown yourusername /etc/authbind/byport/443
authbind --deep node server.js
```

## 最佳实践

### 1. 证书管理

- 使用环境变量存储证书路径
- 定期检查证书有效期
- 备份证书文件
- 使用强密码保护私钥

### 2. 安全配置

```javascript
// 安全的HTTPS配置
const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem'),
  // 禁用不安全的协议
  secureProtocol: 'TLSv1_2_method',
  // 设置加密套件
  ciphers: [
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-SHA256',
    'ECDHE-RSA-AES256-SHA384'
  ].join(':'),
  honorCipherOrder: true
};
```

### 3. 自动化脚本

```bash
#!/bin/bash
# setup-https.sh

echo "Setting up HTTPS certificates..."

# 检查mkcert是否安装
if ! command -v mkcert &> /dev/null; then
    echo "Installing mkcert..."
    brew install mkcert
fi

# 安装本地CA
mkcert -install

# 创建SSL目录
mkdir -p ssl

# 生成证书
mkcert -key-file ssl/key.pem -cert-file ssl/cert.pem localhost 127.0.0.1 ::1

echo "HTTPS certificates generated successfully!"
echo "Certificate: ssl/cert.pem"
echo "Private key: ssl/key.pem"
```

## 总结

本指南提供了多种获取免费HTTPS证书的方法：

1. **开发环境推荐:** 使用mkcert工具，简单快捷
2. **生产环境推荐:** 使用Let's Encrypt，完全免费且自动续期
3. **特殊需求:** 自签名证书，完全控制证书内容

选择合适的方案根据您的具体需求：
- 本地开发：mkcert
- 公网服务：Let's Encrypt
- 内网服务：自签名证书
- 企业环境：云服务商证书

记住定期更新证书，配置自动续期，确保服务的持续安全性。 