<template>
  <div class="analysis-management">
    <!-- 页面头部 -->
    <div class="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-8 text-white mb-8 shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold mb-2">数据分析</h1>
          <p class="text-cyan-100">学生数据统计分析、报表生成和趋势预测</p>
          <div class="mt-3 flex items-center text-cyan-200 text-sm">
            <i class="fas fa-clock mr-2"></i>
            <span>最后更新：{{ lastUpdateTime }}</span>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <a-button 
            type="primary" 
            ghost 
            :loading="loading" 
            @click="refreshAllData"
            class="border-white text-white hover:bg-white hover:text-cyan-500 transition-all duration-300"
          >
            <i class="fas fa-sync-alt mr-2"></i>
            刷新数据
          </a-button>
          <div class="text-6xl opacity-20">
            📊
          </div>
        </div>
      </div>
    </div>
    
    <!-- 核心统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      <!-- 报名成功率卡片 -->
      <div class="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
        <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-20 flex items-center justify-center">
          <a-spin size="large" />
        </div>
        <div class="flex items-center justify-between" :class="{ 'opacity-50': loading }">
          <div>
            <h3 class="text-3xl font-bold mb-1">
              <a-statistic 
                :value="overviewStats.successRate" 
                suffix="%" 
                :value-style="{ color: 'white', fontSize: '32px', fontWeight: 'bold' }"
                :loading="loading"
              />
            </h3>
            <p class="text-cyan-100 text-sm font-medium">报名成功率</p>
            <div class="mt-2 text-xs text-cyan-200">
              {{ overviewStats.approvedEnrollments }}/{{ overviewStats.totalEnrollments }} 通过
            </div>
          </div>
          <div class="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <i class="fas fa-chart-line text-white text-2xl"></i>
          </div>
        </div>
        <!-- 装饰性动画元素 -->
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
        <div class="absolute -right-8 -top-8 w-32 h-32 bg-white bg-opacity-5 rounded-full"></div>
      </div>
      
      <!-- 活跃学生卡片 -->
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
        <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-20 flex items-center justify-center">
          <a-spin size="large" />
        </div>
        <div class="flex items-center justify-between" :class="{ 'opacity-50': loading }">
          <div>
            <h3 class="text-3xl font-bold mb-1">
              <a-statistic 
                :value="overviewStats.totalStudents || 0" 
                :value-style="{ color: 'white', fontSize: '32px', fontWeight: 'bold' }"
                :loading="loading"
              />
            </h3>
            <p class="text-blue-100 text-sm font-medium">活跃学生</p>
            <div class="mt-2 text-xs text-blue-200">
              平均年龄 {{ overviewStats.averageAge }} 岁
            </div>
          </div>
          <div class="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <i class="fas fa-users text-white text-2xl"></i>
          </div>
        </div>
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
        <div class="absolute -right-8 -top-8 w-32 h-32 bg-white bg-opacity-5 rounded-full"></div>
      </div>
      
      <!-- 总报名人次卡片 -->
      <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
        <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-20 flex items-center justify-center">
          <a-spin size="large" />
        </div>
        <div class="flex items-center justify-between" :class="{ 'opacity-50': loading }">
          <div>
            <h3 class="text-3xl font-bold mb-1">
              <a-statistic 
                :value="overviewStats.totalEnrollments || 0" 
                :value-style="{ color: 'white', fontSize: '32px', fontWeight: 'bold' }"
                :loading="loading"
              />
            </h3>
            <p class="text-green-100 text-sm font-medium">总报名人次</p>
            <div class="mt-2 text-xs text-green-200">
              平均 {{ (overviewStats.totalEnrollments / overviewStats.totalStudents || 0).toFixed(1) }} 门/人
            </div>
          </div>
          <div class="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <i class="fas fa-graduation-cap text-white text-2xl"></i>
          </div>
        </div>
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
        <div class="absolute -right-8 -top-8 w-32 h-32 bg-white bg-opacity-5 rounded-full"></div>
      </div>
      
      <!-- 开设课程卡片 -->
      <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
        <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-20 flex items-center justify-center">
          <a-spin size="large" />
        </div>
        <div class="flex items-center justify-between" :class="{ 'opacity-50': loading }">
          <div>
            <h3 class="text-3xl font-bold mb-1">
              <a-statistic 
                :value="overviewStats.totalCourses || 0" 
                :value-style="{ color: 'white', fontSize: '32px', fontWeight: 'bold' }"
                :loading="loading"
              />
            </h3>
            <p class="text-purple-100 text-sm font-medium">开设课程</p>
            <div class="mt-2 text-xs text-purple-200">
              {{ overviewStats.activeTeachers }} 名教师
            </div>
          </div>
          <div class="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <i class="fas fa-chalkboard-teacher text-white text-2xl"></i>
          </div>
        </div>
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
        <div class="absolute -right-8 -top-8 w-32 h-32 bg-white bg-opacity-5 rounded-full"></div>
      </div>
    </div>
    

    <!-- 新增统计模块 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- 综合统计概览 -->
      <div class="bg-white rounded-xl shadow-lg p-6 relative">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-bold text-gray-800 flex items-center">
            <i class="fas fa-chart-pie text-purple-600 mr-2"></i>
            综合数据概览
          </h3>
          <a-spin v-if="loading" size="small" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{{ comprehensiveStats.totalStudents }}</div>
            <div class="text-sm text-blue-500">总学生数</div>
          </div>
          <div class="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{{ comprehensiveStats.totalEnrollments }}</div>
            <div class="text-sm text-green-500">总报名人次</div>
          </div>
          <div class="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
            <div class="text-2xl font-bold text-yellow-600">{{ comprehensiveStats.totalCourses }}</div>
            <div class="text-sm text-yellow-500">总课程数</div>
          </div>
          <div class="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <div class="text-2xl font-bold text-purple-600">{{ comprehensiveStats.totalLocations }}</div>
            <div class="text-sm text-purple-500">教学点数</div>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex justify-between text-sm text-gray-600">
            <span>平均每人报名：<span class="font-semibold text-gray-800">{{ comprehensiveStats.avgEnrollmentPerStudent }} 门</span></span>
            <span>平均每课报名：<span class="font-semibold text-gray-800">{{ comprehensiveStats.avgEnrollmentPerCourse }} 人</span></span>
          </div>
        </div>
      </div>

      <!-- 政治面貌统计 -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-bold text-gray-800 flex items-center">
            <i class="fas fa-flag text-red-600 mr-2"></i>
            政治面貌分布
          </h3>
          <div class="text-xs text-gray-500">
            共 {{ politicalStats.summary.totalCount }} 人
          </div>
        </div>
        
        <!-- 党员重点展示 -->
        <div class="mb-6 p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-xl text-white">
          <div class="flex justify-between items-center">
            <div>
              <div class="text-red-100 text-sm font-medium">中共党员</div>
              <div class="text-3xl font-bold">{{ politicalStats.summary.partyMemberCount }}</div>
              <div class="text-red-200 text-xs">占总人数 {{ politicalStats.summary.partyMemberPercentage }}%</div>
            </div>
            <div class="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <i class="fas fa-star text-white text-2xl"></i>
            </div>
          </div>
          <div class="mt-3 bg-white bg-opacity-20 rounded-full h-2">
            <div 
              class="bg-white h-2 rounded-full transition-all duration-500"
              :style="{ width: `${politicalStats.summary.partyMemberPercentage}%` }"
            ></div>
          </div>
        </div>
        
        <!-- 详细分布 -->
        <div class="space-y-3 max-h-64 overflow-y-auto">
          <div 
            v-for="(stat, index) in politicalStats.stats" 
            :key="stat.politicalStatus"
            class="p-3 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md"
            :class="{
              'bg-red-50 border-red-500': stat.isPartyMember,
              'bg-blue-50 border-blue-400': stat.politicalStatus.includes('团员'),
              'bg-gray-50 border-gray-400': !stat.isPartyMember && !stat.politicalStatus.includes('团员')
            }"
          >
            <div class="flex justify-between items-center">
              <div class="flex items-center">
                <span class="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full mr-3"
                      :class="{
                        'bg-red-500 text-white': stat.isPartyMember,
                        'bg-blue-500 text-white': stat.politicalStatus.includes('团员'),
                        'bg-gray-500 text-white': !stat.isPartyMember && !stat.politicalStatus.includes('团员')
                      }">
                  {{ index + 1 }}
                </span>
                <div>
                  <div class="font-medium text-gray-800 text-sm">{{ stat.politicalStatus }}</div>
                  <div class="text-xs text-gray-500">{{ stat.percentage }}% 占比</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xl font-bold"
                     :class="{
                       'text-red-600': stat.isPartyMember,
                       'text-blue-600': stat.politicalStatus.includes('团员'),
                       'text-gray-600': !stat.isPartyMember && !stat.politicalStatus.includes('团员')
                     }">
                  {{ stat.studentCount }}
                </div>
                <div class="text-xs text-gray-500">人</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 校区与专业统计 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- 教学点统计 -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-bold text-gray-800 flex items-center">
            <i class="fas fa-map-marker-alt text-green-600 mr-2"></i>
            教学点统计
          </h3>
          <div class="text-xs text-gray-500">
            共 {{ campusStats.length }} 个教学点
          </div>
        </div>
        
        <!-- 前三名教学点特殊展示 -->
        <div class="grid grid-cols-1 gap-3 mb-6">
          <div 
            v-for="(campus, index) in campusStats.slice(0, 3)" 
            :key="campus.location"
            class="p-4 rounded-xl transition-all duration-300 hover:shadow-lg"
            :class="{
              'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white': index === 0,
              'bg-gradient-to-r from-gray-400 to-gray-500 text-white': index === 1,
              'bg-gradient-to-r from-orange-400 to-orange-500 text-white': index === 2
            }"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <i v-if="index === 0" class="fas fa-crown text-white text-lg"></i>
                  <i v-else-if="index === 1" class="fas fa-medal text-white text-lg"></i>
                  <i v-else class="fas fa-award text-white text-lg"></i>
                </div>
                <div>
                  <div class="font-bold text-lg">{{ campus.location }}</div>
                  <div class="text-xs opacity-80">第{{ index + 1 }}名教学点</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold">{{ campus.studentCount }}</div>
                <div class="text-xs opacity-80">学生数</div>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-white border-opacity-20">
              <div class="text-center">
                <div class="font-bold text-lg">{{ campus.studentCount }}</div>
                <div class="text-xs opacity-80">学生</div>
              </div>
              <div class="text-center">
                <div class="font-bold text-lg">{{ campus.enrollmentCount }}</div>
                <div class="text-xs opacity-80">报名</div>
              </div>
              <div class="text-center">
                <div class="font-bold text-lg">{{ campus.courseCount }}</div>
                <div class="text-xs opacity-80">课程</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 其他教学点 -->
        <div v-if="campusStats.length > 3" class="space-y-2 max-h-40 overflow-y-auto">
          <div class="text-xs text-gray-500 font-medium mb-2 px-2">其他教学点</div>
          <div 
            v-for="(campus, index) in campusStats.slice(3)" 
            :key="campus.location"
            class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 border-l-4 border-green-400"
          >
            <div class="flex justify-between items-center">
              <div class="flex items-center">
                <span class="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white text-xs font-bold rounded-full mr-3">
                  {{ index + 4 }}
                </span>
                <div>
                  <div class="font-medium text-gray-800 text-sm">{{ campus.location }}</div>
                  <div class="text-xs text-gray-500">活跃度排名</div>
                </div>
              </div>
              <div class="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div class="font-bold text-blue-600">{{ campus.studentCount }}</div>
                  <div class="text-xs text-gray-500">学生</div>
                </div>
                <div>
                  <div class="font-bold text-green-600">{{ campus.enrollmentCount }}</div>
                  <div class="text-xs text-gray-500">报名</div>
                </div>
                <div>
                  <div class="font-bold text-purple-600">{{ campus.courseCount }}</div>
                  <div class="text-xs text-gray-500">课程</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 专业分布统计 -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-bold text-gray-800 flex items-center">
            <i class="fas fa-graduation-cap text-blue-600 mr-2"></i>
            专业分布统计
          </h3>
          <div class="text-xs text-gray-500">
            共 {{ majorStats.length }} 个专业
          </div>
        </div>
        
        <div class="space-y-4 max-h-80 overflow-y-auto">
          <div 
            v-for="(major, index) in majorStats" 
            :key="major.major"
            class="p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300"
            :class="{
              'bg-gradient-to-r from-blue-500 to-blue-600 text-white': index === 0,
              'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white': index === 1,
              'bg-gradient-to-r from-purple-500 to-purple-600 text-white': index === 2,
              'bg-gradient-to-r from-blue-50 to-indigo-50': index > 2
            }"
          >
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                     :class="{
                       'bg-white bg-opacity-20': index < 3,
                       'bg-blue-500 text-white': index >= 3
                     }">
                  <span class="text-sm font-bold">{{ index + 1 }}</span>
                </div>
                <div>
                  <div class="font-bold text-lg"
                       :class="{ 'text-white': index < 3, 'text-gray-800': index >= 3 }">
                    {{ major.major }}
                  </div>
                  <div class="text-sm"
                       :class="{ 'text-white text-opacity-80': index < 3, 'text-gray-600': index >= 3 }">
                    平均 {{ major.averageEnrollment.toFixed(1) }} 门课程/人
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold"
                     :class="{ 'text-white': index < 3, 'text-blue-600': index >= 3 }">
                  {{ major.studentCount }}
                </div>
                <div class="text-xs"
                     :class="{ 'text-white text-opacity-80': index < 3, 'text-gray-500': index >= 3 }">
                  学生
                </div>
              </div>
            </div>
            
            <!-- 统计信息 -->
            <div class="grid grid-cols-2 gap-4 mb-3">
              <div class="text-center p-2 rounded-lg"
                   :class="{
                     'bg-white bg-opacity-10': index < 3,
                     'bg-blue-100': index >= 3
                   }">
                <div class="font-bold"
                     :class="{ 'text-white': index < 3, 'text-blue-700': index >= 3 }">
                  {{ major.enrollmentCount }}
                </div>
                <div class="text-xs"
                     :class="{ 'text-white text-opacity-80': index < 3, 'text-blue-600': index >= 3 }">
                  总报名人次
                </div>
              </div>
              <div class="text-center p-2 rounded-lg"
                   :class="{
                     'bg-white bg-opacity-10': index < 3,
                     'bg-blue-100': index >= 3
                   }">
                <div class="font-bold"
                     :class="{ 'text-white': index < 3, 'text-blue-700': index >= 3 }">
                  {{ ((major.studentCount / comprehensiveStats.totalStudents) * 100).toFixed(1) }}%
                </div>
                <div class="text-xs"
                     :class="{ 'text-white text-opacity-80': index < 3, 'text-blue-600': index >= 3 }">
                  占比
                </div>
              </div>
            </div>
            
            <!-- 进度条 -->
            <div class="rounded-full h-2"
                 :class="{
                   'bg-white bg-opacity-20': index < 3,
                   'bg-gray-200': index >= 3
                 }">
              <div 
                class="h-2 rounded-full transition-all duration-500"
                :class="{
                  'bg-white': index < 3,
                  'bg-blue-500': index >= 3
                }"
                :style="{ width: `${(major.studentCount / comprehensiveStats.totalStudents) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据分析页面
 * @component Analysis
 * @description 系统数据统计分析和报表展示
 */
import { ref, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import AnalysisService from '@/api/analysis'
import type { 
  OverviewStats,
  CampusStats,
  MajorStats,
  PoliticalStatsResponse,
  ComprehensiveStats
} from '@/api/analysis'

// 响应式数据
const loading = ref<boolean>(false)
const lastUpdateTime = ref<string>('')
const overviewStats = ref<OverviewStats>({
  successRate: 0,
  totalStudents: 0,
  totalGraduated: 0,
  averageAge: 0,
  totalCourses: 0,
  totalEnrollments: 0,
  approvedEnrollments: 0,
  pendingEnrollments: 0,
  rejectedEnrollments: 0,
  activeTeachers: 0
})
// 移除了不再使用的旧统计数据变量

// 新增的统计数据
const campusStats = ref<CampusStats[]>([])
const majorStats = ref<MajorStats[]>([])
const politicalStats = ref<PoliticalStatsResponse>({
  stats: [],
  summary: {
    totalStudents: 0,
    partyMemberCount: 0,
    partyMemberPercentage: 0
  }
})
const comprehensiveStats = ref<ComprehensiveStats>({
  totalStudents: 0,
  totalEnrollments: 0,
  totalCourses: 0,
  totalLocations: 0,
  avgEnrollmentPerStudent: 0,
  avgEnrollmentPerCourse: 0
})

/**
 * 获取统计概览数据
 */
const fetchOverviewStats = async (): Promise<void> => {
  try {
    const response = await AnalysisService.getOverviewStats()
    // 从嵌套的响应数据中提取raw对象
    if (response.data && response.data.raw) {
      overviewStats.value = response.data.raw
    } else {
      overviewStats.value = response.data
    }
    console.log('获取统计概览成功:', response.data)
  } catch (error) {
    console.error('获取统计概览失败:', error)
    message.error('获取统计概览失败')
  }
}

// 移除了不再使用的旧数据获取函数

/**
 * 获取校区统计数据
 */
const fetchCampusStats = async (): Promise<void> => {
  try {
    const response = await AnalysisService.getCampusStats()
    campusStats.value = response.data
    console.log('✅ 获取校区统计成功:', response.data)
  } catch (error) {
    console.error('❌ 获取校区统计失败:', error)
    message.error('获取校区统计失败')
  }
}

/**
 * 获取专业统计数据
 */
const fetchMajorStats = async (): Promise<void> => {
  try {
    const response = await AnalysisService.getMajorStats()
    majorStats.value = response.data
    console.log('✅ 获取专业统计成功:', response.data)
  } catch (error) {
    console.error('❌ 获取专业统计失败:', error)
    message.error('获取专业统计失败')
  }
}

/**
 * 获取政治面貌统计数据
 */
const fetchPoliticalStats = async (): Promise<void> => {
  try {
    const response = await AnalysisService.getPoliticalStats()
    politicalStats.value = response.data
    console.log('✅ 获取政治面貌统计成功:', response.data)
  } catch (error) {
    console.error('❌ 获取政治面貌统计失败:', error)
    message.error('获取政治面貌统计失败')
  }
}

/**
 * 获取综合统计数据
 */
const fetchComprehensiveStats = async (): Promise<void> => {
  try {
    const response = await AnalysisService.getComprehensiveStats()
    comprehensiveStats.value = response.data
    console.log('✅ 获取综合统计成功:', response.data)
  } catch (error) {
    console.error('❌ 获取综合统计失败:', error)
    message.error('获取综合统计失败')
  }
}

/**
 * 获取所有分析数据
 */
const fetchAllAnalysisData = async (): Promise<void> => {
  loading.value = true
  try {
    await Promise.all([
      fetchOverviewStats(),
      fetchCampusStats(),
      fetchMajorStats(),
      fetchPoliticalStats(),
      fetchComprehensiveStats()
    ])
    // 更新最后更新时间
    updateLastUpdateTime()
    console.log('✅ 所有分析数据获取完成')
  } catch (error) {
    console.error('❌ 获取分析数据失败:', error)
    message.error('获取分析数据失败')
  } finally {
    loading.value = false
  }
}

/**
 * 刷新所有数据
 */
const refreshAllData = async (): Promise<void> => {
  message.loading('正在刷新数据...', 1)
  await fetchAllAnalysisData()
  message.success('数据刷新完成')
}

/**
 * 更新最后更新时间
 */
const updateLastUpdateTime = (): void => {
  const now = new Date()
  lastUpdateTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 组件挂载时初始化数据
 */
onMounted((): void => {
  console.log('Analysis 组件已挂载')
  fetchAllAnalysisData()
})
</script>

<style scoped>
.analysis-management {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 统计卡片动画效果 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* 为卡片添加入场动画 */
.bg-gradient-to-br {
  animation: slideInUp 0.6s ease-out;
}

/* 装饰性圆形的动画 */
.absolute.-right-4.-top-4 {
  animation: pulse 3s infinite;
}

.absolute.-right-8.-top-8 {
  animation: pulse 4s infinite;
}

/* 悬停效果增强 */
.hover\:shadow-xl:hover {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* 图标悬停动画 */
.fas:hover {
  animation: float 2s ease-in-out infinite;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .text-6xl {
    font-size: 2.5rem;
  }
  
  .text-3xl {
    font-size: 1.5rem;
  }
}

/* 加载状态的脉冲效果 */
@keyframes skeleton {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: skeleton 1.5s infinite;
}

/* 平滑的数字变化动画 */
.ant-statistic-content {
  transition: all 0.3s ease;
}
</style> 
