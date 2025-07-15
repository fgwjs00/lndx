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