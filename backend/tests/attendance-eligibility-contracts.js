const fs = require('fs')
const path = require('path')

const backendRoot = path.resolve(__dirname, '..')
const workspaceRoot = path.resolve(backendRoot, '..')
const readBackend = (relativePath) => fs.readFileSync(path.join(backendRoot, relativePath), 'utf8')
const readWorkspace = (relativePath) => fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8')
const assertIncludes = (source, expected, label) => {
  if (!source.includes(expected)) throw new Error(`${label}: expected ${JSON.stringify(expected)}`)
}

const schema = readBackend('prisma/schema.prisma')
const migration = readBackend('prisma/migrations/20260820010000_attendance_class_section_eligibility/migration.sql')
const route = readBackend('src/routes/attendance.ts')
const api = readWorkspace('frontend/src/api/attendance.ts')

assertIncludes(schema, 'classSectionId String?', 'attendance schema must retain nullable class-section ownership for legacy rows')
assertIncludes(schema, 'attendances       Attendance[]', 'class section must expose attendance relation')
assertIncludes(migration, 'ADD COLUMN "classSectionId" TEXT', 'migration must add class-section column without rewriting old attendance')
assertIncludes(migration, 'ON DELETE SET NULL', 'deleted class sections must not delete historical attendance')
assertIncludes(route, 'resolveAttendanceClassSection', 'attendance write must resolve roster eligibility')
assertIncludes(route, "r.status = 'PUBLISHED'", 'attendance eligibility must require a frozen roster')
assertIncludes(route, "rm.status = 'ACTIVE'", 'attendance eligibility must require an active roster member')
assertIncludes(route, 'ATTENDANCE_NOT_ELIGIBLE', 'ineligible attendance attempts must be rejected')
assertIncludes(route, '"classSectionId" = ${resolvedClassSectionId}', 'new attendance must persist resolved class-section ownership')
assertIncludes(api, 'classSectionId?: string', 'attendance API must support explicit class section selection')

console.log('attendance eligibility contracts passed')
