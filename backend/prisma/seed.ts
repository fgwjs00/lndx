/**
 * 数据库种子文件
 * @description 初始化数据库的基础数据
 */

import { PrismaClient, UserRole, Gender, CourseStatus, EnrollmentStatus, AttendanceStatus } from '@prisma/client'
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
      isActive: true
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
      isActive: true
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
      isActive: true
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
      isActive: true
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
      realName: studentUser.realName,
      gender: Gender.MALE,
      age: 20,
      birthday: new Date('2004-03-15'),
      idCardNumber: '110101200403150001',
      idCardAddress: '北京市东城区某某街道某某号',
      contactPhone: studentUser.phone,
      currentAddress: '北京市朝阳区某某小区某某号',
      emergencyContact: '李父',
      emergencyPhone: '13900000001',
      emergencyRelation: '父亲',
      healthStatus: '良好',
      userId: studentUser.id,
      createdBy: studentUser.id,
      isActive: true
    }
  })

  return studentProfile
}

/**
 * 创建示例课程
 */
async function createSampleCourses(teacherUser: any, teacherProfile: any) {
  // 舞蹈课程
  const danceCourse = await prisma.course.upsert({
    where: { courseCode: 'C2025001' },
    update: {},
    create: {
      courseCode: 'C2025001',
      name: '民族舞蹈基础班',
      description: '学习民族舞蹈的基本动作和技巧，适合零基础学员',
      category: '舞蹈',
      level: '初级',
      duration: 90,
      maxStudents: 20,
      price: 299.00,
      hasAgeRestriction: true,
      minAge: 6,
      maxAge: 65,
      ageDescription: '适合6-65岁学员',
      timeSlots: [
        {
          dayOfWeek: 2,
          startTime: '19:00',
          endTime: '20:30',
          period: 'evening'
        },
        {
          dayOfWeek: 4,
          startTime: '19:00',
          endTime: '20:30',
          period: 'evening'
        }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })

  // 声乐课程
  const vocalCourse = await prisma.course.upsert({
    where: { courseCode: 'C2025002' },
    update: {},
    create: {
      courseCode: 'C2025002',
      name: '流行声乐培训',
      description: '学习流行歌曲演唱技巧，提升歌唱水平',
      category: '音乐',
      level: '中级',
      duration: 60,
      maxStudents: 15,
      price: 399.00,
      hasAgeRestriction: true,
      minAge: 12,
      maxAge: 50,
      ageDescription: '适合12-50岁学员',
      timeSlots: [
        {
          dayOfWeek: 1,
          startTime: '14:00',
          endTime: '15:00',
          period: 'afternoon'
        },
        {
          dayOfWeek: 3,
          startTime: '14:00',
          endTime: '15:00',
          period: 'afternoon'
        },
        {
          dayOfWeek: 5,
          startTime: '14:00',
          endTime: '15:00',
          period: 'afternoon'
        }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })

  // 钢琴课程
  const pianoCourse = await prisma.course.upsert({
    where: { courseCode: 'C2025003' },
    update: {},
    create: {
      courseCode: 'C2025003',
      name: '钢琴入门班',
      description: '从基础乐理开始，学习钢琴演奏技巧',
      category: '音乐',
      level: '初级',
      duration: 45,
      maxStudents: 8,
      price: 499.00,
      hasAgeRestriction: true,
      minAge: 5,
      maxAge: 999,
      ageDescription: '5岁以上学员均可报名',
      timeSlots: [
        {
          dayOfWeek: 6,
          startTime: '09:00',
          endTime: '09:45',
          period: 'morning'
        },
        {
          dayOfWeek: 6,
          startTime: '10:00',
          endTime: '10:45',
          period: 'morning'
        },
        {
          dayOfWeek: 7,
          startTime: '15:00',
          endTime: '15:45',
          period: 'afternoon'
        }
      ],
      status: CourseStatus.PUBLISHED,
      createdBy: teacherUser.id,
      isActive: true
    }
  })

  // 创建教师-课程关联
  await prisma.courseTeacher.createMany({
    data: [
      {
        courseId: danceCourse.id,
        teacherId: teacherProfile.id,
        isMain: true
      },
      {
        courseId: vocalCourse.id,
        teacherId: teacherProfile.id,
        isMain: true
      },
      {
        courseId: pianoCourse.id,
        teacherId: teacherProfile.id,
        isMain: true
      }
    ],
    skipDuplicates: true
  })

  return { danceCourse, vocalCourse, pianoCourse }
}

/**
 * 创建示例报名记录
 */
async function createSampleEnrollments(
  studentProfile: any,
  courses: any,
  studentUser: any
) {
  // 报名舞蹈课
  await prisma.enrollment.upsert({
    where: {
      studentId_courseId: {
        studentId: studentProfile.id,
        courseId: courses.danceCourse.id
      }
    },
    update: {},
    create: {
      enrollmentCode: 'E2025001',
      studentId: studentProfile.id,
      courseId: courses.danceCourse.id,
      status: EnrollmentStatus.APPROVED,
      enrollmentDate: new Date(),
      approvedAt: new Date(),
      paymentAmount: 299.00,
      createdBy: studentUser.id
    }
  })

  // 报名钢琴课（待审核）
  await prisma.enrollment.upsert({
    where: {
      studentId_courseId: {
        studentId: studentProfile.id,
        courseId: courses.pianoCourse.id
      }
    },
    update: {},
    create: {
      enrollmentCode: 'E2025002',
      studentId: studentProfile.id,
      courseId: courses.pianoCourse.id,
      status: EnrollmentStatus.PENDING,
      enrollmentDate: new Date(),
      paymentAmount: 499.00,
      createdBy: studentUser.id
    }
  })
}

/**
 * 创建示例考勤记录
 */
async function createSampleAttendances(
  studentProfile: any,
  courses: any
) {
  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)

  await prisma.attendance.createMany({
    data: [
      {
        studentId: studentProfile.id,
        courseId: courses.danceCourse.id,
        attendanceDate: twoDaysAgo,
        status: AttendanceStatus.PRESENT,
        checkInTime: new Date(twoDaysAgo.getTime() + 19 * 60 * 60 * 1000), // 19:00
        isLate: false,
        method: 'FACE_RECOGNITION'
      },
      {
        studentId: studentProfile.id,
        courseId: courses.danceCourse.id,
        attendanceDate: yesterday,
        status: AttendanceStatus.LATE,
        checkInTime: new Date(yesterday.getTime() + 19 * 60 * 60 * 1000 + 15 * 60 * 1000), // 19:15
        isLate: true,
        lateMinutes: 15,
        method: 'MANUAL'
      },
      {
        studentId: studentProfile.id,
        courseId: courses.danceCourse.id,
        attendanceDate: today,
        status: AttendanceStatus.ABSENT,
        method: 'MANUAL'
      }
    ],
    skipDuplicates: true
  })
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
 * 主函数 - 执行数据库种子操作
 */
async function main() {
  console.log('🌱 开始数据库种子操作...')

  try {
    // 1. 创建系统配置
    console.log('📝 创建系统配置...')
    await createSystemConfigs()

    // 2. 创建初始用户
    console.log('👥 创建初始用户...')
    const users = await createInitialUsers()

    // 3. 创建教师档案
    console.log('👩‍🏫 创建教师档案...')
    const teacherProfile = await createTeacherProfile(users.teacher)

    // 4. 创建学生档案
    console.log('👨‍🎓 创建学生档案...')
    const studentProfile = await createStudentProfile(users.student)

    // 5. 创建示例课程
    console.log('📚 创建示例课程...')
    const courses = await createSampleCourses(users.teacher, teacherProfile)

    // 6. 创建示例报名记录
    console.log('📝 创建示例报名记录...')
    await createSampleEnrollments(studentProfile, courses, users.student)

    // 7. 创建示例考勤记录
    console.log('📊 创建示例考勤记录...')
    await createSampleAttendances(studentProfile, courses)

    console.log('✅ 数据库种子操作完成！')
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

