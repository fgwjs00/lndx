/**
 * 数据库种子文件 - 2024年秋季真实课程数据
 * @description 基于府谷县老年大学2024年秋季课程表的真实数据
 */

import { PrismaClient, UserRole, Gender, CourseStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * 系统配置数据
 */
const systemConfigs = [
  {
    key: 'SYSTEM_NAME',
    value: '学生报名及档案管理系统',
    description: '系统名称',
    isSystem: true
  },
  {
    key: 'SYSTEM_VERSION',
    value: '1.0.0',
    description: '系统版本',
    isSystem: true
  },
  {
    key: 'DEFAULT_PAGE_SIZE',
    value: '10',
    description: '默认分页大小',
    isSystem: false
  },
  {
    key: 'MAX_UPLOAD_SIZE',
    value: '5242880',
    description: '最大上传文件大小（字节）',
    isSystem: false
  },
  {
    key: 'SMS_VERIFY_EXPIRE',
    value: '300',
    description: '短信验证码过期时间（秒）',
    isSystem: false
  }
]

/**
 * 初始用户数据
 */
async function createInitialUsers() {
  const hashedPassword = await bcrypt.hash('123456', 12)

  // 超级管理员
  const superAdmin = await prisma.user.upsert({
    where: { phone: '13800000001' },
    update: {},
    create: {
      phone: '13800000001',
      email: 'superadmin@lndx.com',
      password: hashedPassword,
      realName: '超级管理员',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      mustChangePassword: true
    }
  })

  // 学校管理员
  const schoolAdmin = await prisma.user.upsert({
    where: { phone: '13800000002' },
    update: {},
    create: {
      phone: '13800000002',
      email: 'admin@school.com',
      password: hashedPassword,
      realName: '学校管理员',
      role: UserRole.SCHOOL_ADMIN,
      isActive: true,
      mustChangePassword: true
    }
  })

  // 教师用户
  const teacher = await prisma.user.upsert({
    where: { phone: '13800000003' },
    update: {},
    create: {
      phone: '13800000003',
      email: 'teacher@school.com',
      password: hashedPassword,
      realName: '张老师',
      role: UserRole.TEACHER,
      isActive: true,
      mustChangePassword: true
    }
  })

  // 学生用户
  const student = await prisma.user.upsert({
    where: { phone: '13800000004' },
    update: {},
    create: {
      phone: '13800000004',
      email: 'student@example.com',
      password: hashedPassword,
      realName: '李学生',
      role: UserRole.STUDENT,
      isActive: true,
      mustChangePassword: true
    }
  })

  return { superAdmin, schoolAdmin, teacher, student }
}

/**
 * 创建教师档案
 */
async function createTeacherProfile(teacherUser: any) {
  const teacherProfile = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      teacherCode: 'T2025001',
      realName: teacherUser.realName,
      gender: Gender.FEMALE,
      phone: teacherUser.phone,
      email: teacherUser.email,
      specialties: ['舞蹈', '声乐', '钢琴'], // JSON数组格式
      experience: 5,
      userId: teacherUser.id,
      isActive: true
    }
  })

  return teacherProfile
}

/**
 * 创建学生档案
 */
async function createStudentProfile(studentUser: any) {
  const studentProfile = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      studentCode: 'S2025001',
      name: studentUser.realName,
      gender: Gender.MALE,
      age: 20,
      birthDate: new Date('2004-03-15'),
      birthday: new Date('2004-03-15'),
      idNumber: '110101200403150001',
      idCardAddress: '北京市东城区某某街道某某号',
      contactPhone: studentUser.phone,
      currentAddress: '北京市朝阳区某某小区某某号',
      emergencyContact: '李父',
      emergencyPhone: '13900000001',
      emergencyRelation: '父亲',
      healthStatus: '良好',
      ethnicity: '汉族',
      educationLevel: '高中',
      politicalStatus: '共青团员',
      major: '书画系', // 添加院系信息
      userId: studentUser.id,
      createdBy: studentUser.id,
      isActive: true
    }
  })

  return studentProfile
}

/**
 * 创建2024年秋季课程（基于真实课程表）
 */
async function create2024AutumnCourses(teacherUser: any, teacherProfile: any) {
  console.log('📚 开始创建2024年秋季课程...')
  const courses = []

  // 书画系课程
  const calligraphyCreation = await prisma.course.upsert({
    where: { courseCode: 'C24001' },
    update: {},
    create: {
      courseCode: 'C24001',
      name: '书法创作班',
      description: '书法艺术创作技巧提升',
      category: '书画系',
      level: '',
      duration: 120,
      maxStudents: 25,
      location: '二道街教学点-书画室',
      semester: '2024年秋季',
      requiresGrades: false,
      gradeDescription: '不分年级，适合有一定书法基础的学员',
      timeSlots: [
        { dayOfWeek: 1, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 4, startTime: '15:00', endTime: '17:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(calligraphyCreation)

  const calligraphyKaishu1 = await prisma.course.upsert({
    where: { courseCode: 'C24002' },
    update: {},
    create: {
      courseCode: 'C24002',
      name: '书法楷书一年级',
      description: '楷书基础入门课程',
      category: '书画系',
      level: '一年级',
      duration: 120,
      maxStudents: 30,
      location: '二道街教学点-书画室',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 1, startTime: '15:00', endTime: '17:00', period: 'afternoon' },
        { dayOfWeek: 4, startTime: '08:30', endTime: '10:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(calligraphyKaishu1)

  const calligraphyXingshu2 = await prisma.course.upsert({
    where: { courseCode: 'C24003' },
    update: {},
    create: {
      courseCode: 'C24003',
      name: '书法行书二年级',
      description: '行书技法进阶课程',
      category: '书画系',
      level: '二年级',
      duration: 120,
      maxStudents: 25,
      location: '二道街教学点-书画室',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 2, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 5, startTime: '15:00', endTime: '17:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(calligraphyXingshu2)

  const calligraphyKaishu2 = await prisma.course.upsert({
    where: { courseCode: 'C24004' },
    update: {},
    create: {
      courseCode: 'C24004',
      name: '书法楷书二年级',
      description: '楷书技法深化课程',
      category: '书画系',
      level: '二年级',
      duration: 120,
      maxStudents: 25,
      location: '二道街教学点-书画室',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 3, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 5, startTime: '08:30', endTime: '10:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(calligraphyKaishu2)

  const painting1 = await prisma.course.upsert({
    where: { courseCode: 'C24005' },
    update: {},
    create: {
      courseCode: 'C24005',
      name: '绘画一年级',
      description: '绘画基础技法入门',
      category: '书画系',
      level: '一年级',
      duration: 120,
      maxStudents: 20,
      location: '二道街教学点-美工室',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 2, startTime: '15:00', endTime: '17:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(painting1)

  const painting2 = await prisma.course.upsert({
    where: { courseCode: 'C24006' },
    update: {},
    create: {
      courseCode: 'C24006',
      name: '绘画二年级',
      description: '绘画技法进阶课程',
      category: '书画系',
      level: '二年级',
      duration: 120,
      maxStudents: 20,
      location: '二道街教学点-美工室',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 3, startTime: '15:00', endTime: '17:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(painting2)

  // 书画非遗系课程
  const carbonPowder = await prisma.course.upsert({
    where: { courseCode: 'C24007' },
    update: {},
    create: {
      courseCode: 'C24007',
      name: '炭精粉',
      description: '传统炭精粉绘画技艺',
      category: '书画非遗系',
      level: '',
      duration: 120,
      maxStudents: 15,
      location: '二道街教学点-美工室',
      semester: '2024年秋季',
      requiresGrades: false,
      gradeDescription: '传统非遗技艺，不分年级教学',
      timeSlots: [
        { dayOfWeek: 2, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 4, startTime: '08:30', endTime: '10:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(carbonPowder)

  const noodleArt = await prisma.course.upsert({
    where: { courseCode: 'C24008' },
    update: {},
    create: {
      courseCode: 'C24008',
      name: '面花',
      description: '传统面花制作工艺',
      category: '书画非遗系',
      level: '',
      duration: 120,
      maxStudents: 20,
      location: '二道街教学点-手工制作室',
      semester: '2024年秋季',
      requiresGrades: false,
      gradeDescription: '传统手工艺，不分年级教学',
      timeSlots: [
        { dayOfWeek: 2, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 4, startTime: '08:30', endTime: '10:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(noodleArt)

  const fabricKnitting = await prisma.course.upsert({
    where: { courseCode: 'C24009' },
    update: {},
    create: {
      courseCode: 'C24009',
      name: '编织',
      description: '布艺编织技艺',
      category: '书画非遗系',
      level: '',
      duration: 120,
      maxStudents: 18,
      location: '二道街教学点-手工制作室',
      semester: '2024年秋季',
      requiresGrades: false,
      gradeDescription: '手工编织技艺，不分年级教学',
      timeSlots: [
        { dayOfWeek: 3, startTime: '15:00', endTime: '17:00', period: 'afternoon' },
        { dayOfWeek: 5, startTime: '15:00', endTime: '17:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(fabricKnitting)

  // 电子信息系课程
  const computer = await prisma.course.upsert({
    where: { courseCode: 'C24010' },
    update: {},
    create: {
      courseCode: 'C24010',
      name: '计算机',
      description: '计算机基础应用课程',
      category: '电子信息系',
      level: '一年级',
      duration: 120,
      maxStudents: 15,
      location: '二道街教学点-电子信息室',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 1, startTime: '15:00', endTime: '17:00', period: 'afternoon' },
        { dayOfWeek: 3, startTime: '15:00', endTime: '17:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(computer)

  const videoProduction = await prisma.course.upsert({
    where: { courseCode: 'C24011' },
    update: {},
    create: {
      courseCode: 'C24011',
      name: '手机摄影与短视频制作',
      description: '手机摄影技巧与短视频制作',
      category: '电子信息系',
      level: '',
      duration: 120,
      maxStudents: 20,
      location: '二道街教学点-会议室',
      semester: '2024年秋季',
      requiresGrades: false,
      gradeDescription: '实用技能课程，不分年级教学',
      timeSlots: [
        { dayOfWeek: 3, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 5, startTime: '15:00', endTime: '17:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(videoProduction)

  // 声乐戏曲系课程
  const vocal1 = await prisma.course.upsert({
    where: { courseCode: 'C24012' },
    update: {},
    create: {
      courseCode: 'C24012',
      name: '声乐一年级',
      description: '声乐基础入门课程',
      category: '声乐戏曲系',
      level: '一年级',
      duration: 120,
      maxStudents: 25,
      location: '二道街教学点-声乐室',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 1, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 1, startTime: '15:00', endTime: '17:00', period: 'afternoon' },
        { dayOfWeek: 2, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 3, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 4, startTime: '15:00', endTime: '17:00', period: 'afternoon' },
        { dayOfWeek: 5, startTime: '08:30', endTime: '10:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(vocal1)

  const ertai = await prisma.course.upsert({
    where: { courseCode: 'C24013' },
    update: {},
    create: {
      courseCode: 'C24013',
      name: '二人台',
      description: '传统二人台表演艺术',
      category: '声乐戏曲系',
      level: '',
      duration: 120,
      maxStudents: 20,
      location: '二道街教学点-器乐室',
      semester: '2024年秋季',
      requiresGrades: false,
      gradeDescription: '传统戏曲，不分年级教学',
      timeSlots: [
        { dayOfWeek: 1, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 5, startTime: '08:30', endTime: '10:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(ertai)

  const chorus = await prisma.course.upsert({
    where: { courseCode: 'C24014' },
    update: {},
    create: {
      courseCode: 'C24014',
      name: '男声合唱团',
      description: '老干部合唱团',
      category: '声乐戏曲系',
      level: '',
      duration: 120,
      maxStudents: 30,
      location: '二道街教学点-声乐室',
      semester: '2024年秋季',
      requiresGrades: false,
      gradeDescription: '合唱团体，不分年级',
      timeSlots: [
        { dayOfWeek: 2, startTime: '15:00', endTime: '17:00', period: 'afternoon' },
        { dayOfWeek: 3, startTime: '15:00', endTime: '17:00', period: 'afternoon' },
        { dayOfWeek: 4, startTime: '08:30', endTime: '10:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(chorus)

  const jinju = await prisma.course.upsert({
    where: { courseCode: 'C24015' },
    update: {},
    create: {
      courseCode: 'C24015',
      name: '晋剧',
      description: '山西传统晋剧表演',
      category: '声乐戏曲系',
      level: '',
      duration: 120,
      maxStudents: 25,
      location: '二道街教学点-器乐室',
      semester: '2024年秋季',
      requiresGrades: false,
      gradeDescription: '传统戏曲，不分年级教学',
      timeSlots: [
        { dayOfWeek: 2, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 4, startTime: '15:00', endTime: '17:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(jinju)

  // 器乐演奏系课程
  const guzheng1 = await prisma.course.upsert({
    where: { courseCode: 'C24016' },
    update: {},
    create: {
      courseCode: 'C24016',
      name: '古筝一年级',
      description: '古筝基础入门课程',
      category: '器乐演奏系',
      level: '一年级',
      duration: 120,
      maxStudents: 15,
      location: '二道街教学点-古筝室',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 1, startTime: '15:00', endTime: '17:00', period: 'afternoon' },
        { dayOfWeek: 4, startTime: '15:00', endTime: '17:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(guzheng1)

  const guzheng2 = await prisma.course.upsert({
    where: { courseCode: 'C24017' },
    update: {},
    create: {
      courseCode: 'C24017',
      name: '古筝二年级',
      description: '古筝技法进阶课程',
      category: '器乐演奏系',
      level: '二年级',
      duration: 120,
      maxStudents: 15,
      location: '二道街教学点-古筝室',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 1, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 3, startTime: '15:00', endTime: '17:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(guzheng2)

  const guzheng3a = await prisma.course.upsert({
    where: { courseCode: 'C24018' },
    update: {},
    create: {
      courseCode: 'C24018',
      name: '古筝三年级一班',
      description: '古筝高级技法课程',
      category: '器乐演奏系',
      level: '三年级',
      duration: 120,
      maxStudents: 12,
      location: '二道街教学点-古筝室',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 2, startTime: '15:00', endTime: '17:00', period: 'afternoon' },
        { dayOfWeek: 4, startTime: '08:30', endTime: '10:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(guzheng3a)

  const guzheng3b = await prisma.course.upsert({
    where: { courseCode: 'C24019' },
    update: {},
    create: {
      courseCode: 'C24019',
      name: '古筝三年级二班',
      description: '古筝高级技法课程',
      category: '器乐演奏系',
      level: '三年级',
      duration: 120,
      maxStudents: 12,
      location: '二道街教学点-古筝室',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 2, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 5, startTime: '08:30', endTime: '10:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(guzheng3b)

  const keyboard1 = await prisma.course.upsert({
    where: { courseCode: 'C24020' },
    update: {},
    create: {
      courseCode: 'C24020',
      name: '电子琴一年级',
      description: '电子琴基础入门课程',
      category: '器乐演奏系',
      level: '一年级',
      duration: 120,
      maxStudents: 12,
      location: '二道街教学点-电子琴室',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 1, startTime: '15:00', endTime: '17:00', period: 'afternoon' },
        { dayOfWeek: 3, startTime: '15:00', endTime: '17:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(keyboard1)

  const keyboard2 = await prisma.course.upsert({
    where: { courseCode: 'C24021' },
    update: {},
    create: {
      courseCode: 'C24021',
      name: '电子琴二年级',
      description: '电子琴技法进阶课程',
      category: '器乐演奏系',
      level: '二年级',
      duration: 120,
      maxStudents: 12,
      location: '二道街教学点-电子琴室',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 2, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 4, startTime: '08:30', endTime: '10:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(keyboard2)

  const keyboardAdvanced = await prisma.course.upsert({
    where: { courseCode: 'C24022' },
    update: {},
    create: {
      courseCode: 'C24022',
      name: '电子琴提高一年级',
      description: '电子琴技法提高课程',
      category: '器乐演奏系',
      level: '一年级',
      duration: 120,
      maxStudents: 10,
      location: '二道街教学点-电子琴室',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 3, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 5, startTime: '08:30', endTime: '10:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(keyboardAdvanced)

  const hulusi2 = await prisma.course.upsert({
    where: { courseCode: 'C24023' },
    update: {},
    create: {
      courseCode: 'C24023',
      name: '葫芦丝班',
      description: '葫芦丝演奏技巧',
      category: '器乐演奏系',
      level: '',
      duration: 120,
      maxStudents: 20,
      location: '二道街教学点-器乐室',
      semester: '2024年秋季',
      requiresGrades: false,
      gradeDescription: '民族乐器，不分年级教学',
      timeSlots: [
        { dayOfWeek: 3, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 4, startTime: '08:30', endTime: '10:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(hulusi2)

  const hulusi3 = await prisma.course.upsert({
    where: { courseCode: 'C24024' },
    update: {},
    create: {
      courseCode: 'C24024',
      name: '葫芦丝三年级',
      description: '葫芦丝高级演奏技巧',
      category: '器乐演奏系',
      level: '三年级',
      duration: 120,
      maxStudents: 15,
      location: '二道街教学点-电子琴室',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 1, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 4, startTime: '15:00', endTime: '17:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(hulusi3)

  const erhu = await prisma.course.upsert({
    where: { courseCode: 'C24025' },
    update: {},
    create: {
      courseCode: 'C24025',
      name: '二胡乐队班',
      description: '二胡合奏技巧',
      category: '器乐演奏系',
      level: '',
      duration: 120,
      maxStudents: 25,
      location: '二道街教学点-器乐室',
      semester: '2024年秋季',
      requiresGrades: false,
      gradeDescription: '乐队形式，不分年级',
      timeSlots: [
        { dayOfWeek: 1, startTime: '15:00', endTime: '17:00', period: 'afternoon' },
        { dayOfWeek: 3, startTime: '15:00', endTime: '17:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(erhu)

  // 语言文学系课程
  const recitation = await prisma.course.upsert({
    where: { courseCode: 'C24026' },
    update: {},
    create: {
      courseCode: 'C24026',
      name: '朗诵与主持',
      description: '朗诵与主持技巧',
      category: '语言文学系',
      level: '',
      duration: 120,
      maxStudents: 20,
      location: '二道街教学点-会议室',
      semester: '2024年秋季',
      requiresGrades: false,
      gradeDescription: '表演艺术，不严格分年级',
      timeSlots: [
        { dayOfWeek: 1, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 1, startTime: '15:00', endTime: '17:00', period: 'afternoon' },
        { dayOfWeek: 3, startTime: '15:00', endTime: '17:00', period: 'afternoon' },
        { dayOfWeek: 4, startTime: '08:30', endTime: '10:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(recitation)

  const poetry = await prisma.course.upsert({
    where: { courseCode: 'C24027' },
    update: {},
    create: {
      courseCode: 'C24027',
      name: '诗词鉴赏与写作班',
      description: '诗词鉴赏与写作技巧',
      category: '语言文学系',
      level: '',
      duration: 120,
      maxStudents: 25,
      location: '二道街教学点-会议室',
      semester: '2024年秋季',
      requiresGrades: false,
      gradeDescription: '文学修养课程，不分年级',
      timeSlots: [
        { dayOfWeek: 2, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 5, startTime: '08:30', endTime: '10:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(poetry)

  const guxue = await prisma.course.upsert({
    where: { courseCode: 'C24028' },
    update: {},
    create: {
      courseCode: 'C24028',
      name: '国学班',
      description: '国学经典学习',
      category: '语言文学系',
      level: '',
      duration: 120,
      maxStudents: 30,
      location: '二道街教学点-会议室',
      semester: '2024年秋季',
      requiresGrades: false,
      gradeDescription: '传统文化学习，不分年级',
      timeSlots: [
        { dayOfWeek: 2, startTime: '15:00', endTime: '17:00', period: 'afternoon' },
        { dayOfWeek: 4, startTime: '15:00', endTime: '17:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(guxue)

  // 舞蹈体育系课程 - 舞蹈类
  const dance1 = await prisma.course.upsert({
    where: { courseCode: 'C24029' },
    update: {},
    create: {
      courseCode: 'C24029',
      name: '舞蹈一年级',
      description: '舞蹈基础入门课程',
      category: '舞蹈体育系',
      level: '一年级',
      duration: 90,
      maxStudents: 25,
      location: '三完小步行街教学点-二楼',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 1, startTime: '14:30', endTime: '16:00', period: 'afternoon' },
        { dayOfWeek: 3, startTime: '14:30', endTime: '16:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(dance1)

  const dance2 = await prisma.course.upsert({
    where: { courseCode: 'C24030' },
    update: {},
    create: {
      courseCode: 'C24030',
      name: '舞蹈二年级',
      description: '舞蹈技法进阶课程',
      category: '舞蹈体育系',
      level: '二年级',
      duration: 90,
      maxStudents: 25,
      location: '三完小步行街教学点-三楼',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 1, startTime: '10:00', endTime: '11:30', period: 'morning' },
        { dayOfWeek: 2, startTime: '10:00', endTime: '11:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(dance2)

  const dance3 = await prisma.course.upsert({
    where: { courseCode: 'C24031' },
    update: {},
    create: {
      courseCode: 'C24031',
      name: '舞蹈三年级',
      description: '舞蹈高级技法课程',
      category: '舞蹈体育系',
      level: '三年级',
      duration: 120,
      maxStudents: 20,
      location: '工人文化宫教学点',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 1, startTime: '15:00', endTime: '17:00', period: 'afternoon' },
        { dayOfWeek: 3, startTime: '08:30', endTime: '10:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(dance3)

  const danceTeam = await prisma.course.upsert({
    where: { courseCode: 'C24032' },
    update: {},
    create: {
      courseCode: 'C24032',
      name: '舞蹈队',
      description: '舞蹈表演队',
      category: '舞蹈体育系',
      level: '',
      duration: 90,
      maxStudents: 25,
      location: '三完小步行街教学点-三楼',
      semester: '2024年秋季',
      requiresGrades: false,
      gradeDescription: '表演队形式，不分年级',
      timeSlots: [
        { dayOfWeek: 1, startTime: '08:10', endTime: '09:40', period: 'morning' },
        { dayOfWeek: 4, startTime: '14:30', endTime: '16:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(danceTeam)

  // 舞蹈体育系课程 - 体育类
  const taiji1 = await prisma.course.upsert({
    where: { courseCode: 'C24033' },
    update: {},
    create: {
      courseCode: 'C24033',
      name: '太极一年级',
      description: '太极拳基础入门课程',
      category: '舞蹈体育系',
      level: '一年级',
      duration: 90,
      maxStudents: 30,
      location: '三完小步行街教学点-三楼',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 1, startTime: '14:30', endTime: '16:00', period: 'afternoon' },
        { dayOfWeek: 5, startTime: '08:10', endTime: '09:40', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(taiji1)

  const taiji2 = await prisma.course.upsert({
    where: { courseCode: 'C24034' },
    update: {},
    create: {
      courseCode: 'C24034',
      name: '太极拳二年级',
      description: '太极拳技法进阶课程',
      category: '舞蹈体育系',
      level: '二年级',
      duration: 90,
      maxStudents: 25,
      location: '老体协教学点',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 2, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 5, startTime: '15:00', endTime: '17:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(taiji2)

  const taiji3 = await prisma.course.upsert({
    where: { courseCode: 'C24035' },
    update: {},
    create: {
      courseCode: 'C24035',
      name: '太极拳三年级',
      description: '太极拳高级技法课程',
      category: '舞蹈体育系',
      level: '三年级',
      duration: 90,
      maxStudents: 20,
      location: '老体协教学点',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 4, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 5, startTime: '08:30', endTime: '10:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(taiji3)

  const taijiAdvanced = await prisma.course.upsert({
    where: { courseCode: 'C24036' },
    update: {},
    create: {
      courseCode: 'C24036',
      name: '太极拳提高班',
      description: '太极拳技法提高课程',
      category: '舞蹈体育系',
      level: '',
      duration: 90,
      maxStudents: 25,
      location: '三完小步行街教学点-二楼',
      semester: '2024年秋季',
      requiresGrades: false,
      gradeDescription: '提高班，不严格分年级',
      timeSlots: [
        { dayOfWeek: 1, startTime: '08:10', endTime: '09:40', period: 'morning' },
        { dayOfWeek: 2, startTime: '14:30', endTime: '16:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(taijiAdvanced)

  const yoga1 = await prisma.course.upsert({
    where: { courseCode: 'C24037' },
    update: {},
    create: {
      courseCode: 'C24037',
      name: '瑜伽一年级',
      description: '瑜伽基础入门课程',
      category: '舞蹈体育系',
      level: '一年级',
      duration: 90,
      maxStudents: 20,
      location: '三完小步行街教学点-二楼',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 2, startTime: '16:20', endTime: '17:50', period: 'afternoon' },
        { dayOfWeek: 5, startTime: '10:00', endTime: '11:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(yoga1)

  const yoga2 = await prisma.course.upsert({
    where: { courseCode: 'C24038' },
    update: {},
    create: {
      courseCode: 'C24038',
      name: '瑜伽二年级',
      description: '瑜伽技法进阶课程',
      category: '舞蹈体育系',
      level: '二年级',
      duration: 90,
      maxStudents: 20,
      location: '三完小步行街教学点-二楼',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 1, startTime: '10:00', endTime: '11:30', period: 'morning' },
        { dayOfWeek: 1, startTime: '16:20', endTime: '17:50', period: 'afternoon' },
        { dayOfWeek: 3, startTime: '08:10', endTime: '09:40', period: 'morning' },
        { dayOfWeek: 4, startTime: '16:20', endTime: '17:50', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(yoga2)

  const rouliball2 = await prisma.course.upsert({
    where: { courseCode: 'C24039' },
    update: {},
    create: {
      courseCode: 'C24039',
      name: '柔力球一年级',
      description: '柔力球基础技法课程',
      category: '舞蹈体育系',
      level: '二年级',
      duration: 90,
      maxStudents: 25,
      location: '三完小步行街教学点-二楼',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 4, startTime: '14:30', endTime: '16:00', period: 'afternoon' },
        { dayOfWeek: 5, startTime: '14:30', endTime: '16:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(rouliball2)

  const rouliball3 = await prisma.course.upsert({
    where: { courseCode: 'C24040' },
    update: {},
    create: {
      courseCode: 'C24040',
      name: '柔力球三年级',
      description: '柔力球高级技法课程',
      category: '舞蹈体育系',
      level: '三年级',
      duration: 90,
      maxStudents: 20,
      location: '三完小步行街教学点-二楼',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 2, startTime: '08:10', endTime: '09:40', period: 'morning' },
        { dayOfWeek: 4, startTime: '08:10', endTime: '09:40', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(rouliball3)

  const pingpong1 = await prisma.course.upsert({
    where: { courseCode: 'C24041' },
    update: {},
    create: {
      courseCode: 'C24041',
      name: '乒乓球一年级',
      description: '乒乓球基础入门课程',
      category: '舞蹈体育系',
      level: '一年级',
      duration: 120,
      maxStudents: 16,
      location: '英睿达教学点-乒羽馆',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 3, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 4, startTime: '08:30', endTime: '10:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(pingpong1)

  const pingpong2 = await prisma.course.upsert({
    where: { courseCode: 'C24042' },
    update: {},
    create: {
      courseCode: 'C24042',
      name: '乒乓球二年级',
      description: '乒乓球技法进阶课程',
      category: '舞蹈体育系',
      level: '二年级',
      duration: 120,
      maxStudents: 16,
      location: '英睿达教学点-乒羽馆',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 1, startTime: '15:00', endTime: '17:00', period: 'afternoon' },
        { dayOfWeek: 5, startTime: '15:00', endTime: '17:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(pingpong2)

  const pingpong3 = await prisma.course.upsert({
    where: { courseCode: 'C24043' },
    update: {},
    create: {
      courseCode: 'C24043',
      name: '乒乓球三年级',
      description: '乒乓球高级技法课程',
      category: '舞蹈体育系',
      level: '三年级',
      duration: 120,
      maxStudents: 14,
      location: '英睿达教学点-乒羽馆',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 1, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 4, startTime: '15:00', endTime: '17:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(pingpong3)

  const squareDance = await prisma.course.upsert({
    where: { courseCode: 'C24044' },
    update: {},
    create: {
      courseCode: 'C24044',
      name: '广场舞',
      description: '群众广场舞教学',
      category: '舞蹈体育系',
      level: '',
      duration: 120,
      maxStudents: 40,
      location: '老体协教学点',
      semester: '2024年秋季',
      requiresGrades: false,
      gradeDescription: '群众舞蹈，不分年级',
      timeSlots: [
        { dayOfWeek: 1, startTime: '08:30', endTime: '10:30', period: 'morning' },
        { dayOfWeek: 3, startTime: '08:30', endTime: '10:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(squareDance)

  const doubleDance = await prisma.course.upsert({
    where: { courseCode: 'C24045' },
    update: {},
    create: {
      courseCode: 'C24045',
      name: '双人舞班',
      description: '双人舞蹈技巧',
      category: '舞蹈体育系',
      level: '',
      duration: 90,
      maxStudents: 20,
      location: '三完小步行街教学点-三楼',
      semester: '2024年秋季',
      requiresGrades: false,
      gradeDescription: '双人舞蹈，不分年级',
      timeSlots: [
        { dayOfWeek: 2, startTime: '08:10', endTime: '09:40', period: 'morning' },
        { dayOfWeek: 5, startTime: '08:10', endTime: '09:40', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(doubleDance)

  const qipao1 = await prisma.course.upsert({
    where: { courseCode: 'C24046' },
    update: {},
    create: {
      courseCode: 'C24046',
      name: '旗袍基础班',
      description: '旗袍秀基础课程',
      category: '舞蹈体育系',
      level: '',
      duration: 90,
      maxStudents: 25,
      location: '三完小步行街教学点-三楼',
      semester: '2024年秋季',
      requiresGrades: false,
      gradeDescription: '旗袍秀表演，不分年级',
      timeSlots: [
        { dayOfWeek: 2, startTime: '14:30', endTime: '16:00', period: 'afternoon' },
        { dayOfWeek: 5, startTime: '14:30', endTime: '16:00', period: 'afternoon' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(qipao1)

  const qipaoTeam = await prisma.course.upsert({
    where: { courseCode: 'C24047' },
    update: {},
    create: {
      courseCode: 'C24047',
      name: '旗袍队',
      description: '旗袍秀表演队',
      category: '舞蹈体育系',
      level: '',
      duration: 90,
      maxStudents: 20,
      location: '三完小步行街教学点-三楼',
      semester: '2024年秋季',
      requiresGrades: false,
      gradeDescription: '表演队形式，不分年级',
      timeSlots: [
        { dayOfWeek: 3, startTime: '14:30', endTime: '16:00', period: 'afternoon' },
        { dayOfWeek: 4, startTime: '08:10', endTime: '09:40', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(qipaoTeam)

  const aerobics1 = await prisma.course.upsert({
    where: { courseCode: 'C24048' },
    update: {},
    create: {
      courseCode: 'C24048',
      name: '健身操一年级',
      description: '健身操基础课程',
      category: '舞蹈体育系',
      level: '一年级',
      duration: 90,
      maxStudents: 30,
      location: '工人文化宫教学点',
      semester: '2024年秋季',
      requiresGrades: true,
      timeSlots: [
        { dayOfWeek: 2, startTime: '15:00', endTime: '17:00', period: 'afternoon' },
        { dayOfWeek: 4, startTime: '08:30', endTime: '10:30', period: 'morning' }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })
  courses.push(aerobics1)

  return courses
}

/**
 * 创建系统配置
 */
async function createSystemConfigs() {
  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config
    })
  }
}

/**
 * 创建学期数据 (注释掉，schema中暂无Semester模型)
 */
// async function createSemesters() {
//   await prisma.semester.upsert({
//     where: { name: '2024年秋季' },
//     update: {},
//     create: {
//       name: '2024年秋季',
//       startDate: new Date('2024-09-01'),
//       endDate: new Date('2025-01-31'),
//       isActive: true,
//       isCurrent: true
//     }
//   })
// }

/**
 * 主函数 - 执行数据库种子操作
 */
async function main() {
  console.log('🌱 开始2024年秋季课程数据种子操作...')

  try {
    // 1. 创建系统配置
    console.log('📝 创建系统配置...')
    await createSystemConfigs()

    // 2. 学期数据跳过 (schema中暂无Semester模型)
    // console.log('📅 创建学期数据...')
    // await createSemesters()

    // 3. 创建初始用户
    console.log('👥 创建初始用户...')
    const users = await createInitialUsers()

    // 4. 创建教师档案
    console.log('👩‍🏫 创建教师档案...')
    const teacherProfile = await createTeacherProfile(users.teacher)

    // 5. 创建学生档案
    console.log('👨‍🎓 创建学生档案...')
    const studentProfile = await createStudentProfile(users.student)

    // 6. 清理现有课程数据
    console.log('🧹 清理现有课程数据...')
    await prisma.attendance.deleteMany({})
    await prisma.enrollment.deleteMany({})
    await prisma.courseTeacher.deleteMany({})
    await prisma.course.deleteMany({})

    // 7. 创建2024年秋季课程
    console.log('📚 创建2024年秋季课程...')
    const courses = await create2024AutumnCourses(users.teacher, teacherProfile)

    console.log('✅ 数据库种子操作完成！')
    console.log(`📊 共创建 ${courses.length} 门课程`)
    console.log('\n🏫 教学点分布:')
    console.log('- 二道街教学点: 主要教学区域 (书画系、非遗系、电子信息系、声乐戏曲系、器乐演奏系、语言文学系)')
    console.log('- 三完小步行街教学点: 舞蹈体育类课程')
    console.log('- 英睿达教学点: 乒乓球专场')
    console.log('- 老体协教学点: 太极拳、广场舞')
    console.log('- 工人文化宫教学点: 舞蹈、健身操')
    console.log('\n🎯 院系课程分布:')
    console.log('- 书画系: 6门课程 (书法、绘画)')
    console.log('- 书画非遗系: 3门课程 (炭精粉、面花、编织)')
    console.log('- 电子信息系: 2门课程 (计算机、短视频制作)')
    console.log('- 声乐戏曲系: 4门课程 (声乐、二人台、合唱团、晋剧)')
    console.log('- 器乐演奏系: 8门课程 (古筝、电子琴、葫芦丝、二胡)')
    console.log('- 语言文学系: 3门课程 (朗诵主持、诗词、国学)')
    console.log('- 舞蹈体育系: 13门课程 (舞蹈、太极、瑜伽、柔力球、乒乓球等)')
    console.log('- 家政保健系: 1门课程 (烹饪班)')
    console.log('\n🔐 初始用户账号:')
    console.log('超级管理员: 13800000001 / 123456')
    console.log('学校管理员: 13800000002 / 123456')
    console.log('教师用户: 13800000003 / 123456')
    console.log('学生用户: 13800000004 / 123456')

  } catch (error) {
    console.error('❌ 种子操作失败:', error)
    throw error
  }
}

// 执行主函数
main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
