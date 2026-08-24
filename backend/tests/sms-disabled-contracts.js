const fs = require('fs')
const path = require('path')

const backendRoot = path.resolve(__dirname, '..')
const workspaceRoot = path.resolve(backendRoot, '..')

function readBackend(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), 'utf8')
}

function readWorkspace(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8')
}

function assertIncludes(source, expected, label) {
  if (!source.includes(expected)) {
    throw new Error(`${label}: expected source to include ${JSON.stringify(expected)}`)
  }
}

function assertNotIncludes(source, expected, label) {
  if (source.includes(expected)) {
    throw new Error(`${label}: source must not include ${JSON.stringify(expected)}`)
  }
}

const config = readBackend('src/config/index.ts')
const authRoutes = readBackend('src/routes/auth.ts')
const smsService = readBackend('src/services/smsService.ts')
const envTemplate = readBackend('env.production.template')
const mobileRegistration = readWorkspace('frontend/src/views/MobileRegistration.vue')

assertIncludes(config, 'enabled: boolean', 'SMS configuration must expose an explicit enabled flag')
assertIncludes(config, 'SMS_ENABLED', 'SMS enabled state must come from the environment')
assertIncludes(envTemplate, 'SMS_ENABLED=false', 'production must keep SMS disabled by default')
assertIncludes(authRoutes, "'SMS_SERVICE_DISABLED'", 'SMS-dependent routes must fail with a stable disabled code')
assertIncludes(authRoutes, 'ensureSmsEnabled()', 'SMS-dependent routes must enforce the disabled gate')
assertIncludes(authRoutes, "router.post('/send-sms', requireSmsEnabled, smsLimiter", 'SMS disabled gate must run before rate limiting')
assertIncludes(smsService, 'config.sms.enabled', 'SMS service must enforce the enabled flag')
assertNotIncludes(smsService, 'simulateSms', 'disabled SMS must never fall back to simulated success')
assertNotIncludes(smsService, 'console.log(`\\n', 'SMS verification codes must not be printed to the console')
assertIncludes(mobileRegistration, '无需短信验证码', 'public registration must remain independent of SMS')

console.log('sms disabled contracts passed')
