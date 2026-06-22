const fs = require('fs')
const path = require('path')

const workspaceRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8')
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

const appView = read('frontend/src/App.vue')
const attendanceView = read('frontend/src/views/Attendance.vue')

assertIncludes(appView, "import zhCN from 'ant-design-vue/es/locale/zh_CN'", 'app root must import Ant Design Vue Chinese locale')
assertIncludes(appView, "import 'dayjs/locale/zh-cn'", 'app root must load dayjs Chinese locale for date components')
assertIncludes(appView, "dayjs.locale('zh-cn')", 'app root must set dayjs locale to Chinese')
assertIncludes(appView, '<a-config-provider :locale="zhCN">', 'app root must wrap pages with Ant Design Vue ConfigProvider')
assertIncludes(appView, '</a-config-provider>', 'app root must close Ant Design Vue ConfigProvider')
assertIncludes(appView, '<router-view />', 'app root must continue rendering routed pages')

assertNotIncludes(attendanceView, 'No data', 'attendance page must not hardcode English empty state')
assertNotIncludes(attendanceView, '/ page', 'attendance page must not hardcode English pagination text')

console.log('antd locale contracts passed')
