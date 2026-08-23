/**
 * 本地手机报名验证数据。
 *
 * 仅用于本地恢复库：创建一个处于报名窗口内的演示学期和公开课程班次。
 * 所有记录均使用 LOCAL-DEMO 标识，可重复执行，不写入学员、报名或花名册数据。
 */
import { CourseStatus, PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEMO_ACADEMIC_YEAR_CODE = 'LOCAL-DEMO-2026-2027'
const DEMO_SEMESTER_CODE = 'LOCAL-DEMO-2026-AUTUMN'
const DEMO_SEMESTER_NAME = '2026年秋季（本地演示）'
const DEMO_ADMIN_PHONE = '19900009999'

type DemoCourse = {
  code: string
  name: string
  category: string
  description: string
  teacher: string
  location: string
  dayOfWeek: number
  startTime: string
  endTime: string
  capacity: number
}

const demoCourses: DemoCourse[] = [
  { code: 'ART-01', name: '合唱入门', category: '艺术修养', description: '学习正确发声与合唱配合，适合零基础学员。', teacher: '王老师', location: '综合楼音乐教室', dayOfWeek: 1, startTime: '09:00', endTime: '10:30', capacity: 30 },
  { code: 'ART-02', name: '戏曲身段体验', category: '艺术修养', description: '体验传统戏曲基本身段与节奏。', teacher: '李老师', location: '综合楼舞蹈教室', dayOfWeek: 3, startTime: '14:30', endTime: '16:00', capacity: 24 },
  { code: 'HEALTH-01', name: '太极拳基础', category: '健康养生', description: '从基本步法开始学习太极拳，动作舒缓。', teacher: '赵老师', location: '一楼活动大厅', dayOfWeek: 2, startTime: '09:00', endTime: '10:30', capacity: 35 },
  { code: 'HEALTH-02', name: '八段锦养生', category: '健康养生', description: '学习八段锦动作与日常养生方法。', teacher: '陈老师', location: '一楼活动大厅', dayOfWeek: 4, startTime: '09:00', endTime: '10:30', capacity: 35 },
  { code: 'DIGITAL-01', name: '智能手机基础', category: '数码生活', description: '学习微信、拍照、支付和常用手机设置。', teacher: '刘老师', location: '二楼电脑教室', dayOfWeek: 2, startTime: '14:30', endTime: '16:00', capacity: 20 },
  { code: 'DIGITAL-02', name: '手机摄影', category: '数码生活', description: '学习用手机拍摄人物和风景照片。', teacher: '孙老师', location: '二楼电脑教室', dayOfWeek: 5, startTime: '09:00', endTime: '10:30', capacity: 20 },
  { code: 'PAINT-01', name: '书法入门', category: '书画手工', description: '从执笔和基本笔画开始学习书法。', teacher: '周老师', location: '三楼书画教室', dayOfWeek: 1, startTime: '14:30', endTime: '16:00', capacity: 25 },
  { code: 'PAINT-02', name: '国画花鸟', category: '书画手工', description: '学习花鸟画的基础构图和用笔。', teacher: '吴老师', location: '三楼书画教室', dayOfWeek: 4, startTime: '14:30', endTime: '16:00', capacity: 22 },
  { code: 'PAINT-03', name: '手工编织', category: '书画手工', description: '学习围巾和小物件的基础编织方法。', teacher: '郑老师', location: '三楼手工教室', dayOfWeek: 5, startTime: '14:30', endTime: '16:00', capacity: 18 },
  { code: 'LIFE-01', name: '生活英语会话', category: '生活技能', description: '学习出行和日常交流中的简单英语表达。', teacher: '何老师', location: '二楼多功能教室', dayOfWeek: 3, startTime: '09:00', endTime: '10:30', capacity: 20 }
]

function buildTimeSlots(course: DemoCourse) {
  return [{
    dayOfWeek: course.dayOfWeek,
    startTime: course.startTime,
    endTime: course.endTime,
    period: course.startTime < '12:00' ? 'morning' : 'afternoon'
  }]
}

async function main() {
  const localDemoAdmin = await prisma.user.upsert({
    where: { phone: DEMO_ADMIN_PHONE },
    update: {
      realName: '本地演示管理员',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      mustChangePassword: false
    },
    create: {
      phone: DEMO_ADMIN_PHONE,
      email: 'local-demo-admin@invalid.local',
      password: await bcrypt.hash('local-demo-only-not-for-login', 12),
      realName: '本地演示管理员',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      mustChangePassword: false
    }
  })

  const academicYear = await prisma.academicYear.upsert({
    where: { code: DEMO_ACADEMIC_YEAR_CODE },
    update: {
      name: '2026-2027学年（本地演示）',
      startsAt: new Date('2026-09-01T00:00:00+08:00'),
      endsAt: new Date('2027-08-31T23:59:59+08:00'),
      enrollmentStartsAt: new Date('2026-08-01T00:00:00+08:00'),
      enrollmentEndsAt: new Date('2026-10-31T23:59:59+08:00'),
      requiredInsuranceStart: new Date('2026-09-01T00:00:00+08:00'),
      requiredInsuranceEnd: new Date('2027-08-31T23:59:59+08:00'),
      isActive: true
    },
    create: {
      code: DEMO_ACADEMIC_YEAR_CODE,
      name: '2026-2027学年（本地演示）',
      startsAt: new Date('2026-09-01T00:00:00+08:00'),
      endsAt: new Date('2027-08-31T23:59:59+08:00'),
      enrollmentStartsAt: new Date('2026-08-01T00:00:00+08:00'),
      enrollmentEndsAt: new Date('2026-10-31T23:59:59+08:00'),
      requiredInsuranceStart: new Date('2026-09-01T00:00:00+08:00'),
      requiredInsuranceEnd: new Date('2027-08-31T23:59:59+08:00'),
      isActive: true
    }
  })

  const semester = await prisma.semester.upsert({
    where: { code: DEMO_SEMESTER_CODE },
    update: {
      academicYearId: academicYear.id,
      name: DEMO_SEMESTER_NAME,
      startsAt: new Date('2026-09-01T00:00:00+08:00'),
      endsAt: new Date('2027-01-31T23:59:59+08:00'),
      isEnrollmentOpen: true,
      isActive: true
    },
    create: {
      academicYearId: academicYear.id,
      code: DEMO_SEMESTER_CODE,
      name: DEMO_SEMESTER_NAME,
      startsAt: new Date('2026-09-01T00:00:00+08:00'),
      endsAt: new Date('2027-01-31T23:59:59+08:00'),
      isEnrollmentOpen: true,
      isActive: true
    }
  })

  for (const courseDefinition of demoCourses) {
    const courseCode = `LOCAL-DEMO-${courseDefinition.code}`
    const timeSlots = buildTimeSlots(courseDefinition)
    const course = await prisma.course.upsert({
      where: { courseCode },
      update: {
        name: courseDefinition.name,
        description: courseDefinition.description,
        category: courseDefinition.category,
        level: '入门',
        duration: 16,
        maxStudents: courseDefinition.capacity,
        timeSlots,
        status: CourseStatus.PUBLISHED,
        isActive: true,
        location: courseDefinition.location,
        semester: DEMO_SEMESTER_NAME,
        teacher: courseDefinition.teacher,
        requiresGrades: false,
        gradeDescription: '本地演示课程，适合初次报名学员。',
        createdBy: localDemoAdmin.id
      },
      create: {
        courseCode,
        name: courseDefinition.name,
        description: courseDefinition.description,
        category: courseDefinition.category,
        level: '入门',
        duration: 16,
        maxStudents: courseDefinition.capacity,
        timeSlots,
        status: CourseStatus.PUBLISHED,
        isActive: true,
        location: courseDefinition.location,
        semester: DEMO_SEMESTER_NAME,
        teacher: courseDefinition.teacher,
        requiresGrades: false,
        gradeDescription: '本地演示课程，适合初次报名学员。',
        createdBy: localDemoAdmin.id
      }
    })

    await prisma.classSection.upsert({
      where: { code: `LOCAL-DEMO-SECTION-${courseDefinition.code}` },
      update: {
        name: `${courseDefinition.name}（本地演示班）`,
        academicYearId: academicYear.id,
        semesterId: semester.id,
        courseId: course.id,
        major: courseDefinition.category,
        capacity: courseDefinition.capacity,
        timeSlots,
        status: 'PUBLISHED',
        isActive: true
      },
      create: {
        code: `LOCAL-DEMO-SECTION-${courseDefinition.code}`,
        name: `${courseDefinition.name}（本地演示班）`,
        academicYearId: academicYear.id,
        semesterId: semester.id,
        courseId: course.id,
        major: courseDefinition.category,
        capacity: courseDefinition.capacity,
        timeSlots,
        status: 'PUBLISHED',
        isActive: true
      }
    })
  }

  console.log(JSON.stringify({
    academicYear: academicYear.name,
    semester: semester.name,
    courses: demoCourses.length,
    categories: [...new Set(demoCourses.map(course => course.category))]
  }, null, 2))
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
