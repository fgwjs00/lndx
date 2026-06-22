const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
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

const service = read('src/services/enrollmentApplicationService.ts')
const applicationV2 = read('src/routes/applicationV2.ts')

assertIncludes(service, 'createEnrollmentApplicationWithChoices', 'service must own phase 2 application creation')
assertIncludes(service, 'hasPhase2ApplicationTables', 'service must own phase 2 table probing')
assertIncludes(service, 'INSERT INTO "enrollment_applications"', 'service must write enrollment applications')
assertIncludes(service, 'INSERT INTO "enrollment_application_choices"', 'service must write enrollment application choices')
assertIncludes(service, 'generateApplicationCode', 'service must generate application codes centrally')

assertIncludes(applicationV2, "from '../services/enrollmentApplicationService'", 'application V2 must import shared enrollment application service')
assertNotIncludes(applicationV2, 'async function hasPhase2ApplicationTables', 'application V2 route must not own phase 2 table probing')
assertNotIncludes(applicationV2, 'async function createEnrollmentApplicationWithChoices', 'application V2 route must not own phase 2 application creation')

console.log('application service contracts passed')
