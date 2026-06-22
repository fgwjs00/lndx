const { validateInsuranceCoverage } = require('../dist/services/enrollmentPolicyService')

function assertValid(result, label) {
  if (!result.isValid) {
    throw new Error(`${label}: expected valid, got ${JSON.stringify(result.errors)}`)
  }
}

function assertInvalid(result, label) {
  if (result.isValid) {
    throw new Error(`${label}: expected invalid`)
  }
}

assertValid(
  validateInsuranceCoverage({
    coverageStart: '2025-09-01',
    coverageEnd: '2026-09-01',
    requiredStart: new Date('2025-09-01T08:00:00.000Z'),
    requiredEnd: new Date('2026-09-01T07:59:59.000Z')
  }),
  'date-only insurance coverage should cover full required calendar dates'
)

assertInvalid(
  validateInsuranceCoverage({
    coverageStart: '2025-09-02',
    coverageEnd: '2026-09-01',
    requiredStart: new Date('2025-09-01T08:00:00.000Z'),
    requiredEnd: new Date('2026-09-01T07:59:59.000Z')
  }),
  'coverage starting after required date should remain invalid'
)

console.log('enrollment policy behavior tests passed')
