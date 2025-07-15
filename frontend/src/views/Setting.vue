<template>
  <div class="setting-management">
    <!-- 页面头部 -->
    <div class="bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl p-8 text-white mb-8 shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold mb-2">系统设置</h1>
          <p class="text-gray-200">系统配置管理、用户权限设置和安全配置</p>
        </div>
        <div class="text-6xl opacity-20">
          ⚙️
        </div>
      </div>
    </div>
    
    <!-- 设置分类 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 基础设置 -->
      <div class="bg-white rounded-2xl shadow-lg p-6">
        <h3 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <i class="fas fa-cog text-gray-600 mr-3"></i>
          基础设置
        </h3>
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div>
              <p class="font-medium text-gray-800">系统名称</p>
              <p class="text-sm text-gray-500">学生报名及档案管理系统</p>
            </div>
            <button class="text-blue-600 hover:text-blue-800 transition-colors">
              <i class="fas fa-edit"></i>
            </button>
          </div>
          
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div>
              <p class="font-medium text-gray-800">系统版本</p>
              <p class="text-sm text-gray-500">v1.0.0</p>
            </div>
            <span class="text-sm text-green-600 font-medium">最新版本</span>
          </div>
          
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div>
              <p class="font-medium text-gray-800">系统语言</p>
              <p class="text-sm text-gray-500">简体中文</p>
            </div>
            <select class="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
          
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div>
              <p class="font-medium text-gray-800">时区设置</p>
              <p class="text-sm text-gray-500">UTC+8 (北京时间)</p>
            </div>
            <select class="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="Asia/Shanghai">UTC+8 (北京时间)</option>
              <option value="UTC">UTC (世界标准时间)</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- 安全设置 -->
      <div class="bg-white rounded-2xl shadow-lg p-6">
        <h3 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <i class="fas fa-shield-alt text-red-600 mr-3"></i>
          安全设置
        </h3>
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div>
              <p class="font-medium text-gray-800">密码策略</p>
              <p class="text-sm text-gray-500">最少8位，包含字母和数字</p>
            </div>
            <div class="flex items-center">
              <input type="checkbox" checked class="rounded mr-2">
              <span class="text-sm text-green-600 font-medium">已启用</span>
            </div>
          </div>
          
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div>
              <p class="font-medium text-gray-800">登录失败锁定</p>
              <p class="text-sm text-gray-500">连续失败5次后锁定30分钟</p>
            </div>
            <div class="flex items-center">
              <input type="checkbox" checked class="rounded mr-2">
              <span class="text-sm text-green-600 font-medium">已启用</span>
            </div>
          </div>
          
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div>
              <p class="font-medium text-gray-800">会话超时</p>
              <p class="text-sm text-gray-500">2小时无操作自动退出</p>
            </div>
            <select class="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="3600">1小时</option>
              <option value="7200" selected>2小时</option>
              <option value="14400">4小时</option>
            </select>
          </div>
          
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div>
              <p class="font-medium text-gray-800">IP白名单</p>
              <p class="text-sm text-gray-500">限制管理员登录IP</p>
            </div>
            <div class="flex items-center">
              <input type="checkbox" class="rounded mr-2">
              <span class="text-sm text-gray-600 font-medium">未启用</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 用户权限 -->
      <div class="bg-white rounded-2xl shadow-lg p-6">
        <h3 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <i class="fas fa-users-cog text-purple-600 mr-3"></i>
          用户权限
        </h3>
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div>
              <p class="font-medium text-gray-800">管理员权限</p>
              <p class="text-sm text-gray-500">系统完全控制权限</p>
            </div>
            <div class="flex items-center">
              <input type="checkbox" checked class="rounded mr-2">
              <span class="text-sm text-green-600 font-medium">已启用</span>
            </div>
          </div>
          
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div>
              <p class="font-medium text-gray-800">教师权限</p>
              <p class="text-sm text-gray-500">课程和学生管理权限</p>
            </div>
            <div class="flex items-center">
              <input type="checkbox" checked class="rounded mr-2">
              <span class="text-sm text-green-600 font-medium">已启用</span>
            </div>
          </div>
          
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div>
              <p class="font-medium text-gray-800">学生权限</p>
              <p class="text-sm text-gray-500">基础查看和报名权限</p>
            </div>
            <div class="flex items-center">
              <input type="checkbox" checked class="rounded mr-2">
              <span class="text-sm text-green-600 font-medium">已启用</span>
            </div>
          </div>
          
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div>
              <p class="font-medium text-gray-800">学生自主注册</p>
              <p class="text-sm text-gray-500">允许学生自主注册账户</p>
            </div>
            <div class="flex items-center">
              <input type="checkbox" checked class="rounded mr-2">
              <span class="text-sm text-green-600 font-medium">已启用</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 邮件设置 -->
    <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
        <i class="fas fa-envelope text-blue-600 mr-3"></i>
        邮件设置
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">SMTP服务器</label>
          <input 
            type="text" 
            placeholder="smtp.example.com"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">端口</label>
          <input 
            type="number" 
            placeholder="587"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
          <input 
            type="text" 
            placeholder="noreply@example.com"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
          <input 
            type="password" 
            placeholder="••••••••"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="md:col-span-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input type="checkbox" class="rounded mr-2">
              <label class="text-sm text-gray-700">启用SSL/TLS加密</label>
            </div>
            <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
              测试连接
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 短信设置 -->
    <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
        <i class="fas fa-sms text-green-600 mr-3"></i>
        短信设置
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">短信服务商</label>
          <select class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="aliyun">阿里云短信</option>
            <option value="tencent">腾讯云短信</option>
            <option value="huawei">华为云短信</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">AccessKey ID</label>
          <input 
            type="text" 
            placeholder="请输入AccessKey ID"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">AccessKey Secret</label>
          <input 
            type="password" 
            placeholder="请输入AccessKey Secret"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">短信签名</label>
          <input 
            type="text" 
            placeholder="学籍管理系统"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="md:col-span-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input type="checkbox" checked class="rounded mr-2">
              <label class="text-sm text-gray-700">启用短信验证码</label>
            </div>
            <button class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
              发送测试短信
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 系统维护 -->
    <div class="bg-white rounded-2xl shadow-lg p-6">
      <h3 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
        <i class="fas fa-tools text-orange-600 mr-3"></i>
        系统维护
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button 
          @click="backupDatabase"
          class="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
        >
          <div class="flex items-center mb-2">
            <i class="fas fa-database text-blue-600 mr-2"></i>
            <span class="font-medium text-gray-800">数据库备份</span>
          </div>
          <p class="text-sm text-gray-500">备份系统数据</p>
        </button>
        
        <button 
          @click="clearCache"
          class="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
        >
          <div class="flex items-center mb-2">
            <i class="fas fa-sync text-green-600 mr-2"></i>
            <span class="font-medium text-gray-800">清理缓存</span>
          </div>
          <p class="text-sm text-gray-500">清理系统缓存</p>
        </button>
        
        <button 
          @click="viewPerformance"
          class="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors text-left"
        >
          <div class="flex items-center mb-2">
            <i class="fas fa-chart-line text-yellow-600 mr-2"></i>
            <span class="font-medium text-gray-800">性能监控</span>
          </div>
          <p class="text-sm text-gray-500">查看系统性能</p>
        </button>
        
        <button 
          @click="exportSystemInfo"
          class="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
        >
          <div class="flex items-center mb-2">
            <i class="fas fa-info-circle text-purple-600 mr-2"></i>
            <span class="font-medium text-gray-800">系统信息</span>
          </div>
          <p class="text-sm text-gray-500">导出系统信息</p>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 系统设置页面
 * @component Setting
 * @description 系统配置和管理设置
 */
import { onMounted } from 'vue'

/**
 * 组件挂载时初始化数据
 */
onMounted((): void => {
  console.log('Setting 组件已挂载')
})

/**
 * 备份数据库
 */
const backupDatabase = () => {
  alert('数据库备份功能待实现')
}

/**
 * 清理缓存
 */
const clearCache = () => {
  alert('清理缓存功能待实现')
}

/**
 * 查看性能监控
 */
const viewPerformance = () => {
  alert('性能监控功能待实现')
}

/**
 * 导出系统信息
 */
const exportSystemInfo = () => {
  alert('导出系统信息功能待实现')
}
</script>

<style scoped>
.setting-management {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style> 