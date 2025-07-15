<template>
  <div class="logs-management">
    <!-- 页面头部 -->
    <div class="bg-gradient-to-r from-slate-600 to-gray-700 rounded-2xl p-8 text-white mb-8 shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold mb-2">系统日志</h1>
          <p class="text-slate-100">监控系统运行状态、用户操作记录和安全事件</p>
        </div>
        <div class="text-6xl opacity-20">
          📋
        </div>
      </div>
    </div>
    
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-list text-blue-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ logs.length }}</h3>
            <p class="text-gray-500 text-sm">总日志数</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-check-circle text-green-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ successLogs.length }}</h3>
            <p class="text-gray-500 text-sm">成功操作</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ errorLogs.length }}</h3>
            <p class="text-gray-500 text-sm">错误日志</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-user-shield text-yellow-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ securityLogs.length }}</h3>
            <p class="text-gray-500 text-sm">安全事件</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 过滤器 -->
    <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-gray-800">日志筛选</h3>
        <div class="flex items-center space-x-4">
          <button 
            @click="clearLogs"
            class="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center transition-colors"
          >
            <i class="fas fa-trash mr-2"></i>
            清空日志
          </button>
          <button 
            @click="exportLogs"
            class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center transition-colors"
          >
            <i class="fas fa-download mr-2"></i>
            导出日志
          </button>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div class="relative">
          <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索日志内容..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select v-model="selectedLevel" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">所有级别</option>
          <option value="info">信息</option>
          <option value="warning">警告</option>
          <option value="error">错误</option>
          <option value="success">成功</option>
        </select>
        
        <select v-model="selectedModule" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">所有模块</option>
          <option value="auth">认证模块</option>
          <option value="user">用户模块</option>
          <option value="student">学生模块</option>
          <option value="course">课程模块</option>
          <option value="system">系统模块</option>
        </select>
        
        <input
          v-model="dateRange.start"
          type="date"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          v-model="dateRange.end"
          type="date"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
    
    <!-- 日志列表 -->
    <div class="bg-white rounded-2xl shadow-lg">
      <div class="p-6 border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-800">日志记录</h3>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50">
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">时间</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">级别</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">模块</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">用户</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">操作</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">详情</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">IP地址</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="log in filteredLogs" 
              :key="log.id"
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td class="py-4 px-6 text-gray-600 text-sm">{{ log.timestamp }}</td>
              <td class="py-4 px-6">
                <span 
                  class="px-3 py-1 rounded-full text-xs font-medium"
                  :class="getLevelClass(log.level)"
                >
                  {{ getLevelText(log.level) }}
                </span>
              </td>
              <td class="py-4 px-6 text-gray-600">{{ log.module }}</td>
              <td class="py-4 px-6 text-gray-800 font-medium">{{ log.user }}</td>
              <td class="py-4 px-6 text-gray-600">{{ log.action }}</td>
              <td class="py-4 px-6 text-gray-600 max-w-xs truncate">{{ log.details }}</td>
              <td class="py-4 px-6 text-gray-600 text-sm">{{ log.ip }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- 分页 -->
      <div class="p-6 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-500">
            显示 1-20 条，共 {{ filteredLogs.length }} 条记录
          </div>
          <div class="flex items-center space-x-2">
            <button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              上一页
            </button>
            <button class="px-3 py-1 bg-blue-500 text-white rounded">
              1
            </button>
            <button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              2
            </button>
            <button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 系统日志页面
 * @component Logs
 * @description 管理员查看系统日志和用户操作记录
 */
import { ref, computed, onMounted } from 'vue'
import { Modal, message } from 'ant-design-vue'

// 日志数据类型定义
interface Log {
  id: number
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'success'
  module: string
  user: string
  action: string
  details: string
  ip: string
}

// 响应式数据
const searchQuery = ref<string>('')
const selectedLevel = ref<string>('')
const selectedModule = ref<string>('')
const dateRange = ref({
  start: '',
  end: ''
})

// 模拟日志数据
const logs = ref<Log[]>([
  {
    id: 1,
    timestamp: '2025-01-05 14:30:25',
    level: 'success',
    module: 'auth',
    user: '系统管理员',
    action: '用户登录',
    details: '管理员用户登录成功',
    ip: '192.168.1.100'
  },
  {
    id: 2,
    timestamp: '2025-01-05 14:25:12',
    level: 'info',
    module: 'user',
    user: '系统管理员',
    action: '创建用户',
    details: '创建新教师用户: 张教授',
    ip: '192.168.1.100'
  },
  {
    id: 3,
    timestamp: '2025-01-05 14:20:45',
    level: 'warning',
    module: 'auth',
    user: '匿名用户',
    action: '登录失败',
    details: '用户名或密码错误，IP: 192.168.1.200',
    ip: '192.168.1.200'
  },
  {
    id: 4,
    timestamp: '2025-01-05 14:15:33',
    level: 'error',
    module: 'system',
    user: '系统',
    action: '数据库连接',
    details: '数据库连接超时，自动重连成功',
    ip: '127.0.0.1'
  },
  {
    id: 5,
    timestamp: '2025-01-05 14:10:18',
    level: 'info',
    module: 'student',
    user: '李老师',
    action: '学生管理',
    details: '更新学生信息: 陈雨桐',
    ip: '192.168.1.150'
  },
  {
    id: 6,
    timestamp: '2025-01-05 14:05:42',
    level: 'success',
    module: 'course',
    user: '张教授',
    action: '课程管理',
    details: '创建新课程: 高等数学',
    ip: '192.168.1.180'
  },
  {
    id: 7,
    timestamp: '2025-01-05 14:00:15',
    level: 'warning',
    module: 'system',
    user: '系统',
    action: '系统监控',
    details: 'CPU使用率超过80%',
    ip: '127.0.0.1'
  },
  {
    id: 8,
    timestamp: '2025-01-05 13:55:28',
    level: 'error',
    module: 'auth',
    user: '匿名用户',
    action: '暴力破解',
    details: '检测到暴力破解尝试，IP已被封禁',
    ip: '192.168.1.250'
  }
])

// 计算属性
const filteredLogs = computed<Log[]>(() => {
  let filtered = logs.value
  
  // 搜索过滤
  if (searchQuery.value) {
    filtered = filtered.filter(log => 
      log.action.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  // 级别过滤
  if (selectedLevel.value) {
    filtered = filtered.filter(log => log.level === selectedLevel.value)
  }
  
  // 模块过滤
  if (selectedModule.value) {
    filtered = filtered.filter(log => log.module === selectedModule.value)
  }
  
  // 日期范围过滤
  if (dateRange.value.start) {
    filtered = filtered.filter(log => log.timestamp >= dateRange.value.start)
  }
  
  if (dateRange.value.end) {
    filtered = filtered.filter(log => log.timestamp <= dateRange.value.end + ' 23:59:59')
  }
  
  return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
})

const successLogs = computed<Log[]>(() => {
  return logs.value.filter(log => log.level === 'success')
})

const errorLogs = computed<Log[]>(() => {
  return logs.value.filter(log => log.level === 'error')
})

const securityLogs = computed<Log[]>(() => {
  return logs.value.filter(log => 
    log.action.includes('登录') || 
    log.action.includes('破解') || 
    log.details.includes('安全')
  )
})

/**
 * 获取级别样式类
 */
const getLevelClass = (level: string): string => {
  switch (level) {
    case 'success':
      return 'bg-green-100 text-green-600'
    case 'info':
      return 'bg-blue-100 text-blue-600'
    case 'warning':
      return 'bg-yellow-100 text-yellow-600'
    case 'error':
      return 'bg-red-100 text-red-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

/**
 * 获取级别文本
 */
const getLevelText = (level: string): string => {
  switch (level) {
    case 'success':
      return '成功'
    case 'info':
      return '信息'
    case 'warning':
      return '警告'
    case 'error':
      return '错误'
    default:
      return '未知'
  }
}

/**
 * 清空日志
 */
const clearLogs = (): void => {
  Modal.confirm({
    title: '清空日志',
    content: '确定要清空所有日志记录吗？此操作不可恢复。',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        logs.value = []
        message.success('日志清空成功')
      } catch (error) {
        message.error('日志清空失败')
      }
    }
  })
}

/**
 * 导出日志
 */
const exportLogs = (): void => {
  try {
    const csvContent = [
      ['时间', '级别', '模块', '用户', '操作', '详情', 'IP地址'],
      ...filteredLogs.value.map(log => [
        log.timestamp,
        getLevelText(log.level),
        log.module,
        log.user,
        log.action,
        log.details,
        log.ip
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `system_logs_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    message.success('日志导出成功')
  } catch (error) {
    message.error('日志导出失败')
  }
}

/**
 * 组件挂载时初始化数据
 */
onMounted((): void => {
  console.log('Logs 组件已挂载')
  // 设置默认日期范围为今天
  const today = new Date().toISOString().split('T')[0]
  dateRange.value.start = today
  dateRange.value.end = today
})
</script>

<style scoped>
.logs-management {
  padding: 0;
}
</style> 