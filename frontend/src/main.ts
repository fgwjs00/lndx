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

// 挂载应用
app.mount('#app') 
