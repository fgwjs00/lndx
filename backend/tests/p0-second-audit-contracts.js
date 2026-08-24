const fs = require('fs')
const path = require('path')

const backendRoot = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), 'utf8')
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

function assertRegex(source, pattern, label) {
  if (!pattern.test(source)) {
    throw new Error(`${label}: expected source to match ${pattern}`)
  }
}

const applicationV2 = read('src/routes/applicationV2.ts')
const searchRoutes = read('src/routes/search.ts')
const assetAccess = read('src/middleware/assetAccess.ts')

assertRegex(
  applicationV2,
  /function getStudentWritableApplicationData[\s\S]*selectedClassSections,[\s\S]*classSectionIds,[\s\S]*\.\.\.studentData/,
  'application-only class section fields must be removed before Student writes'
)

for (const route of ['global', 'suggestions', 'students']) {
  assertRegex(
    searchRoutes,
    new RegExp(`router\\.get\\('/${route}', authMiddleware, requireTeacher,`),
    `${route} search must require a staff role`
  )
}

assertNotIncludes(assetAccess, 'STAFF_ROLES', 'teacher access must not be granted only by role membership')
assertIncludes(assetAccess, 'ADMIN_ROLES', 'administrators may retain school-wide asset access')
assertIncludes(assetAccess, 'canTeacherAccessStudentResource', 'teacher access must be resolved against assigned courses')
assertIncludes(assetAccess, 'enrollmentApplicationId', 'application identity files must resolve through their application metadata')
assertIncludes(assetAccess, 'rosterMembers', 'teacher access must cover assigned roster members')
assertIncludes(assetAccess, 'enrollmentChoices', 'teacher access must cover assigned pending applications')

console.log('p0 second audit contracts passed')
