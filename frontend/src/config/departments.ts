/**
 * 院系配置文件
 * @description 管理所有院系和课程信息的配置
 */

/**
 * 院系类型定义
 */
export type DepartmentCode = 
  | '书画系'
  | '书画非遗系' 
  | '电子信息系'
  | '声乐戏曲系'
  | '器乐演奏系'
  | '语言文学系'
  | '舞蹈体育系'
  | '家政保健系'

/**
 * 院系信息接口
 */
export interface DepartmentInfo {
  code: DepartmentCode
  name: string
  description: string
  courses: CourseInfo[]
}

/**
 * 课程信息接口
 */
export interface CourseInfo {
  id: number
  name: string
  requiresGrades: boolean
  description?: string
}

/**
 * 院系配置数据
 */
export const DEPARTMENTS: DepartmentInfo[] = [
  {
    code: '书画系',
    name: '书画系',
    description: '传统书法绘画艺术',
    courses: [
      { id: 1, name: '绘画一年级', requiresGrades: true },
      { id: 2, name: '书法一年级', requiresGrades: true }
    ]
  },
  {
    code: '书画非遗系',
    name: '书画非遗系', 
    description: '非物质文化遗产传承',
    courses: [
      { id: 22, name: '面花', requiresGrades: false },
      { id: 23, name: '编织', requiresGrades: false },
      { id: 24, name: '炭精粉', requiresGrades: false },
      { id: 25, name: '手工编织', requiresGrades: false }
    ]
  },
  {
    code: '电子信息系',
    name: '电子信息系',
    description: '现代信息技术应用',
    courses: [
      { id: 3, name: '手机摄影与短视频制作', requiresGrades: false },
      { id: 4, name: '计算机', requiresGrades: true }
    ]
  },
  {
    code: '声乐戏曲系',
    name: '声乐戏曲系',
    description: '声乐演唱与戏曲艺术',
    courses: [
      { id: 5, name: '男声合唱团', requiresGrades: false },
      { id: 6, name: '民歌班', requiresGrades: false },
      { id: 7, name: '声乐二年级', requiresGrades: true }
    ]
  },
  {
    code: '器乐演奏系',
    name: '器乐演奏系',
    description: '各类乐器演奏技巧',
    courses: [
      { id: 8, name: '电子琴一年级', requiresGrades: true },
      { id: 9, name: '古筝一年级', requiresGrades: true },
      { id: 10, name: '葫芦丝班', requiresGrades: false },
      { id: 11, name: '二胡乐队班', requiresGrades: false }
    ]
  },
  {
    code: '语言文学系',
    name: '语言文学系',
    description: '语言文字与文学艺术',
    courses: [
      { id: 12, name: '国学班', requiresGrades: false },
      { id: 13, name: '诗词鉴赏与写作班', requiresGrades: false },
      { id: 14, name: '朗诵与主持', requiresGrades: false }
    ]
  },
  {
    code: '舞蹈体育系',
    name: '舞蹈体育系',
    description: '舞蹈艺术与体育健身',
    courses: [
      { id: 15, name: '舞蹈一年级', requiresGrades: true },
      { id: 16, name: '瑜伽一年级', requiresGrades: true },
      { id: 17, name: '太极一年级', requiresGrades: true },
      { id: 18, name: '柔力球一年级', requiresGrades: true },
      { id: 19, name: '乒乓球一年级', requiresGrades: true },
      { id: 20, name: '门球', requiresGrades: false }
    ]
  },
  {
    code: '家政保健系',
    name: '家政保健系',
    description: '家庭生活与健康保健',
    courses: [
      { id: 21, name: '烹饪班', requiresGrades: false }
    ]
  }
]

/**
 * 获取所有院系列表
 */
export const getDepartmentList = (): DepartmentInfo[] => {
  return DEPARTMENTS
}

/**
 * 获取院系代码列表
 */
export const getDepartmentCodes = (): DepartmentCode[] => {
  return DEPARTMENTS.map(dept => dept.code)
}

/**
 * 根据代码获取院系信息
 */
export const getDepartmentByCode = (code: DepartmentCode): DepartmentInfo | undefined => {
  return DEPARTMENTS.find(dept => dept.code === code)
}

/**
 * 获取某院系的所有课程
 */
export const getCoursesByDepartment = (departmentCode: DepartmentCode): CourseInfo[] => {
  const department = getDepartmentByCode(departmentCode)
  return department?.courses || []
}

/**
 * 检查课程是否需要年级管理
 */
export const doesCourseRequireGrades = (courseName: string): boolean => {
  for (const dept of DEPARTMENTS) {
    const course = dept.courses.find(c => c.name === courseName)
    if (course) {
      return course.requiresGrades
    }
  }
  return true // 默认需要年级管理
}
