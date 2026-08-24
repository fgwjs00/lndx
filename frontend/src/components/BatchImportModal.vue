<template>
  <a-modal
    :open="open"
    title="批量导入课程"
    width="800px"
    :footer="null"
    @cancel="handleCancel"
  >
    <div class="batch-import-container">
      <!-- 步骤指示器 -->
      <div class="steps-container mb-6">
        <div class="flex justify-center">
          <div class="flex items-center space-x-4">
            <div class="flex items-center">
              <div class="step-circle" :class="{ 'active': currentStep >= 1, 'completed': currentStep > 1 }">1</div>
              <span class="step-text">选择文件</span>
            </div>
            <div class="step-line" :class="{ 'active': currentStep > 1 }"></div>
            <div class="flex items-center">
              <div class="step-circle" :class="{ 'active': currentStep >= 2, 'completed': currentStep > 2 }">2</div>
              <span class="step-text">数据预览</span>
            </div>
            <div class="step-line" :class="{ 'active': currentStep > 2 }"></div>
            <div class="flex items-center">
              <div class="step-circle" :class="{ 'active': currentStep >= 3 }">3</div>
              <span class="step-text">导入结果</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤1：选择文件 -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="mb-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">选择导入文件</h3>
            <a-button type="link" @click="downloadTemplate" :loading="templateLoading">
              <i class="fas fa-download mr-2"></i>
              下载模板
            </a-button>
          </div>
          
          <a-upload-dragger
            :file-list="fileList"
            :before-upload="beforeUpload"
            @remove="handleRemove"
            accept=".xlsx,.xls,.csv"
            :multiple="false"
          >
            <p class="ant-upload-drag-icon">
              <i class="fas fa-file-excel text-4xl text-green-500"></i>
            </p>
            <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p class="ant-upload-hint">
              支持Excel (.xlsx, .xls) 和 CSV 文件，文件大小不超过5MB
            </p>
          </a-upload-dragger>
        </div>

        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="text-sm font-semibold text-blue-800 mb-2">📋 导入说明：</h4>
          <ul class="text-sm text-blue-700 space-y-1">
            <li>• 请确保Excel文件包含所有必需字段（课程名称、院系、年级/类型等）</li>
            <li>• <strong>必填字段</strong>：课程名称、院系、年级/类型、学期</li>
            <li>• <strong>格式说明</strong>：容量为数字，年龄限制格式如"50-80岁"，状态可填"已发布"/"草稿"</li>
            <li>• 建议先下载模板，按照模板格式填写数据</li>
            <li>• 重复的课程名称和学期组合将被跳过</li>
            <li>• 导入过程中如遇到错误，会显示详细的错误信息</li>
          </ul>
        </div>

        <div class="flex justify-end mt-6">
          <a-space>
            <a-button @click="handleCancel">取消</a-button>
            <a-button type="primary" @click="parseFile" :disabled="!selectedFile" :loading="parsing">
              解析文件
            </a-button>
          </a-space>
        </div>
      </div>

      <!-- 步骤2：数据预览 -->
      <div v-if="currentStep === 2" class="step-content">
        <div class="mb-4">
          <h3 class="text-lg font-semibold mb-4">数据预览</h3>
          <div class="mb-4 p-4 bg-gray-50 rounded-lg">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; font-size: 14px;">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">{{ previewData.length }}</div>
                <div class="text-gray-600">总行数</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">{{ validRows }}</div>
                <div class="text-gray-600">有效行</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-red-600">{{ errorRows }}</div>
                <div class="text-gray-600">错误行</div>
              </div>
            </div>
          </div>

          <!-- 数据表格 -->
          <div class="max-h-96 overflow-y-auto border rounded-lg">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th class="px-4 py-2 text-left">行号</th>
                  <th class="px-4 py-2 text-left">课程编号</th>
                  <th class="px-4 py-2 text-left">课程名称</th>
                  <th class="px-4 py-2 text-left">院系</th>
                  <th class="px-4 py-2 text-left">年级/类型</th>
                  <th class="px-4 py-2 text-left">容量</th>
                  <th class="px-4 py-2 text-left">状态</th>
                  <th class="px-4 py-2 text-left">错误信息</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in previewData"
                  :key="index"
                  :class="row.hasError ? 'bg-red-50' : 'bg-white'"
                >
                  <td class="px-4 py-2">{{ index + 2 }}</td>
                  <td class="px-4 py-2">{{ row.课程编号 || 'AUTO' }}</td>
                  <td class="px-4 py-2">{{ row.课程名称 || '-' }}</td>
                  <td class="px-4 py-2">{{ row.院系 || '-' }}</td>
                  <td class="px-4 py-2">{{ row['年级/类型'] || '-' }}</td>
                  <td class="px-4 py-2">{{ row.容量 || '-' }}</td>
                  <td class="px-4 py-2">
                    <a-tag :color="row.hasError ? 'red' : 'green'">
                      {{ row.hasError ? '错误' : '正常' }}
                    </a-tag>
                  </td>
                  <td class="px-4 py-2">
                    <span v-if="row.hasError" class="text-red-600 text-xs">
                      {{ row.errorMessage }}
                    </span>
                    <span v-else class="text-green-600 text-xs">✓</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex justify-between mt-6">
          <a-button @click="currentStep = 1">
            <i class="fas fa-arrow-left mr-2"></i>
            上一步
          </a-button>
          <a-space>
            <a-button @click="handleCancel">取消</a-button>
            <a-button
              type="primary"
              @click="startImport"
              :disabled="validRows === 0"
              :loading="importing"
            >
              开始导入 ({{ validRows }} 条)
            </a-button>
          </a-space>
        </div>
      </div>

      <!-- 步骤3：导入结果 -->
      <div v-if="currentStep === 3" class="step-content">
        <div class="text-center mb-6">
          <div class="mb-4">
            <i class="fas fa-check-circle text-6xl text-green-500" v-if="importResult.errorCount === 0"></i>
            <i class="fas fa-exclamation-triangle text-6xl text-yellow-500" v-else></i>
          </div>
          <h3 class="text-xl font-semibold mb-2">导入完成</h3>
        </div>

        <div class="mb-6">
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="text-center p-4 bg-blue-50 rounded-lg">
              <div class="text-2xl font-bold text-blue-600">{{ importResult.totalRows || 0 }}</div>
              <div class="text-gray-600">总处理数</div>
            </div>
            <div class="text-center p-4 bg-green-50 rounded-lg">
              <div class="text-2xl font-bold text-green-600">{{ importResult.successCount || 0 }}</div>
              <div class="text-gray-600">成功导入</div>
            </div>
            <div class="text-center p-4 bg-red-50 rounded-lg">
              <div class="text-2xl font-bold text-red-600">{{ importResult.errorCount || 0 }}</div>
              <div class="text-gray-600">导入失败</div>
            </div>
          </div>

          <!-- 错误列表 -->
          <div v-if="importResult.errors && importResult.errors.length > 0" class="mb-4">
            <h4 class="font-semibold mb-2 text-red-600">错误详情：</h4>
            <div class="max-h-40 overflow-y-auto bg-red-50 rounded-lg p-3">
              <ul class="text-sm text-red-700 space-y-1">
                <li v-for="(error, index) in importResult.errors" :key="index">
                  • {{ error }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="text-center">
          <a-space>
            <a-button @click="resetModal">再次导入</a-button>
            <a-button type="primary" @click="handleSuccess">完成</a-button>
          </a-space>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * 课程批量导入组件
 * @component BatchImportModal
 * @description 支持Excel和CSV文件的批量导入功能
 */
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { CourseService } from '@/api/course'

// Props
interface Props {
  open: boolean
}

// Emits
interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

// Reactive data
const currentStep = ref<number>(1)
const fileList = ref<any[]>([])
const selectedFile = ref<File | null>(null)
const previewData = ref<any[]>([])
const templateLoading = ref<boolean>(false)
const parsing = ref<boolean>(false)
const importing = ref<boolean>(false)
const importResult = ref<{
  totalRows: number
  successCount: number
  errorCount: number
  errors: string[]
}>({
  totalRows: 0,
  successCount: 0,
  errorCount: 0,
  errors: []
})

// Computed
const validRows = computed(() => {
  return previewData.value.filter(row => !row.hasError).length
})

const errorRows = computed(() => {
  return previewData.value.filter(row => row.hasError).length
})

/**
 * 下载模板
 */
const downloadTemplate = async (): Promise<void> => {
  try {
    templateLoading.value = true
    const blob = await CourseService.downloadImportTemplate()
    
    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '课程导入模板.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    message.success('模板下载成功')
  } catch (error) {
    console.error('模板下载失败:', error)
    message.error('模板下载失败')
  } finally {
    templateLoading.value = false
  }
}

/**
 * 文件上传前处理
 */
const beforeUpload = (file: File): boolean => {
  // 验证文件类型
  const validTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ]
  
  if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
    message.error('只支持Excel和CSV文件')
    return false
  }

  // 验证文件大小 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    message.error('文件大小不能超过5MB')
    return false
  }

  selectedFile.value = file
  fileList.value = [file]
  
  return false // 阻止自动上传
}

/**
 * 移除文件
 */
const handleRemove = (): void => {
  selectedFile.value = null
  fileList.value = []
  previewData.value = []
}

/**
 * 解析文件
 */
const parseFile = async (): Promise<void> => {
  if (!selectedFile.value) return

  try {
    parsing.value = true
    
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        
        // 使用XLSX库解析Excel文件
        const { read, utils } = await import('xlsx')
        const workbook = read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const rawData = utils.sheet_to_json(worksheet) as any[]
        
        console.log('解析的原始数据:', rawData)
        
        if (!rawData || rawData.length === 0) {
          message.error('文件中没有找到有效数据')
          parsing.value = false
          return
        }
        
        // 处理预览数据并进行基本验证
        const processedData = rawData.map((row: any) => {
          const errors: string[] = []
          
          // 🔧 修复：基本验证 - 使用新的字段名称
          if (!row['课程名称']) {
            errors.push('课程名称不能为空')
          }
          if (!row['院系']) {
            errors.push('院系不能为空')
          }
          if (row['容量'] && isNaN(parseInt(row['容量']))) {
            errors.push('容量必须是有效数字')
          }
          
          return {
            ...row,
            hasError: errors.length > 0,
            errorMessage: errors.join('; ')
          }
        })
        
        previewData.value = processedData
        currentStep.value = 2
        message.success(`文件解析成功，共解析出 ${processedData.length} 条数据`)
        
      } catch (error) {
        console.error('文件解析错误:', error)
        message.error('文件格式错误，请检查文件内容')
      } finally {
        parsing.value = false
      }
    }
    
    reader.onerror = () => {
      message.error('文件读取失败')
      parsing.value = false
    }
    
    reader.readAsArrayBuffer(selectedFile.value)
    
  } catch (error) {
    console.error('文件解析失败:', error)
    message.error('文件解析失败')
    parsing.value = false
  }
}

/**
 * 开始导入
 */
const startImport = async (): Promise<void> => {
  if (!selectedFile.value) return

  try {
    importing.value = true
    const response = await CourseService.batchImportCourses(selectedFile.value)
    
    importResult.value = response.data
    currentStep.value = 3
    
    if (response.data.errorCount === 0) {
      message.success(`成功导入 ${response.data.successCount} 门课程`)
    } else {
      message.warning(`导入完成：成功 ${response.data.successCount} 门，失败 ${response.data.errorCount} 门`)
    }
    
  } catch (error: any) {
    console.error('批量导入失败:', error)
    message.error(error?.response?.data?.message || '导入失败')
  } finally {
    importing.value = false
  }
}

/**
 * 重置模态框
 */
const resetModal = (): void => {
  currentStep.value = 1
  fileList.value = []
  selectedFile.value = null
  previewData.value = []
  importResult.value = {
    totalRows: 0,
    successCount: 0,
    errorCount: 0,
    errors: []
  }
}

/**
 * 取消操作
 */
const handleCancel = (): void => {
  resetModal()
  emit('update:open', false)
}

/**
 * 导入成功
 */
const handleSuccess = (): void => {
  resetModal()
  emit('update:open', false)
  emit('success')
}
</script>

<style scoped>
.batch-import-container .step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  background-color: #e5e7eb;
  color: #6b7280;
}

.batch-import-container .step-circle.active {
  background-color: #3b82f6;
  color: white;
}

.batch-import-container .step-circle.completed {
  background-color: #10b981;
  color: white;
}

.batch-import-container .step-text {
  margin-left: 8px;
  font-size: 14px;
  color: #4b5563;
}

.batch-import-container .step-line {
  width: 80px;
  height: 2px;
  background-color: #e5e7eb;
}

.batch-import-container .step-line.active {
  background-color: #3b82f6;
}

.ant-upload-drag-icon {
  margin-bottom: 16px;
}

.ant-upload-text {
  font-size: 18px;
  color: #4b5563;
}

.ant-upload-hint {
  font-size: 14px;
  color: #9ca3af;
}
</style>
