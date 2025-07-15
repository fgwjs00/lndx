<script setup lang="ts">
/**
 * 应用主组件
 * @component App
 * @description 应用程序的根组件，负责渲染路由视图
 */
import { onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()

// 应用启动时初始化认证状态
onMounted(async () => {
  await authStore.initializeAuth()
})
</script>

<template>
  <router-view />
</template>

<style scoped>
/* 应用主组件样式 */
</style>
