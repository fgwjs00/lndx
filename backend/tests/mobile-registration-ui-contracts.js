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

const mobileRegistration = read('frontend/src/views/MobileRegistration.vue')

assertIncludes(mobileRegistration, 'computed', 'mobile registration must import computed')
assertIncludes(mobileRegistration, 'mobile-registration-hero', 'mobile registration must have a stronger first-screen hero')
assertIncludes(mobileRegistration, 'stepLabels', 'mobile registration must define readable step labels')
assertIncludes(mobileRegistration, 'currentStepMeta', 'mobile registration must show current step context')
assertIncludes(mobileRegistration, 'groupedAvailableCourses', 'mobile registration must compute grouped courses')
assertIncludes(mobileRegistration, 'v-for="group in groupedAvailableCourses"', 'mobile registration must render course groups')
assertIncludes(mobileRegistration, 'group.category', 'mobile registration group heading must show category')
assertIncludes(mobileRegistration, 'group.courses.length', 'mobile registration group heading must show group course count')
assertIncludes(mobileRegistration, 'v-for="course in group.courses"', 'mobile registration must render courses within their category group')
assertIncludes(mobileRegistration, 'expandedCourseCategories', 'mobile registration must support collapsible course categories')
assertIncludes(mobileRegistration, 'toggleCourseCategory', 'mobile registration must let learners open and close course categories')
assertIncludes(mobileRegistration, 'isCourseCategoryExpanded', 'mobile registration must only render expanded category course lists')
assertIncludes(mobileRegistration, 'selectedCourseSummary', 'mobile registration must show selected course summary')
assertIncludes(mobileRegistration, 'course-card', 'mobile registration must use stable course card styling')
assertIncludes(mobileRegistration, 'sticky-action-bar', 'mobile registration must keep key actions visible on mobile')
assertIncludes(mobileRegistration, '门课程', 'mobile registration must use Chinese course-count copy')
assertNotIncludes(mobileRegistration, 'v-for="course in availableCourses"', 'mobile registration must not render all courses as one flat list')
assertNotIncludes(mobileRegistration, '}} courses', 'mobile registration must not show English course-count copy')

console.log('mobile registration UI contracts passed')
