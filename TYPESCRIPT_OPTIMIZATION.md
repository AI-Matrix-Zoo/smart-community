# TypeScript 内存优化指南

## 🚀 已实施的优化措施

### 1. TypeScript 配置优化

#### 前端 (frontend/tsconfig.json)
- ✅ 启用 `skipLibCheck: true` - 跳过库文件类型检查
- ✅ 启用 `incremental: true` - 增量编译
- ✅ 设置 `tsBuildInfoFile` - 缓存编译信息
- ✅ 精确的 `include` 和 `exclude` 配置
- ✅ 排除测试文件和构建目录

#### 后端 (backend/tsconfig.json)
- ✅ 禁用 `declaration: false` - 不生成声明文件
- ✅ 启用 `skipLibCheck: true`
- ✅ 启用 `incremental: true`
- ✅ 排除不必要的目录和文件

### 2. VSCode/Cursor 配置优化

#### 已配置的内存优化设置 (.vscode/settings.json)
- ✅ 禁用自动导入建议
- ✅ 关闭自动类型获取
- ✅ 限制工作区符号范围
- ✅ 禁用代码镜头功能
- ✅ 排除大型目录的文件监控
- ✅ 优化搜索和文件排除

## 📊 内存使用优化效果

### 优化前常见问题
- tsserver 进程占用 500MB - 2GB 内存
- 大型项目启动缓慢
- 频繁的内存警告

### 优化后预期效果
- 内存使用减少 30-50%
- 启动速度提升 20-40%
- 更稳定的性能表现

## 🛠️ 进一步优化建议

### 1. 项目级别优化

```bash
# 清理 TypeScript 缓存
rm -rf frontend/.tsbuildinfo backend/.tsbuildinfo

# 重启 TypeScript 服务 (在 Cursor/VSCode 中)
# Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

### 2. 系统级别优化

#### 限制 Node.js 内存使用
```bash
# 在 package.json 的 scripts 中添加内存限制
"dev": "node --max-old-space-size=2048 node_modules/.bin/vite"
```

#### 环境变量设置
```bash
# 设置 TypeScript 内存限制
export TS_NODE_MAX_OLD_SPACE_SIZE=2048
export NODE_OPTIONS="--max-old-space-size=2048"
```

### 3. Cursor/VSCode 特定优化

#### 工作区设置
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "typescript.disableAutomaticTypeAcquisition": true,
  "typescript.workspaceSymbols.scope": "currentProject"
}
```

#### 扩展管理
- 禁用不必要的 TypeScript 相关扩展
- 使用轻量级的代码格式化工具

## 🔧 故障排除

### 如果内存使用仍然过高

1. **重启 TypeScript 服务**
   ```
   Ctrl+Shift+P -> "TypeScript: Restart TS Server"
   ```

2. **检查项目结构**
   ```bash
   # 确保排除了大型目录
   du -sh node_modules dist build
   ```

3. **临时禁用 TypeScript 检查**
   ```json
   // 在 .vscode/settings.json 中
   {
     "typescript.validate.enable": false
   }
   ```

4. **使用项目引用**
   ```json
   // 对于大型项目，考虑使用项目引用
   {
     "references": [
       { "path": "./frontend" },
       { "path": "./backend" }
     ]
   }
   ```

### 监控内存使用

```bash
# 查看 Node.js 进程内存使用
ps aux | grep node
top -p $(pgrep -f tsserver)

# 在 Cursor/VSCode 中查看性能
# Help -> Toggle Developer Tools -> Performance
```

## 📈 性能监控

### 定期检查
- 每周重启 TypeScript 服务
- 定期清理构建缓存
- 监控项目大小增长

### 指标跟踪
- tsserver 进程内存使用
- 项目启动时间
- 代码补全响应时间

## 🎯 最佳实践

1. **保持项目结构清洁**
   - 定期清理未使用的依赖
   - 避免深层嵌套的目录结构

2. **合理使用类型**
   - 避免过度复杂的类型定义
   - 使用 `any` 类型作为临时解决方案

3. **分离关注点**
   - 将类型定义放在单独的文件中
   - 使用模块化的项目结构

4. **定期维护**
   - 更新 TypeScript 版本
   - 清理过时的配置

## 🚨 紧急情况处理

如果 tsserver 占用过多内存导致系统卡顿：

```bash
# 强制终止 tsserver 进程
pkill -f tsserver

# 在 Cursor/VSCode 中重启
# Ctrl+Shift+P -> "Developer: Reload Window"
```

---

**注意**: 这些优化措施已经集成到项目配置中，通常情况下无需手动调整。如果遇到性能问题，请按照故障排除步骤操作。 