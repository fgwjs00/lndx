const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const workspaceRoot = path.resolve(root, '..')

function readWorkspace(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8')
}

function existsWorkspace(relativePath) {
  return fs.existsSync(path.join(workspaceRoot, relativePath))
}

function assertIncludes(source, expected, label) {
  if (!source.includes(expected)) {
    throw new Error(`${label}: expected source to include ${JSON.stringify(expected)}`)
  }
}

function assertNotIncludes(source, unexpected, label) {
  if (source.includes(unexpected)) {
    throw new Error(`${label}: source must not include ${JSON.stringify(unexpected)}`)
  }
}

if (!existsWorkspace('frontend/src/api/attendance.ts')) {
  throw new Error('attendance frontend API module must exist')
}

const attendanceApi = readWorkspace('frontend/src/api/attendance.ts')
const attendanceView = readWorkspace('frontend/src/views/Attendance.vue')

assertIncludes(attendanceApi, 'getAttendanceRecords', 'attendance API must expose list loader')
assertIncludes(attendanceApi, "request.get<AttendanceListResult>('/attendance'", 'attendance API list loader must call backend attendance route')
assertIncludes(attendanceApi, 'saveAttendanceRecord', 'attendance API must expose manual save')
assertIncludes(attendanceApi, "request.post<AttendanceRecordResponse>('/attendance'", 'attendance API save must call backend attendance route')

assertIncludes(attendanceView, "from '@/api/attendance'", 'attendance page must import attendance API')
assertIncludes(attendanceView, 'AttendanceService.getAttendanceRecords', 'attendance page must load real backend records')
assertIncludes(attendanceView, 'CourseService.getCourses', 'attendance page must load real course options')
assertIncludes(attendanceView, 'attendanceTotal', 'attendance page must use backend pagination total')
assertIncludes(attendanceView, 'loadingRecords', 'attendance page must show or track loading state')
assertIncludes(attendanceView, ":placeholder=\"['开始日期', '结束日期']\"", 'attendance date range picker must use Chinese placeholders')
assertIncludes(attendanceView, 'placeholder="请输入学员编号"', 'attendance student filter placeholder must be Chinese')
assertIncludes(attendanceView, "const headers = ['学员', '学员编号', '课程', '日期', '签到时间', '状态', '方式', '人脸置信度', '备注']", 'attendance export headers must be Chinese')
assertIncludes(attendanceView, "message.warning('暂无考勤记录可导出')", 'attendance export empty warning must be Chinese')
assertIncludes(attendanceView, 'link.download = `考勤记录_${dayjs().format(\'YYYY-MM-DD\')}.csv`', 'attendance export filename must be Chinese')
assertNotIncludes(attendanceView, 'const attendanceRecords = ref<AttendanceRecord[]>([', 'attendance page must not seed local mock attendance records')
assertNotIncludes(attendanceView, 'const availableCourses = ref<Course[]>([', 'attendance page must not seed local mock courses')
assertNotIncludes(attendanceView, '张三', 'attendance page must not contain sample student names')
assertNotIncludes(attendanceView, '李四', 'attendance page must not contain sample student names')

assertNotIncludes(attendanceView, 'placeholder="Student ID"', 'attendance page must not show English student ID placeholder')
assertNotIncludes(attendanceView, 'Start date', 'attendance page must not rely on English date picker placeholder')
assertNotIncludes(attendanceView, 'End date', 'attendance page must not rely on English date picker placeholder')
assertNotIncludes(attendanceView, "'Student'", 'attendance export headers must not be English')
assertNotIncludes(attendanceView, 'No attendance records to export', 'attendance export warning must not be English')
assertNotIncludes(attendanceView, '`attendance_', 'attendance export filename must not be English')

console.log('attendance frontend contracts passed')
