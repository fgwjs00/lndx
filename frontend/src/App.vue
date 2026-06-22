<script setup lang="ts">
/**
 * 应用主组件
 * @component App
 * @description 应用程序的根组件，负责渲染路由视图
 */
import { onMounted } from 'vue'
import dayjs from 'dayjs'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import 'dayjs/locale/zh-cn'
import { useAuthStore } from '@/store/auth'

dayjs.locale('zh-cn')

const authStore = useAuthStore()

// 应用启动时初始化认证状态
onMounted(async () => {
  await authStore.initializeAuth()
})
</script>

<template>
  <a-config-provider :locale="zhCN">
    <router-view />
  </a-config-provider>
</template>

<style scoped>
/* 应用主组件样式 */
</style>
