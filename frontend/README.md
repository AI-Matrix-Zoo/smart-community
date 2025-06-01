# 智慧moma生活平台 - 前端

这是智慧moma生活平台的前端应用，基于React + TypeScript + Vite构建的现代化单页应用。

## 🛠️ 技术栈

- **React 18** - 用户界面库
- **TypeScript** - 类型安全的JavaScript
- **Vite** - 快速构建工具和开发服务器
- **Tailwind CSS** - 实用优先的CSS框架
- **React Router** - 客户端路由管理
- **Context API** - 全局状态管理

## ✨ 功能特性

### 🔐 用户认证
- 手机号登录/注册
- JWT token管理
- 自动登录状态保持
- 角色权限控制

### 💡 建议反馈
- 提交建议表单
- 建议列表查看
- 实时状态更新
- 进度跟踪显示

### 🛒 二手市场
- 物品发布功能
- 物品浏览和搜索
- 个人物品管理
- 联系卖家功能

### 📢 公告管理
- 公告列表显示
- 公告详情查看
- 管理员发布功能
- 时间排序展示

### 👥 用户管理
- 个人信息管理
- 用户列表（管理员）
- 角色权限分配
- 用户操作记录

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装和运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 环境变量配置

创建 `.env.development` 文件：
```
VITE_API_BASE_URL=http://localhost:3001/api
```

创建 `.env.production` 文件：
```
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
```

## 📁 项目结构

```
frontend/
├── public/                 # 静态资源
├── src/
│   ├── components/         # 可复用组件
│   │   ├── common/         # 通用组件
│   │   ├── forms/          # 表单组件
│   │   └── layout/         # 布局组件
│   ├── contexts/           # React Context
│   │   ├── AuthContext.tsx # 认证上下文
│   │   └── ThemeContext.tsx# 主题上下文
│   ├── services/           # API服务
│   │   ├── api.ts          # API客户端
│   │   ├── auth.ts         # 认证服务
│   │   ├── suggestions.ts  # 建议服务
│   │   ├── market.ts       # 市场服务
│   │   └── announcements.ts# 公告服务
│   ├── types.ts            # TypeScript类型定义
│   ├── App.tsx             # 主应用组件
│   └── index.tsx           # 应用入口
├── index.html              # HTML模板
├── package.json            # 项目配置
├── tsconfig.json           # TypeScript配置
├── vite.config.ts          # Vite配置
└── tailwind.config.js      # Tailwind配置
```

## 🎨 组件架构

### 通用组件
- `Button` - 按钮组件
- `Input` - 输入框组件
- `Modal` - 模态框组件
- `Loading` - 加载状态组件
- `Toast` - 消息提示组件

### 布局组件
- `Header` - 页面头部
- `Sidebar` - 侧边栏
- `Footer` - 页面底部
- `Layout` - 主布局容器

### 业务组件
- `LoginForm` - 登录表单
- `SuggestionCard` - 建议卡片
- `MarketItem` - 市场物品
- `AnnouncementList` - 公告列表

## 🔧 开发指南

### 代码规范
- 使用TypeScript严格模式
- 遵循React Hooks最佳实践
- 组件使用函数式组件
- 状态管理使用Context API

### 样式规范
- 使用Tailwind CSS类名
- 响应式设计优先
- 深色模式支持
- 组件样式模块化

### API调用
```typescript
// 使用统一的API服务
import { apiClient } from '../services/api';

const fetchData = async () => {
  try {
    const response = await apiClient.get('/endpoint');
    return response.data;
  } catch (error) {
    console.error('API调用失败:', error);
    throw error;
  }
};
```

### 状态管理
```typescript
// 使用Context进行状态管理
const { user, login, logout } = useAuth();
const { theme, toggleTheme } = useTheme();
```

## 🧪 测试

### 运行测试
```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

### 测试结构
```
src/
├── __tests__/              # 测试文件
│   ├── components/         # 组件测试
│   ├── services/           # 服务测试
│   └── utils/              # 工具函数测试
└── setupTests.ts           # 测试配置
```

## 📱 响应式设计

### 断点配置
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    }
  }
}
```

### 移动端优化
- 触摸友好的交互设计
- 适配不同屏幕尺寸
- 优化移动端性能
- 支持手势操作

## 🎯 性能优化

### 代码分割
```typescript
// 路由级别的代码分割
const LazyComponent = lazy(() => import('./LazyComponent'));

// 组件懒加载
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

### 图片优化
```typescript
// 图片懒加载
<img 
  src={imageSrc} 
  loading="lazy" 
  alt="描述"
  className="w-full h-auto"
/>
```

### 缓存策略
- API响应缓存
- 静态资源缓存
- 路由缓存
- 组件状态缓存

## 🔐 安全特性

### XSS防护
```typescript
// 使用dangerouslySetInnerHTML时要小心
const sanitizedHTML = DOMPurify.sanitize(htmlContent);
```

### CSRF防护
```typescript
// API请求包含CSRF token
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
```

### 敏感信息保护
- 不在前端存储敏感信息
- 使用HTTPS传输
- Token安全存储
- 输入验证和清理

## 🌐 国际化

### 多语言支持
```typescript
// 使用react-i18next
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
return <h1>{t('welcome')}</h1>;
```

### 语言配置
```
src/
├── locales/
│   ├── zh/
│   │   └── common.json
│   └── en/
│       └── common.json
└── i18n.ts
```

## 📊 监控和分析

### 错误监控
```typescript
// 错误边界组件
class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    // 发送错误到监控服务
    console.error('组件错误:', error, errorInfo);
  }
}
```

### 性能监控
```typescript
// Web Vitals监控
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## 🚀 部署

### 构建配置
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  }
});
```

### 环境配置
- 开发环境：本地API服务
- 测试环境：测试API服务
- 生产环境：生产API服务

详细部署指南请参考：[DEPLOYMENT.md](./DEPLOYMENT.md)

## 🛠️ 开发工具

### 推荐VSCode插件
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Prettier - Code formatter

### 开发脚本
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext ts,tsx",
    "lint:fix": "eslint src --ext ts,tsx --fix",
    "type-check": "tsc --noEmit"
  }
}
```

## 🤝 贡献指南

### 开发流程
1. Fork项目
2. 创建功能分支
3. 编写代码和测试
4. 提交代码
5. 创建Pull Request

### 代码提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

## 📝 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 完整的用户界面
- 响应式设计
- 多角色权限支持

## 🆘 故障排除

### 常见问题

1. **开发服务器启动失败**
   ```bash
   # 清除缓存
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **TypeScript编译错误**
   ```bash
   # 检查类型错误
   npm run type-check
   ```

3. **样式不生效**
   ```bash
   # 重新构建Tailwind
   npm run build
   ```

4. **API连接失败**
   - 检查环境变量配置
   - 确认后端服务状态
   - 验证CORS设置

## 📞 技术支持

- 项目总体文档: [../README.md](../README.md)
- 后端API文档: [../backend/README.md](../backend/README.md)
- 部署指南: [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📄 许可证

MIT License

---

感谢使用智慧moma生活平台前端！🎉 