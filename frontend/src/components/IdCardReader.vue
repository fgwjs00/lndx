<template>
  <div class="id-card-reader">
    <!-- 优化的读卡器控制面板 - 一行显示 -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex items-center justify-between">
        <!-- 左侧：标题和状态 -->
        <div class="flex items-center space-x-4">
          <div class="flex items-center">
            <i class="fas fa-id-card text-blue-500 mr-2 text-lg"></i>
            <span class="text-base font-medium text-gray-700">身份证读卡器</span>
          </div>
          <div class="flex items-center space-x-2">
            <div 
              class="w-3 h-3 rounded-full"
              :class="readerState.connected ? 'bg-green-500' : 'bg-red-500'"
            ></div>
            <span class="text-sm text-gray-500 flex items-center">
              {{ readerState.connected ? '已连接' : '未连接' }}
              <!-- 控件下载气泡提示始终显示 -->
              <a-tooltip placement="right">
                <template #title>
                  <span>
                    如未安装控件请
                    <a
                      href="https://cqc-download.weiyun.com/ftn_handler/a116f8dbc9491f71da294c6c6409fadcf54569c3de6a41673f95ff2690826764835ab859bcad1df4c2534bc748f140d8af949aa8fb9b3b239bcd16c8f3bba740/5%E3%80%81%E4%B8%9C%E4%BF%A1EST%E7%B3%BB%E5%88%97%E8%B0%B7%E6%AD%8C%E7%81%AB%E7%8B%90%E7%BD%91%E9%A1%B5%E6%8E%A7%E4%BB%B6V5.0.3-20210730.zip?fname=5%E3%80%81%E4%B8%9C%E4%BF%A1EST%E7%B3%BB%E5%88%97%E8%B0%B7%E6%AD%8C%E7%81%AB%E7%8B%90%E7%BD%91%E9%A1%B5%E6%8E%A7%E4%BB%B6V5.0.3-20210730.zip&from=30113&version=3.3.3.3"
                      target="_blank"
                      class="text-blue-500 underline ml-1"
                    >点击下载</a>
                  </span>
                </template>
                <i class="fas fa-question-circle text-blue-400 ml-1 cursor-pointer"></i>
              </a-tooltip>
            </span>
          </div>
        </div>

        <!-- 右侧：操作按钮 -->
        <div class="flex items-center">
          <a-button
            @click="readIdCard"
            :loading="readerState.reading"
            :disabled="!readerState.connected"
            size="default"
            type="primary"
          >
            <i class="fas fa-credit-card mr-2"></i>
            读取身份证
          </a-button>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="readerState.lastError" class="mt-3">
        <a-alert
          :message="readerState.lastError"
          type="error"
          show-icon
          closable
          @close="readerState.lastError = ''"
          class="text-sm"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 身份证读卡器组件
 * @component IdCardReader
 * @description 基于东信EST系列身份证读卡器的Vue 3组件，支持身份证信息读取和自动填充
 */
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import type { IdCardData, IdCardReaderMessage, IdCardReaderConfig, IdCardReaderState } from '@/types'
import dayjs from 'dayjs'

// 定义事件
const emit = defineEmits<{
  dataRead: [data: IdCardData]
  photoRead: [photo: string]
  error: [error: string]
}>()

// 响应式数据
const socket = ref<WebSocket | null>(null)
const idCardData = ref<IdCardData | null>(null)

// 读卡器状态
const readerState = reactive<IdCardReaderState>({
  connected: false,
  reading: false,
  autoReading: false,
  deviceInfo: '',
  lastError: '',
  reconnectAttempts: 0
})

// 读卡器配置
const config: IdCardReaderConfig = {
  host: 'ws://127.0.0.1:33666',
  autoConnect: true,
  reconnectInterval: 3000,
  maxReconnectAttempts: 5
}

/**
 * 连接读卡器
 */
const connectReader = async (): Promise<void> => {
  if (socket.value?.readyState === WebSocket.OPEN) {
    return
  }

  readerState.lastError = ''

  try {
    socket.value = new WebSocket(config.host)
    
    socket.value.onopen = () => {
      readerState.connected = true
      readerState.reconnectAttempts = 0
      // 获取设备信息
      getVersion()
    }

    socket.value.onclose = () => {
      readerState.connected = false
      readerState.reading = false
      readerState.autoReading = false
      
      // 自动重连
      if (readerState.reconnectAttempts < config.maxReconnectAttempts) {
        setTimeout(() => {
          readerState.reconnectAttempts++
          connectReader()
        }, config.reconnectInterval)
      }
    }

    socket.value.onerror = () => {
      readerState.lastError = '请检查读卡器控件是否正常安装'
      emit('error', '连接失败，请检查控件安装')
    }

    socket.value.onmessage = (event) => {
      handleMessage(event.data)
    }
  } catch (error) {
    readerState.lastError = '连接失败，请检查控件安装'
    emit('error', '连接异常')
  }
}

/**
 * 处理WebSocket消息
 */
const handleMessage = (data: string): void => {
  try {
    const message: IdCardReaderMessage = JSON.parse(data)
    
    switch (message.fun) {
      case 'EST_GetVersion#':
        if (message.rCode === '0') {
          readerState.deviceInfo = message.errMsg
        }
        break

      case 'EST_Reader_ReadIDCard#':
        handleIdCardRead(message)
        break

      default:
        break
    }
  } catch (error) {
    console.error('消息解析失败:', error)
  }
}

/**
 * 处理身份证读取结果
 */
const handleIdCardRead = (message: IdCardReaderMessage): void => {
  readerState.reading = false

  if (message.rCode === '0') {
    const cardData: IdCardData = {
      name: message.name,
      sex: message.sex,
      nation: message.nation,
      birth: message.birth,
      address: message.address,
      certNo: message.certNo,
      department: message.department,
      effectData: message.effectData,
      expire: message.expire,
      base64Data: message.base64Data,
      imageFront: message.imageFront,
      imageBack: message.imageBack
    }

    // 直接触发填充事件，不保存数据到组件内部
    emit('dataRead', cardData)
    if (cardData.base64Data) {
      emit('photoRead', `data:image/jpeg;base64,${cardData.base64Data}`)
    }
    
  } else if (message.rCode === '-2') {
    // 请放置身份证
    message.warning('请将身份证放置在读卡器上')
  } else {
    readerState.lastError = message.errMsg
    emit('error', message.errMsg)
  }
}

/**
 * 单次读取身份证
 */
const readIdCard = (): void => {
  if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
    message.error('设备未连接')
    return
  }

  readerState.reading = true
  socket.value.send('EST_Reader_ReadIDCard#')
}

/**
 * 获取设备版本
 */
const getVersion = (): void => {
  if (socket.value?.readyState === WebSocket.OPEN) {
    socket.value.send('EST_GetVersion#')
  }
}



/**
 * 格式化日期
 */
const formatDate = (dateStr: string): string => {
  if (!dateStr) return ''
  
  // 身份证日期格式通常是YYYYMMDD
  if (dateStr.length === 8) {
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
  }
  
  return dateStr
}



/**
 * 组件挂载时自动连接
 */
onMounted((): void => {
  if (config.autoConnect) {
    connectReader()
  }
})

/**
 * 组件卸载时关闭连接
 */
onUnmounted((): void => {
  if (socket.value) {
    socket.value.close()
  }
})
</script>

<style scoped>
.id-card-reader {
  max-width: 100%;
}

/* 使用原生CSS替代@apply指令 */
:deep(.ant-btn) {
  border-radius: 0.5rem;
  font-weight: 500;
}

:deep(.ant-alert) {
  border-radius: 0.5rem;
}

:deep(.ant-modal-content) {
  border-radius: 1rem;
}

:deep(.ant-modal-header) {
  border-radius: 1rem 1rem 0 0;
}

/* 照片hover效果 */
.id-card-reader img {
  transition: transform 0.3s ease;
}

.id-card-reader img:hover {
  transform: scale(1.05);
}
</style> 