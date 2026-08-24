const fs = require('fs')
const path = require('path')

const testsDir = path.resolve(__dirname, '..', 'tests')
const testFiles = fs.readdirSync(testsDir)
  .filter(file => file.endsWith('.js'))
  .sort()

const failures = []

for (const file of testFiles) {
  try {
    require(path.join(testsDir, file))
    console.log(`PASS ${file}`)
  } catch (error) {
    failures.push(file)
    console.error(`FAIL ${file}`)
    console.error(error)
  }
}

console.log(`CONTRACT_TOTAL=${testFiles.length}`)
console.log(`CONTRACT_FAILED=${failures.length}`)

if (failures.length > 0) {
  console.error(`FAILED_FILES=${failures.join(',')}`)
  process.exit(1)
}
