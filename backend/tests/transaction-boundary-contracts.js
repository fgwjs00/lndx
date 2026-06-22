const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function assertRegex(source, pattern, label) {
  if (!pattern.test(source)) {
    throw new Error(`${label}: expected source to match ${pattern}`)
  }
}

const studentCodeGenerator = read('src/utils/studentCodeGenerator.ts')
const applicationV2 = read('src/routes/applicationV2.ts')

assertRegex(
  studentCodeGenerator,
  /generateStudentCode\s*\(\s*semester\?:\s*string,\s*db:\s*any\s*=\s*prisma\s*\)/,
  'student code generator must accept an injectable db/tx context'
)
assertRegex(
  studentCodeGenerator,
  /await\s+db\.student\.findFirst/,
  'student code generator must read students through the injected db context'
)
assertRegex(
  studentCodeGenerator,
  /await\s+db\.student\.findUnique/,
  'student code generator must verify uniqueness through the injected db context'
)
assertRegex(
  applicationV2,
  /generateStudentCode\s*\(\s*applicationData\.semester,\s*tx\s*\)/,
  'application V2 must generate student codes inside its transaction context'
)

console.log('transaction boundary contracts passed')
