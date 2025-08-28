/**
 * 应用程序入口文件
 * @description 初始化Vue应用，配置全局插件和路由
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import router from './router'
import { useAuthStore } from './store/auth'

// 清理旧版本的缓存数据（权限系统升级后）
const clearOldCache = () => {
  try {
    console.log('🧹 检查并清理旧版本缓存...')
    
    // 检查用户数据
    const user = localStorage.getItem('user')
    const permissions = localStorage.getItem('permissions')
    
    if (user) {
      const userData = JSON.parse(user)
      // 检查是否是旧的admin角色，需要清理缓存
      if (userData.role === 'admin') {
        console.log('检测到旧版本用户数据，清理缓存...')
        localStorage.clear()
        sessionStorage.clear()
        return
      }
    }
    
    // 检查权限数据是否包含旧的权限格式
    if (permissions) {
      const permissionData = JSON.parse(permissions)
      if (Array.isArray(permissionData) && permissionData.includes('role:*')) {
        console.log('检测到旧版本权限数据，清理缓存...')
        localStorage.clear()
        sessionStorage.clear()
        return
      }
    }
    
    console.log('✅ 缓存检查完成')
  } catch (error) {
    console.error('清理缓存时出错:', error)
    // 如果解析出错，也清理缓存
    localStorage.clear()
    sessionStorage.clear()
  }
}

clearOldCache()

// 创建Vue应用实例
const app = createApp(App)

// 创建Pinia实例
const pinia = createPinia()

// 注册全局插件
app.use(pinia)
app.use(Antd)
app.use(router)

// 初始化应用
const initializeApp = async () => {
  try {
    // 初始化认证状态（从localStorage恢复登录状态）
    const authStore = useAuthStore()
    const token = localStorage.getItem('token')
    
    if (token) {
      console.log('🔄 应用启动：检测到token，初始化认证状态...')
      await authStore.initializeAuth()
      console.log('✅ 认证状态初始化完成:', {
        isAuthenticated: authStore.isAuthenticated,
        userRole: authStore.user?.role,
        userName: authStore.user?.realName
      })
    } else {
      console.log('🔍 应用启动：未检测到token，保持未登录状态')
    }
  } catch (error) {
    console.error('❌ 初始化认证状态失败:', error)
  } finally {
    // 无论是否成功，都挂载应用
    app.mount('#app')
    console.log('🚀 Vue应用已挂载')
  }
}

// 启动应用
initializeApp() 
