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
  define: {
    // 开发模式配置
    __DEV_MODE__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __SKIP_CAPTCHA__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __MOCK_AUTH__: JSON.stringify(process.env.NODE_ENV === 'development')
  }
}) 