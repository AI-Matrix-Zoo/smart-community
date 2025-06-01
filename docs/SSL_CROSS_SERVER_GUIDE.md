# 🔄 跨服务器SSL证书获取指南

## 📋 概述

当目标服务器网络条件不佳时，可以在网络条件良好的其他服务器上获取Let's Encrypt证书，然后传输到目标服务器。

## 🌐 适用场景

- 目标服务器网络不稳定
- Let's Encrypt验证经常失败
- 需要批量管理多个服务器的证书

## 🔧 方法1：HTTP验证 + 证书传输

### 步骤1：准备辅助服务器

在网络条件良好的服务器上：

```bash
# 安装certbot
yum install -y certbot

# 确保80端口可用
systemctl stop nginx  # 如果有运行的话
```

### 步骤2：临时DNS解析

**方案A：修改域名DNS解析**
- 临时将 www.moma.lol 和 moma.lol 解析到辅助服务器IP
- 等待DNS传播（通常5-30分钟）

**方案B：使用hosts文件（仅限测试）**
```bash
# 在辅助服务器上添加
echo "辅助服务器IP www.moma.lol" >> /etc/hosts
echo "辅助服务器IP moma.lol" >> /etc/hosts
```

### 步骤3：获取证书

```bash
# 在辅助服务器上执行
certbot certonly --standalone -d www.moma.lol -d moma.lol \
  --non-interactive --agree-tos --email admin@moma.lol
```

### 步骤4：打包证书

```bash
# 创建证书包
cd /etc/letsencrypt/live/www.moma.lol/
tar -czf ssl-certificates-$(date +%Y%m%d).tar.gz *.pem

# 或单独复制
cp fullchain.pem /tmp/smart-community.crt
cp privkey.pem /tmp/smart-community.key
cp chain.pem /tmp/smart-community-chain.crt
```

### 步骤5：传输到目标服务器

**方案A：SCP传输**
```bash
scp ssl-certificates-*.tar.gz root@123.56.64.5:/tmp/
```

**方案B：云存储中转**
```bash
# 上传到云存储（阿里云OSS、腾讯云COS等）
# 然后在目标服务器下载
```

**方案C：Base64编码传输**
```bash
# 编码
base64 ssl-certificates-*.tar.gz > ssl-cert-base64.txt

# 复制内容到目标服务器后解码
base64 -d ssl-cert-base64.txt > ssl-certificates.tar.gz
```

### 步骤6：在目标服务器安装证书

```bash
# 解压证书
cd /tmp
tar -xzf ssl-certificates-*.tar.gz

# 安装证书
cp fullchain.pem /etc/nginx/ssl/smart-community.crt
cp privkey.pem /etc/nginx/ssl/smart-community.key

# 设置权限
chmod 644 /etc/nginx/ssl/smart-community.crt
chmod 600 /etc/nginx/ssl/smart-community.key

# 重新加载nginx
nginx -t && systemctl reload nginx
```

### 步骤7：恢复DNS解析

将域名DNS解析改回目标服务器IP：123.56.64.5

## 🔧 方法2：DNS验证（推荐）

### 优势
- 不需要修改DNS解析
- 不需要80/443端口
- 可以在任何服务器上执行

### 步骤1：在辅助服务器获取证书

```bash
certbot certonly --manual --preferred-challenges dns \
  -d www.moma.lol -d moma.lol \
  --email admin@moma.lol --agree-tos
```

### 步骤2：添加DNS TXT记录

根据certbot提示，在域名管理面板添加TXT记录：

```
记录类型: TXT
主机记录: _acme-challenge.moma.lol
记录值: [certbot提供的值]

记录类型: TXT  
主机记录: _acme-challenge.www.moma.lol
记录值: [certbot提供的值]
```

### 步骤3：验证DNS记录

```bash
# 检查DNS记录是否生效
dig TXT _acme-challenge.moma.lol
dig TXT _acme-challenge.www.moma.lol
```

### 步骤4：完成验证并传输证书

按照方法1的步骤4-6进行证书打包和传输。

## 🔧 方法3：使用acme.sh（轻量级）

### 安装acme.sh

```bash
curl https://get.acme.sh | sh
source ~/.bashrc
```

### 使用DNS API自动验证

```bash
# 配置DNS API（以阿里云为例）
export Ali_Key="your-access-key"
export Ali_Secret="your-secret-key"

# 自动获取证书
acme.sh --issue --dns dns_ali -d www.moma.lol -d moma.lol
```

## 📋 自动化脚本

创建自动化传输脚本：

```bash
#!/bin/bash
# 跨服务器证书同步脚本

SOURCE_SERVER="辅助服务器IP"
TARGET_SERVER="123.56.64.5"
DOMAIN="www.moma.lol"

# 在辅助服务器获取证书
ssh root@$SOURCE_SERVER "certbot renew --quiet"

# 打包证书
ssh root@$SOURCE_SERVER "cd /etc/letsencrypt/live/$DOMAIN && tar -czf /tmp/ssl-cert.tar.gz *.pem"

# 传输到目标服务器
scp root@$SOURCE_SERVER:/tmp/ssl-cert.tar.gz /tmp/

# 安装证书
cd /tmp
tar -xzf ssl-cert.tar.gz
cp fullchain.pem /etc/nginx/ssl/smart-community.crt
cp privkey.pem /etc/nginx/ssl/smart-community.key

# 重新加载nginx
nginx -t && systemctl reload nginx

echo "证书同步完成: $(date)"
```

## ⚠️ 注意事项

1. **DNS传播时间**: 修改DNS解析后需要等待传播
2. **证书有效期**: Let's Encrypt证书有效期90天
3. **自动续期**: 需要在辅助服务器配置自动续期
4. **安全性**: 传输过程中保护私钥安全
5. **同步频率**: 建议每月同步一次

## 🔄 续期策略

### 在辅助服务器配置自动续期

```bash
# 添加crontab任务
0 2 1 * * /root/cross-server-ssl-sync.sh
```

### 更新目标服务器的续期脚本

修改 `/root/renew-ssl.sh`，添加跨服务器同步逻辑。

## 📊 验证方法

```bash
# 检查证书信息
openssl x509 -in /etc/nginx/ssl/smart-community.crt -text -noout

# 测试HTTPS连接
curl -I https://www.moma.lol

# 检查证书到期时间
openssl x509 -in /etc/nginx/ssl/smart-community.crt -noout -dates
```

---

**创建时间**: 2025-06-01  
**适用场景**: 网络受限环境的SSL证书管理  
**推荐方法**: DNS验证 + 自动化传输 