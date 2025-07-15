<template>
  <div v-if="hasAccess">
    <slot />
  </div>
  <div v-else-if="showFallback" class="permission-denied">
    <slot name="fallback">
      <div class="flex items-center justify-center p-8 text-gray-500">
        <div class="text-center">
          <i class="fas fa-lock text-4xl mb-4"></i>
          <p class="text-lg font-medium">权限不足</p>
          <p class="text-sm">您没有访问此内容的权限</p>
        </div>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
/**
 * 权限控制组件
 * @component PermissionGuard
 * @description 根据用户权限控制内容显示
 */
import { computed } from 'vue'
import { useAuthStore } from '@/store/auth'
import type { UserRole } from '@/types/auth'

interface Props {
  roles?: UserRole[]
  permissions?: string[]
  showFallback?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showFallback: false
})

const authStore = useAuthStore()

// 计算是否有访问权限
const hasAccess = computed<boolean>(() => {
  return authStore.canAccess(props.roles, props.permissions)
})
</script>

<style scoped>
.permission-denied {
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  background-color: #f9fafb;
}
</style> 