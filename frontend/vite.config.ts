import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // 开发服务器优化
    hmr: {
      overlay: false // 减少内存使用
    },
    // 减少文件监听的开销
    watch: {
      usePolling: false,
      interval: 1000
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // 生产环境关闭sourcemap节省空间和内存
    // 减少内存使用 - 关键配置
    minify: 'esbuild', // 使用esbuild而不是terser，更快且内存占用更少
    target: 'es2020',
    // 限制并发构建任务和内存使用
    chunkSizeWarningLimit: 1000,
    // 优化rollup配置以减少内存使用
    rollupOptions: {
      // 限制并发处理
      maxParallelFileOps: 2,
      output: {
        // 手动分包以减少单个chunk大小
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        },
        // 减少输出文件大小
        compact: true
      },
      // 减少内存使用的插件配置
      treeshake: {
        preset: 'smallest'
      }
    },
    // 关闭不必要的功能以节省内存
    reportCompressedSize: false,
    // 限制内存使用
    assetsInlineLimit: 4096 // 减少内联资源大小
  },
  // 预览模式下的SPA路由回退
  preview: {
    port: 4173,
    host: true
  },
  // 开发环境优化
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    // 减少预构建的依赖数量
    force: false
  },
  // 减少内存使用
  esbuild: {
    target: 'es2020',
    // 开发环境下减少优化以节省内存
    ...(process.env.NODE_ENV === 'development' ? {
      minify: false,
      keepNames: true
    } : {
      drop: ['console', 'debugger'], // 移除console和debugger
      legalComments: 'none' // 移除法律注释以减少文件大小
    })
  },
  // 定义全局变量以减少bundle大小
  define: {
    __DEV__: process.env.NODE_ENV === 'development'
  }
})
