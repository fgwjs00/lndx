<template>
    <div class="role-form space-y-6">
      <!-- 基本信息 -->
      <div>
        <h4 class="text-lg font-semibold text-gray-800 mb-4">基本信息</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">角色名称</label>
            <input 
              v-model="formData.name" 
              type="text"
              placeholder="请输入角色名称"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">角色标识</label>
            <input 
              v-model="formData.key" 
              type="text"
              placeholder="请输入角色标识"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">角色描述</label>
            <textarea 
              v-model="formData.description" 
              placeholder="请输入角色描述"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>
  
      <!-- 操作按钮 -->
      <div class="flex justify-end gap-4">
        <button
          @click="$emit('cancel')"
          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
        <button
          @click="handleSubmit"
          class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          {{ role ? '更新角色' : '创建角色' }}
        </button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { reactive, watch } from 'vue'
  import { message } from 'ant-design-vue'
  
  interface Role {
    id: string
    name: string
    key: string
    description: string
  }
  
  interface Props {
    role?: Role | null
    permissions: string[]
  }
  
  const props = withDefaults(defineProps<Props>(), {
    role: null
  })
  
  const emit = defineEmits<{
    success: []
    cancel: []
  }>()
  
  const formData = reactive({
    name: '',
    key: '',
    description: ''
  })
  
  const handleSubmit = () => {
    if (!formData.name.trim()) {
      message.error('请输入角色名称')
      return
    }
    if (!formData.key.trim()) {
      message.error('请输入角色标识')
      return
    }
    message.success('操作成功')
    emit('success')
  }
  
  watch(() => props.role, (newRole) => {
    if (newRole) {
      formData.name = newRole.name
      formData.key = newRole.key
      formData.description = newRole.description
    } else {
      formData.name = ''
      formData.key = ''
      formData.description = ''
    }
  }, { immediate: true })
  </script>