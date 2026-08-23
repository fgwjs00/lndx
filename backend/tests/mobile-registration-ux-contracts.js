const fs = require('fs')
const path = require('path')

const source = fs.readFileSync(
  path.resolve(__dirname, '../../frontend/src/views/MobileRegistration.vue'),
  'utf8'
)

function assertIncludes(expected, label) {
  if (!source.includes(expected)) {
    throw new Error(`${label}: expected source to include ${JSON.stringify(expected)}`)
  }
}

function assertNotIncludes(unexpected, label) {
  if (source.includes(unexpected)) {
    throw new Error(`${label}: source must not include ${JSON.stringify(unexpected)}`)
  }
}

assertIncludes('courseSearchQuery', 'course search state must exist')
assertIncludes('activeCourseCategory', 'course category filter state must exist')
assertIncludes('courseCategoryFilters', 'course categories must be available as filters')
assertIncludes('visibleCourses', 'course list must apply search and category selection')
assertIncludes('m3-category-grid', 'course categories must use large directly selectable tiles')
assertIncludes('直接搜索', 'course search control must be visible as a secondary path')
assertNotIncludes('expandedCourseCategories', 'course selection must not require opening category accordions')
assertNotIncludes('course-category-trigger', 'course selection must not require opening category accordions')
assertIncludes('m3-progress-card', 'mobile page must use the M3 progress surface')
assertIncludes('min-height: 56px', 'primary controls must use elder-friendly touch targets')
assertIncludes('sticky-action-bar fixed bottom-0 left-0 right-0 z-40', 'mobile action bar must stay fixed to the viewport')
assertIncludes('padding-bottom: calc(132px + env(safe-area-inset-bottom))', 'form content must reserve only the action bar safe area')
assertIncludes('@media (prefers-reduced-motion: reduce)', 'reduced motion preference must be respected')
assertNotIncludes('enrollmentSmsCode', 'mobile page must not require an SMS code')

const insuranceStepStart = source.indexOf('v-show="currentStep === 2"')
const courseStepStart = source.indexOf('v-show="currentStep === 3"')
const contactStepStart = source.indexOf('v-show="currentStep === 4"')
const semesterField = source.indexOf('name="semester"')
const educationLevelField = source.indexOf('name="educationLevel"')
const politicalStatusField = source.indexOf('name="politicalStatus"')
const workStatusField = source.indexOf('name="isRetired"')
const insuranceStartField = source.indexOf('name="studyPeriodStart"')
const insuranceAttachmentField = source.indexOf('name="insuranceAttachmentFileId"')

if (courseStepStart < 0 || contactStepStart < 0 || semesterField < courseStepStart || semesterField > contactStepStart) {
  throw new Error('semester selection must be completed on the course selection step')
}

if (insuranceStartField < insuranceStepStart || insuranceStartField > courseStepStart || insuranceAttachmentField < insuranceStepStart || insuranceAttachmentField > courseStepStart) {
  throw new Error('insurance dates and proof must be collected before course selection')
}

for (const [field, label] of [
  [educationLevelField, 'education level'],
  [politicalStatusField, 'political status'],
  [workStatusField, 'work status']
]) {
  if (field < 0 || field > insuranceStepStart) {
    throw new Error(`${label} must be collected on the first step`)
  }
}

console.log('mobile registration UX contracts passed')
