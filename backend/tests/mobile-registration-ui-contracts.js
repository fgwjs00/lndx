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
assertIncludes(mobileRegistration, 'm3-progress-card', 'mobile registration must use the M3 progress surface')
assertIncludes(mobileRegistration, 'stepLabels', 'mobile registration must define readable step labels')
assertIncludes(mobileRegistration, 'currentStepMeta', 'mobile registration must show current step context')
assertIncludes(mobileRegistration, 'groupedAvailableCourses', 'mobile registration must compute grouped courses')
assertIncludes(mobileRegistration, 'courseCategoryFilters', 'mobile registration must derive selectable course categories')
assertIncludes(mobileRegistration, 'm3-category-grid', 'mobile registration must render large category cards')
assertIncludes(mobileRegistration, 'v-for="filter in courseCategoryFilters"', 'mobile registration must render selectable categories')
assertIncludes(mobileRegistration, 'visibleCourses', 'mobile registration must render the selected category or search result')
assertIncludes(mobileRegistration, 'v-for="course in visibleCourses"', 'mobile registration must render direct course choices')
assertIncludes(mobileRegistration, 'selectCourseCategory', 'mobile registration must make category selection a single action')
assertIncludes(mobileRegistration, 'courseSearchQuery', 'mobile registration must provide direct course search')
assertIncludes(mobileRegistration, 'selectedCourseSummary', 'mobile registration must show selected course summary')
assertIncludes(mobileRegistration, 'course-card', 'mobile registration must use stable course card styling')
assertIncludes(mobileRegistration, 'sticky-action-bar', 'mobile registration must keep key actions visible on mobile')
assertIncludes(mobileRegistration, '门课程', 'mobile registration must use Chinese course-count copy')
assertNotIncludes(mobileRegistration, 'v-for="course in availableCourses"', 'mobile registration must not render all courses as one flat list')
assertNotIncludes(mobileRegistration, 'expandedCourseCategories', 'mobile registration must not require opening category accordions')
assertNotIncludes(mobileRegistration, 'course-category-trigger', 'mobile registration must not require opening category accordions')
assertNotIncludes(mobileRegistration, '}} courses', 'mobile registration must not show English course-count copy')

console.log('mobile registration UI contracts passed')
