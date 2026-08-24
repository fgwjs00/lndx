require('dotenv').config()

const assert = require('assert')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const apiBaseUrl = (process.env.API_SMOKE_BASE_URL || 'http://127.0.0.1:3104').replace(/\/$/, '')
const originalUserStates = new Map()

function tokenFor(user) {
  return jwt.sign({
    userId: user.id,
    phone: user.phone,
    role: user.role
  }, process.env.JWT_SECRET, { expiresIn: '5m' })
}

async function request(path, token, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })
  const payload = await response.json().catch(() => null)
  return { status: response.status, payload }
}

async function ensureActiveRole(role) {
  const user = await prisma.user.findFirst({ where: { role } })
  assert(user, `local database has no ${role} user`)

  if (!user.isActive) {
    originalUserStates.set(user.id, false)
    return prisma.user.update({ where: { id: user.id }, data: { isActive: true } })
  }

  return user
}

async function expectStatus(results, name, path, expected, token, options) {
  const response = await request(path, token, options)
  assert.strictEqual(
    response.status,
    expected,
    `${name} returned HTTP ${response.status}: ${JSON.stringify(response.payload)}`
  )
  results.push({ name, status: response.status, code: response.payload?.error || response.payload?.code })
  return response
}

async function main() {
  assert(process.env.JWT_SECRET, 'JWT_SECRET is required for API permission verification')

  const admin = await ensureActiveRole('SUPER_ADMIN')
  const teacher = await ensureActiveRole('TEACHER')
  const student = await ensureActiveRole('STUDENT')
  const adminToken = tokenFor(admin)
  const teacherToken = tokenFor(teacher)
  const studentToken = tokenFor(student)
  const results = []

  await expectStatus(results, 'health', '/api/health', 200)
  await expectStatus(results, 'public semesters', '/api/public-registration/semesters', 200)
  const courses = await expectStatus(results, 'public courses', '/api/public-registration/courses?page=1&pageSize=2', 200)
  assert(Array.isArray(courses.payload?.data?.list), 'public courses response has no list')

  const sms = await expectStatus(results, 'disabled SMS', '/api/auth/send-sms', 503, null, {
    method: 'POST',
    body: JSON.stringify({ phone: '13900000000', type: 'register' })
  })
  assert.strictEqual(sms.payload?.error, 'SMS_SERVICE_DISABLED', 'disabled SMS returned the wrong error code')

  await expectStatus(results, 'anonymous student list', '/api/students?page=1&pageSize=1', 401)
  await expectStatus(results, 'anonymous sensitive file', '/uploads/id-cards/nonexistent-test-file.jpg', 401)
  await expectStatus(results, 'student sensitive search', '/api/search/students?q=test&limit=1', 403, studentToken)
  await expectStatus(results, 'teacher sensitive search', '/api/search/students?q=test&limit=1', 200, teacherToken)
  await expectStatus(results, 'student course list', '/api/courses?page=1&pageSize=1', 200, studentToken)
  await expectStatus(results, 'student attendance list', '/api/attendance?page=1&pageSize=1', 403, studentToken)
  await expectStatus(results, 'teacher attendance list', '/api/attendance?page=1&pageSize=1', 200, teacherToken)
  await expectStatus(results, 'teacher application review list', '/api/applications?page=1&pageSize=1', 200, teacherToken)
  await expectStatus(results, 'teacher role administration', '/api/roles?page=1&pageSize=1', 403, teacherToken)
  await expectStatus(results, 'admin student list', '/api/students?page=1&pageSize=1', 200, adminToken)
  await expectStatus(results, 'admin analysis overview', '/api/analysis/overview', 200, adminToken)

  console.log(JSON.stringify({ success: true, checks: results }, null, 2))
}

main()
  .finally(async () => {
    for (const [userId, isActive] of originalUserStates) {
      await prisma.user.update({ where: { id: userId }, data: { isActive } })
    }
    await prisma.$disconnect()
  })
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
