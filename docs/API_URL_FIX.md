# API URL配置修复指南

## 问题描述

用户在Render部署环境中遇到登录问题：
- 前端显示"手机号或密码错误，请重试"
- 控制台显示"SyntaxError: Unexpected end of JSON input"
- 后端日志显示404错误，请求没有到达API端点
- 错误URL示例：`GET https://smart-community-frontend.onrender.com/VITE_API_BASE_URL/announcements`

## 问题分析

通过分析发现问题出现在前端API基础URL配置上：

1. **环境变量配置不完整**：
   - `render.yaml`中设置的`VITE_API_BASE_URL`为`https://smart-community-backend.onrender.com`
   - 缺少`/api`路径后缀

2. **前端代码逻辑**：
   - `apiService.ts`中直接使用环境变量值作为API基础URL
   - 期望环境变量包含完整的API路径

3. **请求路径错误**：
   - 错误请求：`https://smart-community-backend.onrender.com/auth/login`
   - 正确路径：`https://smart-community-backend.onrender.com/api/auth/login`

4. **环境变量未解析**：
   - 在某些情况下，环境变量字面量`VITE_API_BASE_URL`没有被Vite正确替换
   - 导致请求URL包含变量名而不是实际值

## 修复方案

### 1. 更新环境变量配置

修改`frontend/render.yaml`：

```yaml
envVars:
  - key: VITE_API_BASE_URL
    value: https://smart-community-backend.onrender.com/api  # 添加/api路径
```

### 2. 使用部署脚本

创建了`scripts/deploy-frontend.sh`脚本来确保正确的构建流程：

```bash
# 运行部署脚本
./scripts/deploy-frontend.sh
```

脚本功能：
- 自动设置正确的环境变量
- 构建前端项目
- 验证API地址配置
- 检查构建结果完整性

### 3. 手动构建（备选方案）

```bash
cd frontend
VITE_API_BASE_URL=https://smart-community-backend.onrender.com/api npm run build
```

### 4. 验证修复

检查构建后的文件是否包含正确的API地址：

```bash
grep -o "smart-community-backend.onrender.com[^\"]*" dist/assets/index-*.js
# 应该输出：smart-community-backend.onrender.com/api
```

## 技术细节

### API服务配置逻辑

`frontend/src/services/apiService.ts`中的URL生成逻辑：

```typescript
const getApiBaseUrl = (): string => {
  // 开发环境
  if (import.meta.env.DEV) {
    // 动态IP地址支持
    const currentHost = window.location.hostname;
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      return `http://${currentHost}:3000/api`;
    }
    return 'http://localhost:3000/api';
  }
  
  // 生产环境 - 优先使用环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;  // 直接使用环境变量
  }
  
  // 生产环境默认值
  return 'https://smart-community-backend.onrender.com/api';
};
```

### 环境变量优先级

1. **开发环境**：根据访问主机名动态生成API地址
2. **生产环境**：优先使用`VITE_API_BASE_URL`环境变量
3. **回退方案**：使用硬编码的默认API地址

### Vite环境变量处理

- Vite在构建时会将`import.meta.env.VITE_*`变量内联到代码中
- 必须在构建时设置环境变量，而不是运行时
- 环境变量必须以`VITE_`前缀开头才能被前端访问

## 部署注意事项

1. **环境变量必须包含完整路径**：包括`/api`后缀
2. **构建时环境变量**：Vite在构建时会将环境变量内联到代码中
3. **验证步骤**：每次修改环境变量后都要重新构建并验证
4. **使用部署脚本**：推荐使用`scripts/deploy-frontend.sh`确保正确的构建流程

## 相关文件

- `frontend/render.yaml` - Render部署配置
- `frontend/src/services/apiService.ts` - API服务配置
- `scripts/deploy-frontend.sh` - 前端部署脚本
- `docs/API_404_FIX.md` - 之前的CORS修复文档

## 修复状态

✅ **已修复** - 2025年5月30日
- 环境变量配置已更新（添加`/api`路径）
- 前端项目已重新构建
- API地址配置正确
- 创建了自动化部署脚本
- 验证构建结果包含正确的API地址

## 测试验证

修复后，前端应该能够：
1. 正确连接到后端API
2. 成功进行用户登录
3. 正常获取和提交数据
4. 所有API请求都指向正确的端点

## 故障排除

如果仍有问题，请检查：

1. **后端服务状态**：确保后端服务正常运行
2. **CORS配置**：确保后端允许前端域名访问
3. **网络连接**：检查网络连接是否正常
4. **构建验证**：使用部署脚本验证构建结果
5. **浏览器缓存**：清除浏览器缓存后重试

## 快速修复命令

```bash
# 1. 更新环境变量后重新构建
cd frontend
VITE_API_BASE_URL=https://smart-community-backend.onrender.com/api npm run build

# 2. 验证API地址
grep -o "smart-community-backend.onrender.com[^\"]*" dist/assets/index-*.js

# 3. 或使用部署脚本
./scripts/deploy-frontend.sh
``` 