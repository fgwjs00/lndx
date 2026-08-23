const fs = require('fs')
const path = require('path')

const source = fs.readFileSync(
  path.resolve(__dirname, '../src/routes/publicRegistration.ts'),
  'utf8'
)

if (!source.includes("timeZone: 'Asia/Shanghai'")) {
  throw new Error('public insurance dates must use the China time zone')
}

if (source.includes('requiredInsuranceStart: requirement.requiredInsuranceStart.toISOString().slice(0, 10)')) {
  throw new Error('public insurance start date must not be formatted in UTC')
}

if (source.includes('requiredInsuranceEnd: requirement.requiredInsuranceEnd.toISOString().slice(0, 10)')) {
  throw new Error('public insurance end date must not be formatted in UTC')
}

console.log('public registration date contracts passed')
