<template>
  <a-form
    :model="formData"
    :rules="rules"
    @finish="handleSubmit"
    layout="vertical"
    class="space-y-4"
  >
    <a-form-item label="用户名" name="username">
      <a-input 
        v-model:value="formData.username" 
        placeholder="请输入用户名"
        :disabled="isEdit"
      />
    </a-form-item>

    <a-form-item label="真实姓名" name="realName">
      <a-input 
        v-model:value="formData.realName" 
        placeholder="请输入真实姓名"
      />
    </a-form-item>

    <a-form-item label="手机号" name="phone">
      <a-input 
        v-model:value="formData.phone" 
        placeholder="请输入手机号"
      />
    </a-form-item>

    <a-form-item label="邮箱" name="email">
      <a-input 
        v-model:value="formData.email" 
        placeholder="请输入邮箱"
      />
    </a-form-item>

    <a-form-item label="角色" name="role">
      <a-select 
        v-model:value="formData.role" 
        placeholder="请选择角色"
        @change="handleRoleChange"
      >
        <a-select-option value="admin">管理员</a-select-option>
        <a-select-option value="teacher">教师</a-select-option>
        <a-select-option value="student">学生</a-select-option>
      </a-select>
    </a-form-item>

    <!-- 教师特殊字段 -->
    <template v-if="formData.role === 'teacher'">
      <a-form-item label="工号" name="teacherId">
        <a-input 
          v-model:value="formData.teacherId" 
          placeholder="请输入教师工号"
        />
      </a-form-item>

      <a-form-item label="学科" name="subject">
        <a-select 
          v-model:value="formData.subject" 
          placeholder="请选择学科"
        >
          <a-select-option value="数学">数学</a-select-option>
          <a-select-option value="语文">语文</a-select-option>
          <a-select-option value="英语">英语</a-select-option>
          <a-select-option value="物理">物理</a-select-option>
          <a-select-option value="化学">化学</a-select-option>
          <a-select-option value="生物">生物</a-select-option>
          <a-select-option value="历史">历史</a-select-option>
          <a-select-option value="地理">地理</a-select-option>
          <a-select-option value="政治">政治</a-select-option>
          <a-select-option value="计算机">计算机</a-select-option>
          <a-select-option value="美术">美术</a-select-option>
          <a-select-option value="音乐">音乐</a-select-option>
          <a-select-option value="体育">体育</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="学历" name="education">
        <a-select 
          v-model:value="formData.education" 
          placeholder="请选择学历"
        >
          <a-select-option value="本科">本科</a-select-option>
          <a-select-option value="硕士">硕士</a-select-option>
          <a-select-option value="博士">博士</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="职称" name="title">
        <a-select 
          v-model:value="formData.title" 
          placeholder="请选择职称"
        >
          <a-select-option value="助教">助教</a-select-option>
          <a-select-option value="讲师">讲师</a-select-option>
          <a-select-option value="副教授">副教授</a-select-option>
          <a-select-option value="教授">教授</a-select-option>
        </a-select>
      </a-form-item>
    </template>

    <a-form-item v-if="!isEdit" label="密码" name="password">
      <a-input-password 
        v-model:value="formData.password" 
        placeholder="请输入密码"
      />
    </a-form-item>

    <a-form-item label="状态" name="status">
      <a-select 
        v-model:value="formData.status" 
        placeholder="请选择状态"
      >
        <a-select-option value="active">激活</a-select-option>
        <a-select-option value="inactive">禁用</a-select-option>
      </a-select>
    </a-form-item>

    <div class="flex justify-end space-x-2">
      <a-button @click="handleCancel">取消</a-button>
      <a-button type="primary" html-type="submit" :loading="loading">
        {{ isEdit ? '更新' : '创建' }}
      </a-button>
    </div>
  </a-form>
</template>

<script setup lang="ts">
/**
 * 用户表单组件
 * @component UserForm
 * @description 用于创建和编辑用户的表单组件
 */
import { ref, reactive, watch } from 'vue'
import { message } from 'ant-design-vue'

// 用户数据类型定义
interface UserFormData {
  username: string
  realName: string
  phone: string
  email: string
  role: string
  password?: string
  status: string
  // 教师特殊字段
  teacherId?: string
  subject?: string
  education?: string
  title?: string
}

// 组件属性
interface Props {
  user?: UserFormData | null
  loading?: boolean
  defaultRole?: string
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
  loading: false
})

// 组件事件
const emit = defineEmits<{
  submit: [data: UserFormData]
  cancel: []
}>()

// 表单数据
const formData = reactive<UserFormData>({
  username: '',
  realName: '',
  phone: '',
  email: '',
  role: props.defaultRole || 'student',
  password: '',
  status: 'active',
  // 教师特殊字段
  teacherId: '',
  subject: '',
  education: '',
  title: ''
})

// 是否为编辑模式
const isEdit = ref<boolean>(false)

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3-20个字符', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度在2-10个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6个字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  // 教师字段验证规则
  teacherId: [
    { required: true, message: '请输入教师工号', trigger: 'blur' },
    { pattern: /^T\d{3,6}$/, message: '工号格式为T+3-6位数字', trigger: 'blur' }
  ],
  subject: [
    { required: true, message: '请选择学科', trigger: 'change' }
  ]
}

// 监听用户数据变化
watch(() => props.user, (newUser) => {
  if (newUser) {
    isEdit.value = true
    Object.assign(formData, {
      username: newUser.username || '',
      realName: newUser.realName || '',
      phone: newUser.phone || '',
      email: newUser.email || '',
      role: newUser.role || 'student',
      password: '',
      status: newUser.status || 'active',
      teacherId: newUser.teacherId || '',
      subject: newUser.subject || '',
      education: newUser.education || '',
      title: newUser.title || ''
    })
  } else {
    isEdit.value = false
    resetForm()
  }
}, { immediate: true })

/**
 * 重置表单
 */
const resetForm = (): void => {
  formData.username = ''
  formData.realName = ''
  formData.phone = ''
  formData.email = ''
  formData.role = props.defaultRole || 'student'
  formData.password = ''
  formData.status = 'active'
  formData.teacherId = ''
  formData.subject = ''
  formData.education = ''
  formData.title = ''
}

/**
 * 处理角色变化
 */
const handleRoleChange = (role: string): void => {
  // 当角色改变时，清空教师特殊字段
  if (role !== 'teacher') {
    formData.teacherId = ''
    formData.subject = ''
    formData.education = ''
    formData.title = ''
  }
}

/**
 * 处理表单提交
 */
const handleSubmit = (): void => {
  // 根据角色过滤提交数据
  const submitData = { ...formData }
  
  // 如果不是教师角色，删除教师特殊字段
  if (submitData.role !== 'teacher') {
    delete submitData.teacherId
    delete submitData.subject
    delete submitData.education
    delete submitData.title
  }
  
  emit('submit', submitData)
}

/**
 * 处理取消
 */
const handleCancel = (): void => {
  emit('cancel')
}
</script>

<style scoped>
/* 表单样式 */
.ant-form {
  max-width: 500px;
}

.ant-form-item {
  margin-bottom: 16px;
}
</style> 