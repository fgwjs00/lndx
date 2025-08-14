<template>
    <div class="face-recognition-container">
      <!-- 摄像头区域 -->
      <div class="camera-section bg-white rounded-lg shadow-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">
            <i class="fas fa-camera mr-2 text-blue-500"></i>
            人脸识别签到
          </h3>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500">识别状态</span>
            <span 
              :class="getStatusClass(recognitionStatus)"
              class="px-2 py-1 rounded-full text-xs font-medium"
            >
              {{ getStatusText(recognitionStatus) }}
            </span>
          </div>
        </div>
  
        <!-- 摄像头显示区域 -->
        <div class="relative bg-gray-100 rounded-lg overflow-hidden" style="aspect-ratio: 4/3;">
          <video 
            ref="videoRef"
            v-show="!isPhotoTaken"
            autoplay 
            playsinline
            class="w-full h-full object-cover"
          ></video>
          
          <canvas 
            ref="canvasRef"
            v-show="isPhotoTaken"
            class="w-full h-full object-cover"
          ></canvas>
  
          <!-- 人脸框指示器 -->
          <div 
            v-if="faceDetected && !isPhotoTaken"
            class="absolute border-2 border-green-400 rounded-lg"
            :style="faceBoxStyle"
          >
            <div class="absolute -top-6 left-0 bg-green-400 text-white px-2 py-1 rounded text-xs">
              人脸已检测
            </div>
          </div>
  
          <!-- 拍照指导 -->
          <div 
            v-if="!faceDetected && cameraActive && !isPhotoTaken"
            class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
          >
            <div class="text-center text-white">
              <i class="fas fa-user-circle text-4xl mb-2"></i>
              <p class="text-lg">请将面部对准摄像头</p>
              <p class="text-sm opacity-75">确保光线充足，面部清晰可见</p>
            </div>
          </div>
  
          <!-- 加载指示器 -->
          <div 
            v-if="isProcessing"
            class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
          >
            <div class="text-center text-white">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p class="text-lg">正在识别...</p>
            </div>
          </div>
        </div>
  
        <!-- 控制按钮 -->
        <div class="flex justify-center gap-4 mt-6">
          <button
            v-if="!cameraActive"
            @click="startCamera"
            class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            :disabled="isProcessing"
          >
            <i class="fas fa-video mr-2"></i>
            启动摄像头
          </button>
  
          <button
            v-if="cameraActive && !isPhotoTaken"
            @click="takePhoto"
            :disabled="!faceDetected || isProcessing"
            class="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i class="fas fa-camera mr-2"></i>
            拍照识别
          </button>
  
          <button
            v-if="isPhotoTaken"
            @click="retakePhoto"
            class="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center"
            :disabled="isProcessing"
          >
            <i class="fas fa-redo mr-2"></i>
            重新拍照
          </button>
  
          <button
            v-if="cameraActive"
            @click="stopCamera"
            class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
            :disabled="isProcessing"
          >
            <i class="fas fa-stop mr-2"></i>
            停止摄像头
          </button>
        </div>
      </div>
  
      <!-- 识别结果 -->
      <div v-if="recognitionResult" class="result-section bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">
          <i class="fas fa-user-check mr-2 text-green-500"></i>
          识别结果
        </h3>
  
        <div v-if="recognitionResult.success" class="success-result">
          <div class="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                <i class="fas fa-check text-white text-xl"></i>
              </div>
              <div>
                <p class="font-medium text-green-800">识别成功</p>
                <p class="text-sm text-green-600">学员: {{ recognitionResult.studentName }}</p>
                <p class="text-xs text-green-500">置信度: {{ (recognitionResult.confidence * 100).toFixed(1) }}%</p>
              </div>
            </div>
            <button
              @click="confirmAttendance"
              class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              :disabled="isProcessing"
            >
              确认签到
            </button>
          </div>
        </div>
  
        <div v-else class="error-result">
          <div class="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mr-4">
              <i class="fas fa-times text-white text-xl"></i>
            </div>
            <div>
              <p class="font-medium text-red-800">识别失败</p>
              <p class="text-sm text-red-600">{{ recognitionResult.error || '未能识别出学员信息' }}</p>
              <p class="text-xs text-red-500">请重新拍照或联系管理员</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  /**
   * 人脸识别组件
   * @component FaceRecognition
   * @description 用于学员签到的人脸识别功能
   */
  import { ref, onMounted, onUnmounted } from 'vue'
  import { message } from 'ant-design-vue'
  import type { FaceRecognitionResult } from '@/types/index'
  
  // Props
  interface Props {
    courseId?: number
    sessionId?: number
  }
  
  // Emits
  interface Emits {
    (e: 'recognition-success', result: FaceRecognitionResult): void
    (e: 'attendance-confirmed', data: { studentId: number, confidence: number }): void
  }
  
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  
    // 响应式数据
  const videoRef = ref<HTMLVideoElement>()
  const canvasRef = ref<HTMLCanvasElement>()
  const cameraActive = ref<boolean>(false)
  const isPhotoTaken = ref<boolean>(false)
  const isProcessing = ref<boolean>(false)
  const faceDetected = ref<boolean>(false)
  const recognitionStatus = ref<'idle' | 'detecting' | 'processing' | 'success' | 'error'>('idle')
  const recognitionResult = ref<FaceRecognitionResult | null>(null)
  const faceBoxStyle = ref<any>({})
  
  let stream: MediaStream | null = null
  let faceDetectionInterval: number | null = null
  
  /**
   * 启动摄像头
   */
  const startCamera = async (): Promise<void> => {
    try {
      recognitionStatus.value = 'detecting'
      
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      })
      
      if (videoRef.value) {
        videoRef.value.srcObject = stream
        cameraActive.value = true
        
        // 开始人脸检测
        startFaceDetection()
        message.success('摄像头启动成功')
      }
    } catch (error) {
      console.error('启动摄像头失败:', error)
      message.error('无法访问摄像头，请检查权限设置')
      recognitionStatus.value = 'error'
    }
  }
  
  /**
   * 停止摄像头
   */
  const stopCamera = (): void => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      stream = null
    }
    
    cameraActive.value = false
    faceDetected.value = false
    isPhotoTaken.value = false
    recognitionStatus.value = 'idle'
    
    if (faceDetectionInterval) {
      clearInterval(faceDetectionInterval)
      faceDetectionInterval = null
    }
    
    message.info('摄像头已关闭')
  }
  
  /**
   * 开始人脸检测
   */
  const startFaceDetection = (): void => {
    // 模拟人脸检测（实际项目中需要使用真实的人脸检测库）
    faceDetectionInterval = setInterval(() => {
      if (videoRef.value && cameraActive.value && !isPhotoTaken.value) {
        // 模拟检测到人脸
        const detected = Math.random() > 0.3 // 70%概率检测到人脸
        faceDetected.value = detected
        
        if (detected) {
          // 模拟人脸框位
          faceBoxStyle.value = {
            left: '30%',
            top: '25%',
            width: '40%',
            height: '50%'
          }
        }
      }
    }, 1000)
  }
  
  /**
   * 拍照
   */
  const takePhoto = (): void => {
    if (!videoRef.value || !canvasRef.value) return
    
    const video = videoRef.value
    const canvas = canvasRef.value
    const context = canvas.getContext('2d')
    
    if (!context) return
    
    // 设置画布尺寸
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // 绘制视频帧到画布
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    isPhotoTaken.value = true
    
    // 开始人脸识别
    performFaceRecognition()
  }
  
  /**
   * 重新拍照
   */
  const retakePhoto = (): void => {
    isPhotoTaken.value = false
    recognitionResult.value = null
    recognitionStatus.value = 'detecting'
  }
  
  /**
   * 执行人脸识别
   */
  const performFaceRecognition = async (): Promise<void> => {
    isProcessing.value = true
    recognitionStatus.value = 'processing'
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 模拟识别结果
      const success = Math.random() > 0.2 // 80%成功
      
      if (success) {
        const mockStudents = [
          { id: 1, name: '张三' },
          { id: 2, name: '李四' },
          { id: 3, name: '王五' },
          { id: 4, name: '赵六' }
        ]
        
        const randomStudent = mockStudents[Math.floor(Math.random() * mockStudents.length)]
        const confidence = 0.85 + Math.random() * 0.1 // 85%-95%置信度
        
        recognitionResult.value = {
          success: true,
          confidence,
          studentId: randomStudent.id,
          studentName: randomStudent.name
        }
        
        recognitionStatus.value = 'success'
        emit('recognition-success', recognitionResult.value)
        message.success(`识别成功: ${randomStudent.name}`)
      } else {
        recognitionResult.value = {
          success: false,
          confidence: 0,
          error: '人脸特征不清晰或未在数据库中找到匹配'
        }
        
        recognitionStatus.value = 'error'
        message.error('人脸识别失败')
      }
    } catch (error) {
      console.error('人脸识别错误:', error)
      recognitionResult.value = {
        success: false,
        confidence: 0,
        error: '识别服务异常，请重试'
      }
      recognitionStatus.value = 'error'
      message.error('识别服务异常')
    } finally {
      isProcessing.value = false
    }
  }
  
  /**
   * 确认签到
   */
  const confirmAttendance = (): void => {
    if (recognitionResult.value?.success && recognitionResult.value.studentId) {
      emit('attendance-confirmed', {
        studentId: recognitionResult.value.studentId,
        confidence: recognitionResult.value.confidence
      })
      
      message.success('签到成功')
      
      // 重置状态
      setTimeout(() => {
        retakePhoto()
      }, 1500)
    }
  }
  
  /**
   * 获取状态样式类
   */
  const getStatusClass = (status: string): string => {
    const classes = {
      idle: 'bg-gray-100 text-gray-600',
      detecting: 'bg-blue-100 text-blue-600',
      processing: 'bg-yellow-100 text-yellow-600',
      success: 'bg-green-100 text-green-600',
      error: 'bg-red-100 text-red-600'
    }
    return classes[status as keyof typeof classes] || classes.idle
  }
  
  /**
   * 获取状态文本
   */
  const getStatusText = (status: string): string => {
    const texts = {
      idle: '待机',
      detecting: '检测中',
        processing: '识别中',
      success: '成功',
      error: '失败'
    }
    return texts[status as keyof typeof texts] || '未知'
  }
  
  // 生命周期
  onMounted(() => {
    // 检查浏览器支持
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      message.error('您的浏览器不支持摄像头功能')
    }
  })
  
  onUnmounted(() => {
    stopCamera()
  })
  </script>
  
  <style scoped>
  .face-recognition-container {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .camera-section video,
  .camera-section canvas {
    border-radius: 8px;
  }
  
  .result-section {
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  </style>
