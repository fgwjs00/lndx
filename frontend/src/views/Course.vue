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
  
      <!-- 视图切换选项-->
      <div class="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex">
            <button
              @click="activeView = 'schedule'"
              :class="activeView === 'schedule' ? 'border-purple-500 text-purple-600 bg-purple-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              class="whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors"
            >
              📅 课程表视图            </button>
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
              <h3 class="text-2xl font-bold text-gray-800">{{ courseStats.totalCourses || courses.length }}</h3>
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
  
      <!-- 课程表视图-->
      <div v-if="activeView === 'schedule'" class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
        <div class="p-6 border-b border-gray-200">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 class="text-xl font-semibold text-gray-800">{{ selectedSemester || '所有学期' }}课程表</h3>
                    <div class="flex flex-col sm:flex-row gap-3">
              <!-- 学期筛选 -->
              <select 
                v-model="selectedSemester"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">所有学期</option>
                <option v-for="semester in availableSemesters" :key="semester" :value="semester">
                  {{ semester }}
                </option>
              </select>

              <select 
                v-model="selectedCategory" 
                class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">所有院系</option>
                <option v-for="category in availableCategories" :key="category" :value="category">
                  {{ category }}
                </option>
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
                <th class="text-center py-4 px-3 text-gray-600 font-semibold min-w-32">星期六</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="timeSlot in timeSlots" :key="timeSlot.period" class="border-b border-gray-100">
                <td class="py-4 px-3 text-center font-medium text-gray-700 bg-gray-50">
                  <div class="text-sm">{{ timeSlot.label }}</div>
                  <div class="text-xs text-gray-500">{{ timeSlot.time }}</div>
                </td>
                <td v-for="day in 6" :key="day" class="py-2 px-2 align-top">
                  <div v-for="course in getCoursesForTimeSlot(day, timeSlot.period)" :key="course.id" 
                       class="mb-2 p-2 rounded-lg text-xs cursor-pointer hover:shadow-md transition-all"
                       :class="getCategoryColor(course.category)"
                       @click="showCourseDetail(course)"
                  >
                    <div class="font-semibold text-gray-800 mb-1">{{ course.name }}</div>
                    <div class="text-gray-600 text-xs">
                      {{ course.requiresGrades ? getLevelText(course.level) : '不分年级' }}
                    </div>
                    <div class="flex items-center justify-between mt-1">
                      <span class="text-xs bg-white/50 px-1 rounded">{{ getCategoryText(course.category) }}</span>
                      <span class="text-xs text-gray-500">{{ course.enrolled || 0 }}/{{ course.maxStudents || course.capacity || 0 }}</span>
                    </div>
                  </div>
                  <div v-if="!getCoursesForTimeSlot(day, timeSlot.period).length" 
                       class="h-16 flex items-center justify-center text-gray-300 text-xs">
                    无课                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
  
      <!-- 课程列表视图 -->
      <div v-if="activeView === 'list'">
        <!-- 搜索和筛选区-->
    <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <!-- 搜索-->
        <div class="relative flex-1 max-w-md">
          <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
                placeholder="搜索课程名称、教师或描述..."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            v-model="searchQuery"
          />
        </div>
        
        <!-- 筛选和操作按钮 -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          <!-- 筛选区-->
          <div class="flex flex-col sm:flex-row gap-3">
                <!-- 学期筛选 -->
                <select 
                  v-model="selectedSemester"
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0"
                >
                  <option value="">所有学期</option>
                  <option v-for="semester in availableSemesters" :key="semester" :value="semester">
                    {{ semester }}
                  </option>
                </select>

                <select 
                  v-model="selectedCategory"
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0"
                >
                  <option value="">所有院系</option>
                  <!-- 动态加载院系选项 -->
                  <option v-for="deptCode in departmentCodes" :key="deptCode" :value="deptCode">
                    {{ deptCode }}
                  </option>
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
                  <option value="">所有年级</option>
                  <option value="一年级">一年级</option>
                  <option value="二年级">二年级</option>
                  <option value="三年级">三年级</option>
                  <option value="不分年级">不分年级</option>
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
            
            <!-- 🔧 新增：批量删除按钮 -->
            <button 
              @click="handleBatchDelete"
              :disabled="selectedCourseIds.length === 0"
              class="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors min-w-0"
            >
              <i class="fas fa-trash mr-2"></i>
              <span class="whitespace-nowrap">批量删除 ({{ selectedCourseIds.length }})</span>
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
              <!-- 🔧 新增：批量选择列 -->
              <th class="text-center py-4 px-4 text-gray-600 font-semibold w-12">
                <a-checkbox 
                  :checked="isAllSelected"
                  :indeterminate="isIndeterminate"
                  @change="(event: any) => handleSelectAll(event.target.checked)"
                />
              </th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">课程信息</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">学期</th>
                  <th class="text-left py-4 px-6 text-gray-600 font-semibold">院系</th>
                  <th class="text-left py-4 px-6 text-gray-600 font-semibold">年级</th>
              <!-- 任课教师列已移除显示，数据库字段保留 -->
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">上课地点</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">上课时间</th>
                  <th class="text-left py-4 px-6 text-gray-600 font-semibold">报名情况</th>
                  <th class="text-left py-4 px-6 text-gray-600 font-semibold">年龄限制</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">状态</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="course in filteredCourses" :key="course.id" class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <!-- 🔧 新增：每行的复选框 -->
              <td class="text-center py-4 px-4">
                <a-checkbox 
                  :checked="selectedCourseIds.includes(course.id)"
                  @change="(event: any) => handleSelectCourse(course.id, event.target.checked)"
                />
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center">
                      <div class="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                           :class="getCategoryColor(course.category)">
                        <i :class="getCategoryIcon(course.category)" class="text-white"></i>
                  </div>
                  <div>
                    <p class="font-medium text-gray-800">{{ course.name }}</p>
                        <!-- 课程编号显示已移除 -->
                  </div>
                </div>
              </td>
              <td class="py-4 px-6">
                <span class="px-2 py-1 bg-indigo-100 text-indigo-600 rounded-full text-xs font-medium">
                  {{ course.semester || '未指定学期' }}
                </span>
              </td>
                  <td class="py-4 px-6">
                    <span class="px-2 py-1 rounded-full text-xs font-medium"
                          :class="getCategoryColor(course.category, 'light')">
                      {{ getCategoryText(course.category) }}
                    </span>
                  </td>
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-2">
                      <span v-if="course.requiresGrades" class="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                        {{ getLevelText(course.level) }}
                      </span>
                      <span v-else class="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                        不分年级
                      </span>
                    </div>
                  </td>
              <!-- 任课教师字段已移除显示，数据库字段保留 -->
              <td class="py-4 px-6 text-gray-600">{{ course.location || '未指定地点' }}</td>
                  <td class="py-4 px-6 text-gray-600">
                    <div v-for="timeSlot in (Array.isArray(course.timeSlots) ? course.timeSlots : [])" 
                         :key="`${timeSlot.dayOfWeek}-${timeSlot.startTime}`" 
                         class="text-sm">
                      {{ getDayText(timeSlot.dayOfWeek) }} {{ timeSlot.startTime }}-{{ timeSlot.endTime }}
                    </div>
                    <div v-if="!Array.isArray(course.timeSlots) || course.timeSlots.length === 0" class="text-sm text-gray-400">
                      未设置时间
                    </div>
                  </td>
                  <td class="py-4 px-6">
                    <div class="flex items-center">
                      <div class="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div class="bg-purple-500 h-2 rounded-full" 
                             :style="{ width: Math.round(((course.enrolled || 0) / (course.capacity || course.maxStudents || 1)) * 100) + '%' }"></div>
                      </div>
                      <span class="text-sm text-gray-600 min-w-0">{{ course.enrolled || 0 }}/{{ course.capacity || course.maxStudents || 0 }}</span>
                    </div>
                  </td>
                  <td class="py-4 px-6">
                    <span v-if="course.hasAgeRestriction" class="text-orange-600 text-xs bg-orange-50 px-2 py-1 rounded-lg">
                      {{ formatAgeRestriction(course) }}
                    </span>
                    <span v-else class="text-gray-400 text-xs">不限年龄</span>
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
            显示 {{ (pagination.current - 1) * pagination.pageSize + 1 }}-{{ Math.min(pagination.current * pagination.pageSize, pagination.total) }} 条，共 {{ pagination.total }} 条记录
          </div>
          <a-pagination
            v-model:current="pagination.current"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            show-size-changer
            show-quick-jumper
            :show-total="(total: number, _range: [number, number]) => `共 ${total} 条记录`"
            :page-size-options="['10', '20', '50', '100']"
            @change="handlePageChange"
            @show-size-change="handlePageSizeChange"
            class="text-right"
          />
        </div>
      </div>
    </div>
  
    <!-- 统计分析视图 -->
      <div v-if="activeView === 'statistics'">
        <!-- 院系统计 -->
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
                  <p class="text-sm text-gray-500">{{ category.count }} 门课</p>
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
  
        <!-- 教师工作量统计-->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h3 class="text-xl font-semibold text-gray-800 mb-6">教师工作量统计</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="teacher in teacherStats" :key="teacher.name"
                 class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-medium text-gray-800">{{ teacher.name }}</h4>
                  <p class="text-sm text-gray-600">{{ teacher.courses }} 门课</p>
                </div>
                <div class="text-right">
                  <div class="text-lg font-semibold text-purple-600">{{ teacher.students }}</div>
                  <div class="text-xs text-gray-500">学员</div>
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
        :course="editingCourse as Course | undefined"
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
                <!-- 课程编号显示已移除 -->
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
                <div class="text-2xl font-bold text-green-600">{{ (selectedCourse.capacity || selectedCourse.maxStudents || 0) - (selectedCourse.enrolled || 0) }}</div>
                <div class="text-sm text-gray-500">剩余名额</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-orange-600">{{ Math.round(((selectedCourse.enrolled || 0) / (selectedCourse.capacity || selectedCourse.maxStudents || 1)) * 100) }}%</div>
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
                  <span class="text-gray-600">课程分类</span>
                  <span class="font-medium">{{ getCategoryText(selectedCourse.category) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">学期</span>
                  <span class="font-medium">{{ selectedCourse.semester || '未指定学期' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">年级/类型</span>
                  <span class="font-medium">
                    {{ selectedCourse.requiresGrades ? getLevelText(selectedCourse.level) : '不分年级' }}
                  </span>
                </div>
                <!-- 任课教师字段已移除显示，数据库字段保留 -->
                <!-- 课程费用显示已移除 -->
                              <div class="flex justify-between">
                <span class="text-gray-600">上课地点</span>
                <span class="font-medium">{{ selectedCourse.location || '未指定地点' }}</span>
              </div>
              <div v-if="selectedCourse.hasAgeRestriction" class="flex justify-between">
                <span class="text-gray-600">年龄限制</span>
                <span class="font-medium text-orange-600">
                  {{ formatAgeRestriction(selectedCourse) }}
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

  <!-- 学员名单模态框 -->
  <a-modal
    v-model:open="showStudentListModal"
    :title="`${currentCourseStudents.courseName} - 学员名单`"
    width="800px"
  >
    <template #footer>
      <div class="flex justify-between items-center">
        <div class="text-sm text-gray-600">
          共 {{ currentCourseStudents.total }} 名学员
        </div>
        <div class="flex gap-2">
          <button 
            @click="exportCourseStudents"
            :disabled="!currentCourseStudents.students.length || exportingCourseStudents"
            class="bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors"
          >
            <i class="fas fa-download mr-2"></i>
            <span v-if="!exportingCourseStudents">导出学员名单</span>
            <span v-else>导出中...</span>
          </button>
          <button 
            @click="showStudentListModal = false"
            class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </template>
    <div v-if="currentCourseStudents.students.length === 0" class="text-center py-8 text-gray-500">
      <i class="fas fa-users text-4xl mb-4 opacity-30"></i>
      <p>该课程暂无学员报名</p>
    </div>
    
    <div v-else>
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white">
          <thead class="bg-gray-50">
            <tr>
              <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学员姓名</th>
              <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学员编号</th>
              <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">联系电话</th>
              <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">身份证号码</th>
              <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">报名日期</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="student in currentCourseStudents.students" :key="student.enrollmentCode" class="hover:bg-gray-50">
              <td class="py-4 px-4 text-sm font-medium text-gray-900">
                {{ student.studentName }}
              </td>
              <td class="py-4 px-4 text-sm text-gray-500">
                {{ student.studentCode }}
              </td>
              <td class="py-4 px-4 text-sm text-gray-500">
                {{ student.phone }}
              </td>
              <td class="py-4 px-4 text-sm text-blue-600 font-mono">
                {{ student.enrollmentCode }}
              </td>
              <td class="py-4 px-4 text-sm text-gray-500">
                {{ student.applicationDate }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </a-modal>

  <!-- 批量导入模态框 -->
  <BatchImportModal
    v-model:open="showBatchImportModal"
    @success="handleBatchImportSuccess"
  />

  <!-- 🔧 新增：批量删除确认模态框 -->
  <a-modal
    v-model:open="showBatchDeleteModal"
    title="确认批量删除"
    :width="500"
    @ok="executeBatchDelete"
    @cancel="showBatchDeleteModal = false"
    ok-text="确认删除"
    cancel-text="取消"
    ok-type="danger"
  >
    <div class="py-4">
      <div class="flex items-center mb-4">
        <i class="fas fa-exclamation-triangle text-red-500 text-2xl mr-3"></i>
        <div>
          <p class="text-gray-800 font-medium">您即将删除以下课程：</p>
        </div>
      </div>
      
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
        <ul class="space-y-2">
          <li v-for="courseId in selectedCourseIds" :key="courseId" 
              class="flex items-center text-sm">
            <i class="fas fa-book text-red-500 mr-2"></i>
            <span class="font-medium">
              {{ filteredCourses.find(c => c.id === courseId)?.name || courseId }}
            </span>
          </li>
        </ul>
      </div>
      
      <div class="text-sm text-gray-600 space-y-2">
        <p><i class="fas fa-info-circle text-blue-500 mr-1"></i> 删除操作无法撤销</p>
        <p><i class="fas fa-warning text-orange-500 mr-1"></i> 如果课程已有学员报名，可能需要先处理相关报名记录</p>
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
import { ref, computed, onMounted, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'

import { CourseService } from '@/api/course'
import type { Course } from '@/types/models'
import { ApplicationService } from '@/api/application'
import { StudentService } from '@/api/student'
import { EnrollmentStatus } from '@/types/models'
import CourseForm from '@/components/CourseForm.vue'
import BatchImportModal from '@/components/BatchImportModal.vue'
import { getDepartmentCodes } from '@/config/departments'

// 响应式数据
  const activeView = ref<'schedule' | 'list' | 'statistics'>('schedule')
const searchQuery = ref<string>('')
  const selectedCategory = ref<string>('')
  
  // 院系选项
  const departmentCodes = getDepartmentCodes()

// 学员名单模态框
const showStudentListModal = ref<boolean>(false)
const currentCourseStudents = ref<{
  courseName: string
  courseId: string
  students: Array<{
    studentName: string
    studentCode: string
    phone: string
    applicationDate: string
    enrollmentCode: string
  }>
  total: number
}>({
  courseName: '',
  courseId: '',
  students: [],
  total: 0
})

// 导出相关状态
const exportingCourseStudents = ref<boolean>(false)
  const selectedStatus = ref<string>('')
  const selectedLevel = ref<string>('')
  const selectedSemester = ref<string>('')
  const availableSemesters = ref<string[]>([])
  const availableCategories = ref<string[]>([])
const showCourseDetailModal = ref<boolean>(false)
const selectedCourse = ref<Course | null>(null)
const showCourseFormModal = ref<boolean>(false)
const editingCourse = ref<Course | null>(null)

// 🔧 新增：批量删除相关数据
const selectedCourseIds = ref<string[]>([])
const showBatchDeleteModal = ref<boolean>(false)
  
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
      time: '2:00-5:00'
    }
  ]
  
// API相关数据
const apiCourses = ref<Course[]>([])
const loading = ref<boolean>(false)
const pagination = ref({
  current: 1,
  pageSize: 50, // 增加每页显示数量
  total: 0
})

// 统计数据
const courseStats = ref({
  total: 0,
  totalCourses: 0, // 添加totalCourses字段
  published: 0,
  ongoing: 0,
  completed: 0,
  totalStudents: 0,
  averageRating: 0
})

// 临时保留的硬编码数据（待删除）
// ✅ 已清除模拟数据，现在只使用真实的API数据
const courses = computed(() => apiCourses.value) // 兼容性引用，指向真实数据

// 工具函数
/**
 * 获取当年学期
 * @returns 当年学期字符串（如：2025年秋季）
 */
const getCurrentYearSemester = (): string => {
  const currentYear = new Date().getFullYear()
  return `${currentYear}年秋季`
}

// API调用方法
/**
 * 获取可用学期列表
 */
const fetchSemesters = async (): Promise<void> => {
  try {
    const response = await CourseService.getSemesters()
    availableSemesters.value = response.data || []
    console.log('获取学期列表成功:', response.data)
    
    // 设置默认学期为当年学期
    setDefaultSemester()
  } catch (error) {
    console.error('获取学期列表失败:', error)
    // 失败时使用默认学期选项
    availableSemesters.value = ['2025年秋季',  '2024年秋季']
    
    // 设置默认学期为当年学期
    setDefaultSemester()
  }
}

/**
 * 设置默认学期为当年学期
 */
const setDefaultSemester = (): void => {
  const currentSemester = getCurrentYearSemester()
  
  // 如果当年学期存在于可用学期列表中，则设置为默认值
  if (availableSemesters.value.includes(currentSemester)) {
    selectedSemester.value = currentSemester
    console.log(`设置默认学期为: ${currentSemester}`)
  } else if (availableSemesters.value.length > 0) {
    // 如果当年学期不存在，则选择第一个可用学期
    selectedSemester.value = availableSemesters.value[0]
    console.log(`当年学期不存在，设置默认学期为: ${selectedSemester.value}`)
  }
}

/**
 * 获取可用分类列表
 */
const fetchCategories = async (): Promise<void> => {
  try {
    const response = await CourseService.getCategories()
    availableCategories.value = response.data || []
    console.log('获取分类列表成功:', response.data)
  } catch (error) {
    console.error('获取分类列表失败:', error)
    // 失败时使用新的院系选项
    availableCategories.value = getDepartmentCodes()
  }
}

/**
 * 获取课程列表
 */
const fetchCourses = async (): Promise<void> => {
  try {
    loading.value = true
    const params: any = {
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    }
    
    // 只有当搜索词不为空时才添加 keyword 参数
    if (searchQuery.value && searchQuery.value.trim()) {
      params.keyword = searchQuery.value.trim()
    }
    
    // 只有当选择了院系时才添加 category 参数
    if (selectedCategory.value && selectedCategory.value !== 'all') {
      params.category = selectedCategory.value
    }
    
    // 只有当选择了年级时才添加 level 参数
    if (selectedLevel.value && selectedLevel.value !== 'all') {
      if (selectedLevel.value === '不分年级') {
        // 传递特殊参数表示筛选不分年级的课程
        params.requiresGrades = 'false'
      } else {
        // 传递具体年级
        params.level = selectedLevel.value
        params.requiresGrades = 'true'
      }
    }

    // 只有当选择了学期时才添加 semester 参数
    if (selectedSemester.value && selectedSemester.value !== 'all') {
      params.semester = selectedSemester.value
    }

    const response = await CourseService.getCourses(params)
    apiCourses.value = response.data?.list || []
    pagination.value.total = response.data?.total || 0
    
    console.log('获取课程列表成功:', response.data)
  } catch (error) {
    console.error('获取课程列表失败:', error)
    message.error('获取课程列表失败')
    apiCourses.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 获取课程统计信息
 */
const fetchCourseStats = async (): Promise<void> => {
  try {
    const response = await CourseService.getCourseStats()
    if (response.data) {
      courseStats.value = {
        ...courseStats.value,
        ...response.data,
        totalCourses: response.data.total || response.data.totalCourses || 0
      }
    }
  } catch (error) {
    console.error('获取课程统计失败:', error)
  }
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
    onOk: async () => {
      try {
        await CourseService.deleteCourse(course.id)
        message.success(`删除课程 ${course.name} 成功`)
        await fetchCourses()
      } catch (error) {
        console.error('删除课程失败:', error)
        message.error('删除课程失败')
      }
    }
  })
}

/**
 * 修改课程状态
 */
const changeCourseStatus = async (course: Course, status: Course['status']): Promise<void> => {
  try {
    await CourseService.changeCourseStatus(course.id, status)
    message.success(`修改课程状态成功`)
    await fetchCourses()
  } catch (error) {
    console.error('修改课程状态失败:', error)
    message.error('修改课程状态失败')
  }
}

// 计算属性
const filteredCourses = computed<Course[]>(() => {
  // ✅ 只使用真实的API数据
  let result = apiCourses.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(course => 
      course.name.toLowerCase().includes(query) ||
      // course.courseCode?.toLowerCase().includes(query) || // 已移除
      course.description?.toLowerCase().includes(query)
    )
  }
  
  if (selectedCategory.value) {
    result = result.filter(course => course.category === selectedCategory.value)
  }
  
  if (selectedStatus.value) {
    result = result.filter(course => course.status === selectedStatus.value)
  }
  
  if (selectedLevel.value) {
    if (selectedLevel.value === '不分年级') {
      // 筛选不分年级的课程
      result = result.filter(course => !course.requiresGrades)
    } else {
      // 筛选指定年级的课程
      result = result.filter(course => course.requiresGrades && course.level === selectedLevel.value)
    }
  }

  if (selectedSemester.value) {
    result = result.filter(course => course.semester === selectedSemester.value)
  }
  
  return result
})

const activeCourses = computed<number>(() => 
  apiCourses.value.filter(course => course.status === 'PUBLISHED').length
)

const totalEnrolled = computed<number>(() => 
  apiCourses.value.reduce((sum, course) => sum + (course.enrolled || 0), 0)
)

const uniqueTeachers = computed<number>(() => 
  new Set(
    apiCourses.value
      .map(course => course.teacher)
      .filter(Boolean) // 过滤掉null/undefined
  ).size
  )
  
  // 分类统计 (基于真实数据库分类)
  const categoryStats = computed(() => {
    // 从实际课程数据中获取所有分类
    const categoryMap = new Map()
    
    apiCourses.value.forEach(course => {
      const categoryName = course.category || '未分类'
      
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          key: categoryName,
          name: categoryName,
          count: 0,
          enrolled: 0
        })
      }
      
      const category = categoryMap.get(categoryName)
      category.count += 1
      category.enrolled += (course.enrolled || 0)
    })
    
    // 转换为数组并按报名数排序
    return Array.from(categoryMap.values())
      .filter(category => category.count > 0)
      .sort((a, b) => b.enrolled - a.enrolled)
  })
  
  // 🔧 新增：批量选择相关计算属性
  const isAllSelected = computed(() => {
    return filteredCourses.value.length > 0 && 
           selectedCourseIds.value.length === filteredCourses.value.length
  })
  
  const isIndeterminate = computed(() => {
    return selectedCourseIds.value.length > 0 && 
           selectedCourseIds.value.length < filteredCourses.value.length
  })
  
  // 教师统计 (基于真实teacher字段)
  const teacherStats = computed(() => {
    const teacherMap = new Map()
    
    apiCourses.value.forEach(course => {
      const teacherName = course.teacher || '未指定'
      
      if (!teacherMap.has(teacherName)) {
        teacherMap.set(teacherName, {
          name: teacherName,
          courses: 0,
          students: 0
        })
      }
      
      const teacher = teacherMap.get(teacherName)
      teacher.courses += 1
      teacher.students += (course.enrolled || 0)
    })
    
    return Array.from(teacherMap.values())
      .filter(teacher => teacher.name !== '未指定') // 过滤掉未指定教师
      .sort((a, b) => b.students - a.students)
  })
  
  // 工具方法
  const getCategoryColor = (category: string, variant: 'normal' | 'light' = 'normal'): string => {
    const colors: Record<string, string> = {
      // 新的院系颜色配置
      '书画系': variant === 'light' ? 'bg-red-100 text-red-600' : 'bg-red-500',
      '书画非遗系': variant === 'light' ? 'bg-purple-100 text-purple-600' : 'bg-purple-500',
      '电子信息系': variant === 'light' ? 'bg-blue-100 text-blue-600' : 'bg-blue-500',
      '声乐戏曲系': variant === 'light' ? 'bg-pink-100 text-pink-600' : 'bg-pink-500',
      '器乐演奏系': variant === 'light' ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-500',
      '语言文学系': variant === 'light' ? 'bg-green-100 text-green-600' : 'bg-green-500',
      '舞蹈体育系': variant === 'light' ? 'bg-yellow-100 text-yellow-600' : 'bg-yellow-500',
      '家政保健系': variant === 'light' ? 'bg-orange-100 text-orange-600' : 'bg-orange-500',
    }
    return colors[category] || (variant === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-gray-500')
  }
  
  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      // 新的院系图标配置
      '书画系': 'fas fa-palette',
      '书画非遗系': 'fas fa-hand-holding-heart',
      '电子信息系': 'fas fa-laptop',
      '声乐戏曲系': 'fas fa-music',
      '器乐演奏系': 'fas fa-guitar',
      '语言文学系': 'fas fa-feather-alt',
      '舞蹈体育系': 'fas fa-running',
      '家政保健系': 'fas fa-home',

    }
    return icons[category] || 'fas fa-book'
  }
  
  const getCategoryText = (category: string): string => {
    // 新的院系直接显示原名称，不需要映射
    return category || '未知分类'
  }
  
    const getLevelText = (level: string): string => {
    // 直接显示年级，不需要映射
    return level || '未知年级'
  }
  
  const getDayText = (dayOfWeek: number): string => {
    const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
    return days[dayOfWeek] || '未知'
  }
  
  const getPeriodText = (period: string): string => {
    const periods = {
      morning: '上午',
      afternoon: '下午'
    }
    return periods[period as keyof typeof periods] || '未知'
  }
  
const getStatusClass = (status: string): string => {
  switch (status) {
    case 'PUBLISHED':
      return 'bg-green-100 text-green-600'
    case 'DRAFT':
      return 'bg-yellow-100 text-yellow-600'
    case 'SUSPENDED':
      return 'bg-orange-100 text-orange-600'
    case 'CANCELLED':
      return 'bg-red-100 text-red-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'DRAFT':
      return '草稿'
    case 'PUBLISHED':
      return '已发布'
    case 'SUSPENDED':
      return '暂停'
    case 'CANCELLED':
      return '已取消'
    default:
      return '未知'
  }
}
  
  const getCoursesForTimeSlot = (dayOfWeek: number, period: string): Course[] => {
    return filteredCourses.value.filter(course =>
      Array.isArray(course.timeSlots) && course.timeSlots.some((slot: any) => 
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
const handleCourseSuccess = async (_courseData: Course): Promise<void> => {
  try {
    message.success(editingCourse.value ? '课程更新成功' : '课程创建成功')
    closeCourseForm()
    // 重新获取最新的课程列表数据
    await fetchCourses()
  } catch (error) {
    console.error('刷新课程列表失败:', error)
  }
}



/**
 * 显示学员名单
 */
const showStudentList = async (course: Course): Promise<void> => {
  try {
    console.log('查询课程学员名单:', { courseId: course.id, courseName: course.name })
    
    // 获取该课程的报名学员列表，使用正确的filters对象
    const response = await ApplicationService.getApplicationList({
      courseId: course.id,   // 关键：按课程ID筛选
      status: EnrollmentStatus.APPROVED,    // 只显示已通过的报名
      page: 1,
      pageSize: 100          // 获取更多数据
    })
    
    console.log('学员名单查询结果:', response)
    
    if (response.code === 200 && response.data.list) {
      const studentList = response.data.list.map(app => ({
        studentName: app.studentInfo?.name || '未知',
        studentCode: app.studentInfo?.studentCode || '',
        phone: app.studentInfo?.phone || '', // 🔧 修复：使用正确的字段名
        applicationDate: app.applicationDate,
        enrollmentCode: app.studentInfo?.idNumber || '' // 🔧 修复：显示身份证号码而不是报名编号
      }))
      
      console.log('格式化的学员列表:', studentList)
      
      // 创建学员列表Modal
      showStudentListModal.value = true
      currentCourseStudents.value = {
        courseName: course.name,
        courseId: course.id,
        students: studentList,
        total: response.data.total || 0
      }
    } else {
      message.warning(`暂无"${course.name}"的报名学员`)
    }
  } catch (error) {
    console.error('获取学员名单失败:', error)
    message.error('获取学员名单失败')
  }
}

/**
 * 🔧 导出课程学员名单
 */
const exportCourseStudents = async () => {
  try {
    exportingCourseStudents.value = true
    console.log('🔄 开始导出课程学员名单...', {
      courseId: currentCourseStudents.value.courseId,
      courseName: currentCourseStudents.value.courseName
    })

    message.loading('正在导出学员名单，请稍候...', 1)

    // 调用学员导出API，传递课程ID和已通过状态
    const blob = await StudentService.exportStudents({
      courseId: currentCourseStudents.value.courseId,
      status: EnrollmentStatus.APPROVED
    } as any)

    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    // 生成文件名
    const timestamp = new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-').replace(/\s/g, '_')
    const filename = `${currentCourseStudents.value.courseName}_学员名单_${timestamp}.csv`
    link.download = filename

    // 触发下载
    document.body.appendChild(link)
    link.click()

    // 清理
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    console.log('✅ 课程学员名单导出完成')
    message.success('学员名单导出成功！')

  } catch (error) {
    console.error('导出课程学员名单失败:', error)
    message.error('导出失败，请重试')
  } finally {
    exportingCourseStudents.value = false
  }
}

// 批量导入相关
const showBatchImportModal = ref<boolean>(false)

/**
 * 批量导入课程
 */
const handleBatchImport = (): void => {
  showBatchImportModal.value = true
}

/**
 * 批量导入成功回调
 */
const handleBatchImportSuccess = (): void => {
  fetchCourses()
  message.success('批量导入完成，课程列表已刷新')
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
 * 🔧 新增：批量选择功能
 * 全选/取消全选
 */
const handleSelectAll = (checked: boolean): void => {
  if (checked) {
    selectedCourseIds.value = filteredCourses.value.map(course => course.id)
  } else {
    selectedCourseIds.value = []
  }
}

/**
 * 🔧 新增：单个课程选择
 */
const handleSelectCourse = (courseId: string, checked: boolean): void => {
  if (checked) {
    if (!selectedCourseIds.value.includes(courseId)) {
      selectedCourseIds.value.push(courseId)
    }
  } else {
    const index = selectedCourseIds.value.indexOf(courseId)
    if (index > -1) {
      selectedCourseIds.value.splice(index, 1)
    }
  }
}

/**
 * 🔧 新增：批量删除确认
 */
const handleBatchDelete = (): void => {
  if (selectedCourseIds.value.length === 0) {
    message.warning('请先选择要删除的课程')
    return
  }
  showBatchDeleteModal.value = true
}

/**
 * 🔧 新增：执行批量删除
 */
const executeBatchDelete = async (): void => {
  try {
    await CourseService.batchDeleteCourses(selectedCourseIds.value)
    message.success(`成功删除${selectedCourseIds.value.length}门课程`)
    selectedCourseIds.value = []
    showBatchDeleteModal.value = false
    await fetchCourses()
  } catch (error) {
    console.error('批量删除失败:', error)
    message.error('批量删除失败，请重试')
  }
}

/**
 * 格式化年龄限制显示
 */
const formatAgeRestriction = (course: any): string => {
  const { minAge, maxAge, ageDescription, hasAgeRestriction } = course
  
  // 🔧 修复：如果没有年龄限制，直接返回
  if (!hasAgeRestriction && !minAge && !maxAge && !ageDescription) {
    return ''
  }
  
  let text = ''
  
  if (minAge && maxAge) {
    text = `${minAge}-${maxAge}岁`
  } else if (minAge) {
    text = `${minAge}岁以上`
  } else if (maxAge) {
    text = `${maxAge}岁以下`
  }
  
  if (ageDescription) {
    text += ` (${ageDescription})`
  }
  
  return text || '无限制'
}

/**
 * 生成课程表CSV内容
 */
const generateCourseScheduleCSV = (): string => {
  const headers = ['课程编号', '课程名称', '院系', '年级/类型', '学期', '上课时间', '地点', '容量', '已报名', '年龄限制', '状态', '课程描述']
  const rows = [headers.join(',')]
  
  apiCourses.value.forEach(course => {
    const timeSlots = course.timeSlots?.map((slot: any) => 
      `${getDayText(slot.dayOfWeek)} ${slot.startTime}-${slot.endTime}`
    ).join(';') || '未设置'
    
    // 年级显示逻辑：有年级显示年级，不分年级显示"不分年级"
    const gradeDisplay = course.requiresGrades ? (course.level || '未知年级') : '不分年级'
    
    // 🔧 修复：格式化年龄限制信息
    const ageRestriction = formatAgeRestriction(course) || '无限制'
    
    // 年龄限制数据已格式化
    
    const row = [
      course.courseCode || course.code || '',
      course.name,
      course.category || '',
      gradeDisplay,
      course.semester || '未指定学期',
      timeSlots,
      course.location || '未指定地点',
      (course.maxStudents || course.capacity || 0).toString(),
      course.enrolled?.toString() || '0',
      ageRestriction,
      course.status === 'PUBLISHED' ? '已发布' : course.status === 'DRAFT' ? '草稿' : '其他',
      course.description || ''
    ]
    rows.push(row.map(field => `"${field}"`).join(','))
  })
  
  return '\uFEFF' + rows.join('\n') // 添加BOM以支持中文
}

// 分页处理函数
const handlePageChange = (page: number): void => {
  pagination.value.current = page
  fetchCourses()
}

const handlePageSizeChange = (_current: number, size: number): void => {
  pagination.value.current = 1
  pagination.value.pageSize = size
  fetchCourses()
}

// 监听器
watch([searchQuery, selectedCategory, selectedLevel, selectedSemester], () => {
  pagination.value.current = 1
  fetchCourses()
}, { deep: true })

/**
 * 组件挂载时初始化数据
 */
onMounted((): void => {
  console.log('Course 组件已挂载')
  fetchSemesters()  // 获取学期列表
  fetchCategories() // 获取分类列表
  fetchCourses()
  fetchCourseStats()
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
