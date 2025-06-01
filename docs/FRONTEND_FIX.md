# 前端空白页面修复指南

## 问题描述

前端页面显示空白，主要原因是：
1. Vite构建配置过于复杂，导致生成空的chunk文件
2. Nginx配置需要手动复制文件，不够便捷
3. 构建的JS文件过小，缺少主要应用代码
4. 页面标题和内容仍显示"智慧小区"而非"智慧moma"
5. Nginx权限问题导致无法访问项目目录

## 解决方案

### 1. 简化Vite配置

**问题**: 复杂的rollup配置和手动分包导致空chunk
**解决**: 简化`frontend/vite.config.ts`配置

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020'
  },
  preview: {
    port: 4173,
    host: true
  }
})
```

### 2. 优化Nginx配置

**问题**: 需要手动复制构建文件到`/usr/share/nginx/html`
**解决**: 直接指向项目构建目录

修改`/etc/nginx/conf.d/smart-community.conf`:
```nginx
server {
    listen 80;
    server_name 123.56.64.5;
    
    client_max_body_size 50M;
    
    # 前端静态文件 - 直接指向项目构建目录
    location / {
        root /root/smart-community/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        # ... 其他代理配置
    }
}
```

### 3. 修复权限问题

**问题**: Nginx无法访问`/root`目录下的文件
**解决**: 修复目录权限

```bash
chmod 755 /root
chmod -R 755 /root/smart-community/frontend/dist
```

### 4. 更新品牌名称

**问题**: 后端邮件服务等地方仍显示"智慧小区"
**解决**: 更新`backend/src/services/emailService.ts`中的所有文本

主要更改：
- 邮件主题: "智慧小区 - 邮箱验证码" → "智慧moma - 邮箱验证码"
- 邮件标题: "🏠 智慧小区" → "🏠 智慧moma"
- 注册文本: "注册智慧小区账户" → "注册智慧moma账户"
- 系统名称: "智慧小区系统" → "智慧moma系统"

### 5. 更新部署脚本

修改`manage.sh`中的`deploy_production`函数：

```bash
deploy_production() {
    log_header "生产环境部署"
    free_port 3000
    
    # 构建项目
    build_project
    
    # 修复权限，确保Nginx可以访问文件
    log_info "修复文件权限..."
    chmod 755 /root 2>/dev/null || true
    chmod -R 755 /root/smart-community/frontend/dist 2>/dev/null || true
    log_success "文件权限已修复"
    
    # Nginx现在直接指向项目构建目录，无需复制文件
    log_info "Nginx配置已指向项目构建目录: /root/smart-community/frontend/dist"
    
    # 重载Nginx配置
    if command -v nginx &>/dev/null; then
        sudo nginx -t && sudo nginx -s reload && log_success "Nginx 配置已重载"
    else
        log_warning "未检测到 nginx 命令，请手动重载Nginx配置"
    fi
    
    # 启动生产服务
    # ... 其他部署步骤
}
```

## 修复结果

### 构建文件大小对比

**修复前**:
- `index-08ad24c0.js`: 0.71 kB (只有模块预加载代码)
- `vendor-cd372fb8.js`: 0.00 kB (空文件)
- `router-cd372fb8.js`: 0.00 kB (空文件)

**修复后**:
- `index-9fc841e6.js`: 240.14 kB (包含完整应用代码)
- 无空chunk文件

### 部署流程优化

**修复前**:
1. 构建前端 → 2. 复制到Nginx目录 → 3. 重载Nginx

**修复后**:
1. 构建前端 → 2. 修复权限 → 3. 重载Nginx (直接读取项目目录)

### 品牌名称统一

**修复前**: 前端显示"智慧moma"，后端邮件等显示"智慧小区"
**修复后**: 全平台统一显示"智慧moma"

## 验证步骤

1. **检查构建**:
   ```bash
   cd frontend
   rm -rf dist
   npx vite build
   ls -la dist/assets/
   ```

2. **检查权限**:
   ```bash
   ls -la /root/smart-community/frontend/dist/
   ```

3. **检查Nginx配置**:
   ```bash
   sudo nginx -t
   sudo nginx -s reload
   ```

4. **一键部署**:
   ```bash
   ./manage.sh deploy
   ```

5. **访问测试**:
   ```bash
   curl -s http://123.56.64.5 | grep title
   ```
   应该显示: `<title>智慧moma</title>`

## 注意事项

1. **权限问题**: 确保Nginx有权限读取项目目录
2. **路径正确**: 确认项目路径为`/root/smart-community`
3. **构建完整**: 每次部署前确保前端构建成功
4. **标题更新**: 前端标题已更新为"智慧moma"
5. **后端更新**: 邮件服务等后端功能也已更新品牌名称

## 故障排除

### 如果页面仍然空白

1. 检查浏览器控制台错误
2. 检查Nginx错误日志: `sudo tail -f /var/log/nginx/error.log`
3. 确认构建文件存在: `ls -la /root/smart-community/frontend/dist/`
4. 重新构建: `cd frontend && rm -rf dist && npx vite build`

### 如果出现权限错误

1. 修复根目录权限: `chmod 755 /root`
2. 修复项目权限: `chmod -R 755 /root/smart-community/frontend/dist`
3. 重载Nginx: `sudo nginx -s reload`

### 如果Nginx配置错误

1. 测试配置: `sudo nginx -t`
2. 查看配置: `sudo cat /etc/nginx/conf.d/smart-community.conf`
3. 重载配置: `sudo nginx -s reload`

### 如果仍显示"智慧小区"

1. 清除浏览器缓存
2. 检查是否有其他文件包含旧名称: `grep -r "智慧小区" .`
3. 重新构建并部署: `./manage.sh deploy`

## 相关文件

- `frontend/vite.config.ts` - Vite构建配置
- `/etc/nginx/conf.d/smart-community.conf` - Nginx配置
- `manage.sh` - 项目管理脚本
- `frontend/index.html` - 前端入口文件
- `backend/src/services/emailService.ts` - 邮件服务配置 