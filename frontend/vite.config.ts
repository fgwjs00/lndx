import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  // 开发服务器配置
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  define: {
    // 开发模式配置
    __DEV_MODE__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __SKIP_CAPTCHA__: JSON.stringify(process.env.NODE_ENV === 'development'), // 开发环境跳过验证码
    __MOCK_AUTH__: JSON.stringify(false)     // 关闭模拟认证，使用真实API
  }
}) 