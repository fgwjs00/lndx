<template>
    <div class="course-management">
      <!-- 页面头部 -->
      <div class="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white mb-8 shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold mb-2">课程管理</h1>
            <p class="text-purple-100">府谷县老年大学课程管理系统</p>
          </div>
          <div class="text-6xl opacity-20">
            📚
          </div>
        </div>
      </div>
  
      <!-- 视图切换选项卡 -->
      <div class="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex">
            <button
              @click="activeView = 'schedule'"
              :class="activeView === 'schedule' ? 'border-purple-500 text-purple-600 bg-purple-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              class="whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors"
            >
              📅 课程表视图
            </button>
            <button
              @click="activeView = 'list'"
              :class="activeView === 'list' ? 'border-purple-500 text-purple-600 bg-purple-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              class="whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors"
            >
              📋 课程列表
            </button>
            <button
              @click="activeView = 'statistics'"
              :class="activeView === 'statistics' ? 'border-purple-500 text-purple-600 bg-purple-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              class="whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors"
            >
              📊 统计分析
            </button>
          </nav>
        </div>
      </div>
      
      <!-- 统计卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-book text-purple-600 text-xl"></i>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-800">{{ courses.length }}</h3>
              <p class="text-gray-500 text-sm">总课程数</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-play text-green-600 text-xl"></i>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-800">{{ activeCourses }}</h3>
              <p class="text-gray-500 text-sm">进行中</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-users text-blue-600 text-xl"></i>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-800">{{ totalEnrolled }}</h3>
              <p class="text-gray-500 text-sm">总报名数</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-chalkboard-teacher text-red-600 text-xl"></i>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-800">{{ uniqueTeachers }}</h3>
              <p class="text-gray-500 text-sm">授课教师</p>
            </div>
          </div>
        </div>
      </div>
  
      <!-- 课程表视图 -->
      <div v-if="activeView === 'schedule'" class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
        <div class="p-6 border-b border-gray-200">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 class="text-xl font-semibold text-gray-800">2024年秋季课程表</h3>
            <div class="flex flex-col sm:flex-row gap-3">
              <select 
                v-model="selectedCategory" 
                class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">所有分类</option>
                <option value="music">音乐类</option>
                <option value="instrument">器乐类</option>
                <option value="art">艺术类</option>
                <option value="literature">文学类</option>
                <option value="practical">实用技能</option>
                <option value="comprehensive">综合类</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-center py-4 px-3 text-gray-600 font-semibold min-w-20">时间</th>
                <th class="text-center py-4 px-3 text-gray-600 font-semibold min-w-32">星期一</th>
                <th class="text-center py-4 px-3 text-gray-600 font-semibold min-w-32">星期二</th>
                <th class="text-center py-4 px-3 text-gray-600 font-semibold min-w-32">星期三</th>
                <th class="text-center py-4 px-3 text-gray-600 font-semibold min-w-32">星期四</th>
                <th class="text-center py-4 px-3 text-gray-600 font-semibold min-w-32">星期五</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="timeSlot in timeSlots" :key="timeSlot.period" class="border-b border-gray-100">
                <td class="py-4 px-3 text-center font-medium text-gray-700 bg-gray-50">
                  <div class="text-sm">{{ timeSlot.label }}</div>
                  <div class="text-xs text-gray-500">{{ timeSlot.time }}</div>
                </td>
                <td v-for="day in 5" :key="day" class="py-2 px-2 align-top">
                  <div v-for="course in getCoursesForTimeSlot(day, timeSlot.period)" :key="course.id" 
                       class="mb-2 p-2 rounded-lg text-xs cursor-pointer hover:shadow-md transition-all"
                       :class="getCategoryColor(course.category)"
                       @click="showCourseDetail(course)"
                  >
                    <div class="font-semibold text-gray-800 mb-1">{{ course.name }}</div>
                    <div class="text-gray-600">{{ course.teacher }}</div>
                    <div class="flex items-center justify-between mt-1">
                      <span class="text-xs bg-white/50 px-1 rounded">{{ getCategoryText(course.category) }}</span>
                      <span class="text-xs text-gray-500">{{ course.enrolled }}/{{ course.capacity }}</span>
                    </div>
                  </div>
                  <div v-if="!getCoursesForTimeSlot(day, timeSlot.period).length" 
                       class="h-16 flex items-center justify-center text-gray-300 text-xs">
                    无课程
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
  
      <!-- 课程列表视图 -->
      <div v-if="activeView === 'list'">
        <!-- 搜索和筛选区域 -->
        <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <!-- 搜索框 -->
            <div class="relative flex-1 max-w-md">
              <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="搜索课程名称、教师或编号..."
                class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                v-model="searchQuery"
              />
            </div>
            
            <!-- 筛选和操作按钮 -->
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              <!-- 筛选区域 -->
              <div class="flex flex-col sm:flex-row gap-3">
                <select 
                  v-model="selectedCategory"
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0"
                >
                  <option value="">所有分类</option>
                  <option value="music">音乐类</option>
                  <option value="instrument">器乐类</option>
                  <option value="art">艺术类</option>
                  <option value="literature">文学类</option>
                  <option value="practical">实用技能</option>
                  <option value="comprehensive">综合类</option>
                </select>
                
                <select 
                  v-model="selectedStatus"
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0"
                >
                  <option value="">所有状态</option>
                  <option value="active">进行中</option>
                  <option value="pending">待开课</option>
                  <option value="completed">已结课</option>
                </select>
                
                <select 
                  v-model="selectedLevel"
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0"
                >
                  <option value="">所有级别</option>
                  <option value="grade1">一年级</option>
                  <option value="grade2">二年级</option>
                  <option value="grade3">三年级</option>
                  <option value="foundation">基础班</option>
                  <option value="improvement">提高班</option>
                  <option value="senior">高级班</option>
                </select>
              </div>
              
                          <!-- 操作按钮 -->
            <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button 
                @click="showAddCourse"
                class="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors min-w-0"
              >
                <i class="fas fa-plus mr-2"></i>
                <span class="whitespace-nowrap">添加课程</span>
              </button>
              
              <button 
                @click="handleBatchImport"
                class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors min-w-0"
              >
                <i class="fas fa-upload mr-2"></i>
                <span class="whitespace-nowrap">批量导入</span>
              </button>
              
              <button 
                @click="handleExportSchedule"
                class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors min-w-0"
              >
                <i class="fas fa-download mr-2"></i>
                <span class="whitespace-nowrap">导出课表</span>
              </button>
            </div>
            </div>
          </div>
        </div>
  
        <!-- 课程列表 -->
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-xl font-semibold text-gray-800">课程列表</h3>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left py-4 px-6 text-gray-600 font-semibold">课程信息</th>
                  <th class="text-left py-4 px-6 text-gray-600 font-semibold">分类</th>
                  <th class="text-left py-4 px-6 text-gray-600 font-semibold">级别</th>
                  <th class="text-left py-4 px-6 text-gray-600 font-semibold">任课教师</th>
                  <th class="text-left py-4 px-6 text-gray-600 font-semibold">上课时间</th>
                  <th class="text-left py-4 px-6 text-gray-600 font-semibold">报名情况</th>
                  <th class="text-left py-4 px-6 text-gray-600 font-semibold">年龄限制</th>
                  <th class="text-left py-4 px-6 text-gray-600 font-semibold">状态</th>
                  <th class="text-left py-4 px-6 text-gray-600 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="course in filteredCourses" :key="course.id" class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td class="py-4 px-6">
                    <div class="flex items-center">
                      <div class="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                           :class="getCategoryColor(course.category)">
                        <i :class="getCategoryIcon(course.category)" class="text-white"></i>
                      </div>
                      <div>
                        <p class="font-medium text-gray-800">{{ course.name }}</p>
                        <p class="text-sm text-gray-500 font-mono">{{ course.courseId }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="py-4 px-6">
                    <span class="px-2 py-1 rounded-full text-xs font-medium"
                          :class="getCategoryColor(course.category, 'light')">
                      {{ getCategoryText(course.category) }}
                    </span>
                  </td>
                  <td class="py-4 px-6">
                    <span class="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                      {{ getLevelText(course.level) }}
                    </span>
                  </td>
                  <td class="py-4 px-6 text-gray-600">{{ course.teacher }}</td>
                  <td class="py-4 px-6 text-gray-600">
                    <div v-for="timeSlot in course.timeSlots" :key="`${timeSlot.dayOfWeek}-${timeSlot.startTime}`" 
                         class="text-sm">
                      {{ getDayText(timeSlot.dayOfWeek) }} {{ timeSlot.startTime }}-{{ timeSlot.endTime }}
                    </div>
                  </td>
                  <td class="py-4 px-6">
                    <div class="flex items-center">
                      <div class="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div class="bg-purple-500 h-2 rounded-full" 
                             :style="{ width: Math.round((course.enrolled / course.capacity) * 100) + '%' }"></div>
                      </div>
                      <span class="text-sm text-gray-600 min-w-0">{{ course.enrolled }}/{{ course.capacity }}</span>
                    </div>
                  </td>
                  <td class="py-4 px-6">
                    <span v-if="course.ageRestriction.enabled" class="text-orange-600 text-xs bg-orange-50 px-2 py-1 rounded-lg">
                      {{ formatAgeRestriction(course.ageRestriction) }}
                    </span>
                    <span v-else class="text-gray-400 text-xs">无限制</span>
                  </td>
                  <td class="py-4 px-6">
                    <span 
                      :class="getStatusClass(course.status)"
                      class="px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {{ getStatusText(course.status) }}
                    </span>
                  </td>
                                  <td class="py-4 px-6">
                  <div class="flex items-center gap-3">
                    <button 
                      @click="editCourse(course)"
                      class="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center min-w-0" 
                      title="编辑"
                    >
                      <i class="fas fa-edit text-sm"></i>
                    </button>
                    <button 
                      class="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center min-w-0" 
                      title="查看详情"
                      @click="showCourseDetail(course)"
                    >
                      <i class="fas fa-eye text-sm"></i>
                    </button>
                    <button 
                      @click="showStudentList(course)"
                      class="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center min-w-0" 
                      title="学员名单"
                    >
                      <i class="fas fa-users text-sm"></i>
                    </button>
                    <button 
                      @click="deleteCourse(course)"
                      class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center min-w-0" 
                      title="删除"
                    >
                      <i class="fas fa-trash text-sm"></i>
                    </button>
                  </div>
                </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- 分页 -->
          <div class="p-6 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                显示 1-{{ Math.min(10, filteredCourses.length) }} 条，共 {{ filteredCourses.length }} 条记录
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- 统计分析视图 -->
      <div v-if="activeView === 'statistics'">
        <!-- 分类统计 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div v-for="category in categoryStats" :key="category.key" 
               class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                     :class="getCategoryColor(category.key)">
                  <i :class="getCategoryIcon(category.key)" class="text-white"></i>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-800">{{ category.name }}</h3>
                  <p class="text-sm text-gray-500">{{ category.count }} 门课程</p>
                </div>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-gray-800">{{ category.enrolled }}</div>
                <div class="text-sm text-gray-500">总报名数</div>
              </div>
            </div>
            <div class="flex-1 bg-gray-200 rounded-full h-2">
              <div class="bg-purple-500 h-2 rounded-full" 
                   :style="{ width: Math.round((category.enrolled / totalEnrolled) * 100) + '%' }"></div>
            </div>
            <div class="text-xs text-gray-500 mt-2">占总报名数 {{ Math.round((category.enrolled / totalEnrolled) * 100) }}%</div>
          </div>
        </div>
  
        <!-- 教师工作量统计 -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h3 class="text-xl font-semibold text-gray-800 mb-6">教师工作量统计</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="teacher in teacherStats" :key="teacher.name"
                 class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-medium text-gray-800">{{ teacher.name }}</h4>
                  <p class="text-sm text-gray-600">{{ teacher.courses }} 门课程</p>
                </div>
                <div class="text-right">
                  <div class="text-lg font-semibold text-purple-600">{{ teacher.students }}</div>
                  <div class="text-xs text-gray-500">学员数</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  
          <!-- 课程表单弹窗 -->
    <a-modal
      v-model:open="showCourseFormModal"
      :title="editingCourse ? '编辑课程' : '添加课程'"
      :width="1000"
      :footer="null"
      :destroy-on-close="true"
    >
      <CourseForm 
        :course="editingCourse"
        @success="handleCourseSuccess"
        @cancel="closeCourseForm"
      />
    </a-modal>

    <!-- 课程详情弹窗 -->
    <a-modal
      v-model:open="showCourseDetailModal"
      title="课程详情"
      :width="800"
      :footer="null"
      :destroy-on-close="true"
    >
        <div v-if="selectedCourse" class="space-y-6">
          <!-- 课程基本信息 -->
          <div class="bg-gray-50 rounded-lg p-6">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 rounded-lg flex items-center justify-center mr-4"
                   :class="getCategoryColor(selectedCourse.category)">
                <i :class="getCategoryIcon(selectedCourse.category)" class="text-white text-xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-semibold text-gray-800">{{ selectedCourse.name }}</h3>
                <p class="text-gray-600">课程编号：{{ selectedCourse.courseId }}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div class="text-2xl font-bold text-purple-600">{{ selectedCourse.enrolled }}</div>
                <div class="text-sm text-gray-500">已报名</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-blue-600">{{ selectedCourse.capacity }}</div>
                <div class="text-sm text-gray-500">总容量</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-green-600">{{ selectedCourse.capacity - selectedCourse.enrolled }}</div>
                <div class="text-sm text-gray-500">剩余名额</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-orange-600">{{ Math.round((selectedCourse.enrolled / selectedCourse.capacity) * 100) }}%</div>
                <div class="text-sm text-gray-500">报名率</div>
              </div>
            </div>
          </div>
  
          <!-- 详细信息 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-semibold text-gray-800 mb-3">基本信息</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">课程分类：</span>
                  <span class="font-medium">{{ getCategoryText(selectedCourse.category) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">课程级别：</span>
                  <span class="font-medium">{{ getLevelText(selectedCourse.level) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">任课教师：</span>
                  <span class="font-medium">{{ selectedCourse.teacher }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">课程费用：</span>
                  <span class="font-medium">{{ selectedCourse.fee }}元/学期</span>
                </div>
                              <div class="flex justify-between">
                <span class="text-gray-600">上课地点：</span>
                <span class="font-medium">{{ selectedCourse.location }}</span>
              </div>
              <div v-if="selectedCourse.ageRestriction.enabled" class="flex justify-between">
                <span class="text-gray-600">年龄限制：</span>
                <span class="font-medium text-orange-600">
                  {{ formatAgeRestriction(selectedCourse.ageRestriction) }}
                </span>
              </div>
            </div>
          </div>
            <div>
              <h4 class="font-semibold text-gray-800 mb-3">时间安排</h4>
              <div class="space-y-2 text-sm">
                <div v-for="timeSlot in selectedCourse.timeSlots" :key="`${timeSlot.dayOfWeek}-${timeSlot.startTime}`">
                  <div class="bg-purple-50 rounded-lg p-3">
                    <div class="font-medium text-purple-800">{{ getDayText(timeSlot.dayOfWeek) }}</div>
                    <div class="text-purple-600">{{ timeSlot.startTime }} - {{ timeSlot.endTime }}</div>
                    <div class="text-xs text-purple-500 mt-1">{{ getPeriodText(timeSlot.period) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
  
          <!-- 课程描述 -->
          <div>
            <h4 class="font-semibold text-gray-800 mb-3">课程简介</h4>
            <p class="text-gray-600 text-sm leading-relaxed">{{ selectedCourse.description }}</p>
          </div>
        </div>
      </a-modal>
    </div>
  </template>
  
  <script setup lang="ts">
  /**
   * 课程管理页面
   * @component Course
   * @description 府谷县老年大学课程管理系统，支持课程表视图、列表视图和统计分析
   */
  import { ref, computed, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import type { Course, CourseCategory, CourseLevel, TimeSlot } from '@/types/index'
import CourseForm from '@/components/CourseForm.vue'
  
  // 响应式数据
  const activeView = ref<'schedule' | 'list' | 'statistics'>('schedule')
  const searchQuery = ref<string>('')
  const selectedCategory = ref<string>('')
  const selectedStatus = ref<string>('')
  const selectedLevel = ref<string>('')
const showCourseDetailModal = ref<boolean>(false)
const selectedCourse = ref<Course | null>(null)
const showCourseFormModal = ref<boolean>(false)
const editingCourse = ref<Course | null>(null)
  
  // 时间段配置
  const timeSlots = [
    {
      period: 'morning' as const,
      label: '上午',
      time: '8:30-10:30'
    },
    {
      period: 'afternoon' as const,
      label: '下午',
      time: '3:00-5:00'
    }
  ]
  
  // 课程数据（根据实际课程表）
const courses = ref<Course[]>([
  // 音乐类课程
  {
    id: 1, name: '二人台', courseId: 'MUS001', description: '传统二人台表演艺术',
    category: 'music', level: 'intermediate', teacher: '刘爱兰', teacherId: 1, credits: 2,
    capacity: 30, enrolled: 25, location: '音乐教室1', fee: 200, semester: '2024秋季',
    timeSlots: [{ dayOfWeek: 1, startTime: '08:30', endTime: '10:30', period: 'morning' }],
    startDate: '2024-09-01', endDate: '2024-12-30', status: 'active',
    ageRestriction: { enabled: false, minAge: undefined, maxAge: undefined, description: '' },
    createdAt: '2024-08-15', updatedAt: '2024-08-15'
  },
  {
    id: 2, name: '声乐一年级', courseId: 'MUS002', description: '基础声乐技巧训练',
    category: 'music', level: 'grade1', teacher: '杨秀清', teacherId: 2, credits: 2,
    capacity: 35, enrolled: 32, location: '音乐教室2', fee: 180, semester: '2024秋季',
    timeSlots: [{ dayOfWeek: 1, startTime: '15:00', endTime: '17:00', period: 'afternoon' }],
    startDate: '2024-09-01', endDate: '2024-12-30', status: 'active',
    ageRestriction: { enabled: false, minAge: undefined, maxAge: undefined, description: '' },
    createdAt: '2024-08-15', updatedAt: '2024-08-15'
  },
  {
    id: 3, name: '声乐三年级', courseId: 'MUS003', description: '高级声乐技巧与表演',
    category: 'music', level: 'grade3', teacher: '孟丽萍', teacherId: 3, credits: 3,
    capacity: 28, enrolled: 26, location: '音乐教室1', fee: 220, semester: '2024秋季',
    timeSlots: [{ dayOfWeek: 3, startTime: '08:30', endTime: '10:30', period: 'morning' }],
    startDate: '2024-09-01', endDate: '2024-12-30', status: 'active',
    ageRestriction: { enabled: false, minAge: undefined, maxAge: undefined, description: '' },
    createdAt: '2024-08-15', updatedAt: '2024-08-15'
  },

  // 器乐类课程
  {
    id: 4, name: '葫芦丝三年级', courseId: 'INS001', description: '葫芦丝高级演奏技巧',
    category: 'instrument', level: 'grade3', teacher: '刘爱义', teacherId: 4, credits: 2,
    capacity: 25, enrolled: 23, location: '器乐教室1', fee: 200, semester: '2024秋季',
    timeSlots: [{ dayOfWeek: 1, startTime: '08:30', endTime: '10:30', period: 'morning' }],
    startDate: '2024-09-01', endDate: '2024-12-30', status: 'active',
    ageRestriction: { enabled: false, minAge: undefined, maxAge: undefined, description: '' },
    createdAt: '2024-08-15', updatedAt: '2024-08-15'
  },
  {
    id: 5, name: '古筝二年级', courseId: 'INS002', description: '古筝中级演奏技巧',
    category: 'instrument', level: 'grade2', teacher: '高慧', teacherId: 5, credits: 2,
    capacity: 20, enrolled: 18, location: '古筝教室', fee: 250, semester: '2024秋季',
    timeSlots: [{ dayOfWeek: 1, startTime: '08:30', endTime: '10:30', period: 'morning' }],
    startDate: '2024-09-01', endDate: '2024-12-30', status: 'active',
    ageRestriction: { enabled: false, minAge: undefined, maxAge: undefined, description: '' },
    createdAt: '2024-08-15', updatedAt: '2024-08-15'
  },
  {
    id: 6, name: '电子琴一年级', courseId: 'INS003', description: '电子琴基础演奏',
    category: 'instrument', level: 'grade1', teacher: '王清如', teacherId: 6, credits: 2,
    capacity: 30, enrolled: 28, location: '电子琴教室', fee: 200, semester: '2024秋季',
    timeSlots: [{ dayOfWeek: 1, startTime: '15:00', endTime: '17:00', period: 'afternoon' }],
    startDate: '2024-09-01', endDate: '2024-12-30', status: 'active',
    ageRestriction: { enabled: false, minAge: undefined, maxAge: undefined, description: '' },
    createdAt: '2024-08-15', updatedAt: '2024-08-15'
  },

  // 艺术类课程
  {
    id: 7, name: '书法创作班', courseId: 'ART001', description: '书法创作技巧与鉴赏',
    category: 'art', level: 'senior', teacher: '闫国金', teacherId: 7, credits: 2,
    capacity: 25, enrolled: 22, location: '书法教室1', fee: 180, semester: '2024秋季',
    timeSlots: [{ dayOfWeek: 1, startTime: '08:30', endTime: '10:30', period: 'morning' }],
    startDate: '2024-09-01', endDate: '2024-12-30', status: 'active',
    ageRestriction: { enabled: false, minAge: undefined, maxAge: undefined, description: '' },
    createdAt: '2024-08-15', updatedAt: '2024-08-15'
  },
  {
    id: 8, name: '绘画基础三年级', courseId: 'ART002', description: '绘画基础技法训练',
    category: 'art', level: 'grade3', teacher: '王艺卓', teacherId: 8, credits: 2,
    capacity: 20, enrolled: 17, location: '美术教室1', fee: 200, semester: '2024秋季',
    timeSlots: [{ dayOfWeek: 2, startTime: '15:00', endTime: '17:00', period: 'afternoon' }],
    startDate: '2024-09-01', endDate: '2024-12-30', status: 'active',
    ageRestriction: { enabled: false, minAge: undefined, maxAge: undefined, description: '' },
    createdAt: '2024-08-15', updatedAt: '2024-08-15'
  },

  // 文学类课程
  {
    id: 9, name: '朗诵与主持基础二年级', courseId: 'LIT001', description: '朗诵技巧与主持艺术',
    category: 'literature', level: 'grade2', teacher: '刘玉琼', teacherId: 9, credits: 2,
    capacity: 30, enrolled: 28, location: '朗诵教室', fee: 160, semester: '2024秋季',
    timeSlots: [{ dayOfWeek: 1, startTime: '08:30', endTime: '10:30', period: 'morning' }],
    startDate: '2024-09-01', endDate: '2024-12-30', status: 'active',
    ageRestriction: { enabled: false, minAge: undefined, maxAge: undefined, description: '' },
    createdAt: '2024-08-15', updatedAt: '2024-08-15'
  },
  {
    id: 10, name: '诗词鉴赏与写作', courseId: 'LIT002', description: '古典诗词鉴赏与创作',
    category: 'literature', level: 'intermediate', teacher: '马来宝', teacherId: 10, credits: 2,
    capacity: 25, enrolled: 23, location: '文学教室', fee: 150, semester: '2024秋季',
    timeSlots: [{ dayOfWeek: 2, startTime: '08:30', endTime: '10:30', period: 'morning' }],
    startDate: '2024-09-01', endDate: '2024-12-30', status: 'active',
    ageRestriction: { enabled: false, minAge: undefined, maxAge: undefined, description: '' },
    createdAt: '2024-08-15', updatedAt: '2024-08-15'
  },

  // 实用技能类课程
  {
    id: 11, name: '计算机应用', courseId: 'PRA001', description: '计算机基础操作与应用',
    category: 'practical', level: 'beginner', teacher: '付玉梅', teacherId: 11, credits: 2,
    capacity: 35, enrolled: 32, location: '机房1', fee: 180, semester: '2024秋季',
    timeSlots: [
      { dayOfWeek: 2, startTime: '15:00', endTime: '17:00', period: 'afternoon' },
      { dayOfWeek: 4, startTime: '15:00', endTime: '17:00', period: 'afternoon' }
    ],
    startDate: '2024-09-01', endDate: '2024-12-30', status: 'active',
    ageRestriction: { enabled: false, minAge: undefined, maxAge: undefined, description: '' },
    createdAt: '2024-08-15', updatedAt: '2024-08-15'
  },

  // 综合类课程
  {
    id: 12, name: '老干部合唱团', courseId: 'COM001', description: '合唱艺术与团队协作',
    category: 'comprehensive', level: 'intermediate', teacher: '高建英', teacherId: 12, credits: 2,
    capacity: 50, enrolled: 45, location: '大礼堂', fee: 120, semester: '2024秋季',
    timeSlots: [{ dayOfWeek: 2, startTime: '15:00', endTime: '17:00', period: 'afternoon' }],
    startDate: '2024-09-01', endDate: '2024-12-30', status: 'active',
    ageRestriction: { enabled: false, minAge: undefined, maxAge: undefined, description: '' },
    createdAt: '2024-08-15', updatedAt: '2024-08-15'
  },

  // 新增示例：有年龄限制的舞蹈课程
  {
    id: 13, name: '民族舞蹈', courseId: 'DAN001', description: '民族舞蹈基础训练与表演',
    category: 'music', level: 'intermediate', teacher: '李舞蹈', teacherId: 13, credits: 2,
    capacity: 25, enrolled: 20, location: '舞蹈教室', fee: 250, semester: '2024秋季',
    timeSlots: [{ dayOfWeek: 3, startTime: '15:00', endTime: '17:00', period: 'afternoon' }],
    startDate: '2024-09-01', endDate: '2024-12-30', status: 'active',
    ageRestriction: { 
      enabled: true, 
      minAge: undefined, 
      maxAge: 65, 
      description: '舞蹈课程需要一定的身体协调性和体力，建议65岁以下学员报名' 
    },
    createdAt: '2024-08-15', updatedAt: '2024-08-15'
  }
])
  
  // 计算属性
  const filteredCourses = computed<Course[]>(() => {
    let result = courses.value
  
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(course => 
        course.name.toLowerCase().includes(query) ||
        course.courseId.toLowerCase().includes(query) ||
        course.teacher.toLowerCase().includes(query)
      )
    }
  
    if (selectedCategory.value) {
      result = result.filter(course => course.category === selectedCategory.value)
    }
  
    if (selectedStatus.value) {
      result = result.filter(course => course.status === selectedStatus.value)
    }
  
    if (selectedLevel.value) {
      result = result.filter(course => course.level === selectedLevel.value)
    }
  
    return result
  })
  
  const activeCourses = computed<number>(() => 
    courses.value.filter(course => course.status === 'active').length
  )
  
  const totalEnrolled = computed<number>(() => 
    courses.value.reduce((sum, course) => sum + course.enrolled, 0)
  )
  
  const uniqueTeachers = computed<number>(() => 
    new Set(courses.value.map(course => course.teacher)).size
  )
  
  // 分类统计
  const categoryStats = computed(() => {
    const categories = [
      { key: 'music' as CourseCategory, name: '音乐类' },
      { key: 'instrument' as CourseCategory, name: '器乐类' },
      { key: 'art' as CourseCategory, name: '艺术类' },
      { key: 'literature' as CourseCategory, name: '文学类' },
      { key: 'practical' as CourseCategory, name: '实用技能' },
      { key: 'comprehensive' as CourseCategory, name: '综合类' }
    ]
  
    return categories.map(category => {
      const coursesInCategory = courses.value.filter(course => course.category === category.key)
      return {
        ...category,
        count: coursesInCategory.length,
        enrolled: coursesInCategory.reduce((sum, course) => sum + course.enrolled, 0)
      }
    }).filter(category => category.count > 0)
  })
  
  // 教师统计
  const teacherStats = computed(() => {
    const teacherMap = new Map()
    
    courses.value.forEach(course => {
      if (!teacherMap.has(course.teacher)) {
        teacherMap.set(course.teacher, {
          name: course.teacher,
          courses: 0,
          students: 0
        })
      }
      
      const teacher = teacherMap.get(course.teacher)
      teacher.courses += 1
      teacher.students += course.enrolled
    })
    
    return Array.from(teacherMap.values()).sort((a, b) => b.students - a.students)
  })
  
  // 工具方法
  const getCategoryColor = (category: CourseCategory, variant: 'normal' | 'light' = 'normal'): string => {
    const colors = {
      music: variant === 'light' ? 'bg-red-100 text-red-600' : 'bg-red-500',
      instrument: variant === 'light' ? 'bg-blue-100 text-blue-600' : 'bg-blue-500',
      art: variant === 'light' ? 'bg-purple-100 text-purple-600' : 'bg-purple-500',
      literature: variant === 'light' ? 'bg-green-100 text-green-600' : 'bg-green-500',
      practical: variant === 'light' ? 'bg-orange-100 text-orange-600' : 'bg-orange-500',
      comprehensive: variant === 'light' ? 'bg-pink-100 text-pink-600' : 'bg-pink-500'
    }
    return colors[category] || (variant === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-gray-500')
  }
  
  const getCategoryIcon = (category: CourseCategory): string => {
    const icons = {
      music: 'fas fa-music',
      instrument: 'fas fa-guitar',
      art: 'fas fa-palette',
      literature: 'fas fa-feather-alt',
      practical: 'fas fa-laptop',
      comprehensive: 'fas fa-users'
    }
    return icons[category] || 'fas fa-book'
  }
  
  const getCategoryText = (category: CourseCategory): string => {
    const texts = {
      music: '音乐类',
      instrument: '器乐类',
      art: '艺术类',
      literature: '文学类',
      practical: '实用技能',
      comprehensive: '综合类'
    }
    return texts[category] || '未知'
  }
  
  const getLevelText = (level: CourseLevel): string => {
    const texts = {
      beginner: '入门',
      intermediate: '中级',
      advanced: '高级',
      grade1: '一年级',
      grade2: '二年级',
      grade3: '三年级',
      foundation: '基础班',
      improvement: '提高班',
      senior: '高级班'
    }
    return texts[level] || '未知'
  }
  
  const getDayText = (dayOfWeek: number): string => {
    const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
    return days[dayOfWeek] || '未知'
  }
  
  const getPeriodText = (period: string): string => {
    const periods = {
      morning: '上午',
      afternoon: '下午',
      evening: '晚上'
    }
    return periods[period as keyof typeof periods] || '未知'
  }
  
  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-600'
      case 'pending':
        return 'bg-blue-100 text-blue-600'
      case 'completed':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }
  
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active':
        return '进行中'
      case 'pending':
        return '待开课'
      case 'completed':
        return '已结课'
      default:
        return '未知'
    }
  }
  
  const getCoursesForTimeSlot = (dayOfWeek: number, period: string): Course[] => {
    return filteredCourses.value.filter(course =>
      course.timeSlots.some(slot => 
        slot.dayOfWeek === dayOfWeek && slot.period === period
      )
    )
  }
  
  const showCourseDetail = (course: Course): void => {
  selectedCourse.value = course
  showCourseDetailModal.value = true
}

/**
 * 显示添加课程表单
 */
const showAddCourse = (): void => {
  editingCourse.value = null
  showCourseFormModal.value = true
}

/**
 * 编辑课程
 */
const editCourse = (course: Course): void => {
  editingCourse.value = { ...course }
  showCourseFormModal.value = true
}

/**
 * 关闭课程表单
 */
const closeCourseForm = (): void => {
  showCourseFormModal.value = false
  editingCourse.value = null
}

/**
 * 处理课程表单成功提交
 */
const handleCourseSuccess = (courseData: Course): void => {
  if (editingCourse.value) {
    // 更新现有课程
    const index = courses.value.findIndex(c => c.id === editingCourse.value!.id)
    if (index !== -1) {
      courses.value[index] = courseData
    }
  } else {
    // 添加新课程
    courses.value.push(courseData)
  }
  closeCourseForm()
}

/**
 * 删除课程
 */
const deleteCourse = (course: Course): void => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除课程"${course.name}"吗？此操作不可恢复。`,
    okText: '确定',
    cancelText: '取消',
    onOk: () => {
      const index = courses.value.findIndex(c => c.id === course.id)
      if (index !== -1) {
        courses.value.splice(index, 1)
        message.success('课程删除成功')
      }
    }
  })
}

/**
 * 显示学员名单
 */
const showStudentList = (course: Course): void => {
  message.info(`查看"${course.name}"的学员名单功能开发中...`)
}

/**
 * 批量导入课程
 */
const handleBatchImport = (): void => {
  message.info('批量导入功能开发中...')
}

/**
 * 导出课程表
 */
const handleExportSchedule = (): void => {
  try {
    // 生成CSV格式的课程表数据
    const csvContent = generateCourseScheduleCSV()
    
    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `课程表_${new Date().toLocaleDateString()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      message.success('课程表导出成功')
    }
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败，请重试')
  }
}

/**
 * 格式化年龄限制显示
 */
const formatAgeRestriction = (ageRestriction: any): string => {
  const { minAge, maxAge, description } = ageRestriction
  let text = ''
  
  if (minAge && maxAge) {
    text = `${minAge}-${maxAge}岁`
  } else if (minAge) {
    text = `${minAge}岁以上`
  } else if (maxAge) {
    text = `${maxAge}岁以下`
  }
  
  if (description) {
    text += ` (${description})`
  }
  
  return text
}

/**
 * 生成课程表CSV内容
 */
const generateCourseScheduleCSV = (): string => {
  const headers = ['课程名称', '课程编号', '分类', '级别', '教师', '上课时间', '地点', '容量', '已报名', '费用', '状态']
  const rows = [headers.join(',')]
  
  courses.value.forEach(course => {
    const timeSlots = course.timeSlots.map(slot => 
      `${getDayText(slot.dayOfWeek)} ${slot.startTime}-${slot.endTime}`
    ).join(';')
    
    const row = [
      course.name,
      course.courseId,
      getCategoryText(course.category),
      getLevelText(course.level),
      course.teacher,
      timeSlots,
      course.location,
      course.capacity,
      course.enrolled,
      course.fee,
      getStatusText(course.status)
    ]
    rows.push(row.join(','))
  })
  
  return '\uFEFF' + rows.join('\n') // 添加BOM以支持中文
}
  
  /**
   * 组件挂载时初始化数据
   */
  onMounted((): void => {
    console.log('Course 组件已挂载，加载了', courses.value.length, '门课程')
  })
  </script>
  
  <style scoped>
  .course-management {
    padding: 1rem;
  }
  
  @media (min-width: 768px) {
    .course-management {
      padding: 0;
    }
  }
  </style>