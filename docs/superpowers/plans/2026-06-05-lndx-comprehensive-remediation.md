# LNDX Comprehensive Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the live elderly-university student-status and enrollment system in small verified batches without breaking the deployed service.

**Architecture:** Keep production hardening and domain-model migration separate. First close no-schema P0 risks, then route new registration behavior through the Phase 2 semester/class-section/roster/insurance foundation while legacy tables remain readable. Every schema-affecting change must be rehearsed against the restored local PostgreSQL backup before Baota deployment.

**Tech Stack:** Node.js, Express, Prisma, PostgreSQL, Vue 3, Vite, Element Plus, local contract tests in `backend/tests/*.js`.

---

## Operating Rules

- Use one fresh sub-agent per independent task area; close it after its report or code is reviewed.
- Do not let two workers edit the same file set in parallel.
- Before behavior changes, add a focused contract test and watch it fail.
- Keep online rollback simple: avoid deleting legacy columns or historical rows in the same batch that introduces new workflow.
- Do not stage or commit broad generated artifacts until the source change set is reviewed.

## File Map

- `frontend/src/views/Login.vue`: remove production-visible quick-login/test-account UI.
- `.gitignore`: protect secrets, runtime uploads, dumps, logs, build output, and dependencies from future accidental commits.
- `backend/tests/phase1-hardening-contracts.js`: extend P0 safety contracts for login test UI and repository boundary.
- `backend/src/routes/applicationV2.ts`: next migration target for writing `EnrollmentApplication`, choices, insurance references, and roster-member intent.
- `backend/src/services/enrollmentPolicyService.ts`: source of truth for two-course and insurance-window validation.
- `backend/src/routes/publicRegistration.ts`: public semester/course read path for mobile self-registration.
- `backend/scripts/enrollment-phase2-*.js`: rehearsal and data-preparation scripts, always dry-run by default.
- `frontend/src/views/MobileRegistration.vue`: mobile course grouping, insurance upload, and submission UX.
- `backend/src/lib/prisma.ts`: future Prisma singleton used by routes and services.

---

### Task 1: P0 Login And Repository Boundary Closeout

**Files:**
- Modify: `backend/tests/phase1-hardening-contracts.js`
- Modify: `frontend/src/views/Login.vue`
- Create: `.gitignore`

- [ ] **Step 1: Write failing contracts**

Add assertions to `backend/tests/phase1-hardening-contracts.js`:

```js
const rootGitignorePath = path.join(root, '.gitignore');
assert.ok(fs.existsSync(rootGitignorePath), 'root .gitignore must exist');

const gitignore = fs.readFileSync(rootGitignorePath, 'utf8');
[
  '.env',
  'backend/.env',
  'backend/uploads/',
  'backend/logs/',
  'backend/dist/',
  'backend/node_modules/',
  'frontend/node_modules/',
  'local-db-backups/',
  '*.dump',
  '*.tar.gz',
].forEach((entry) => {
  assert.ok(gitignore.includes(entry), `.gitignore must include ${entry}`);
});

const loginVue = read('frontend/src/views/Login.vue');
[
  'showTestAccounts',
  'quickLogin',
  '13800000001',
  '13800000002',
  '13800000003',
  '测试账号',
].forEach((needle) => {
  assert.ok(!loginVue.includes(needle), `Login.vue must not expose ${needle}`);
});
```

- [ ] **Step 2: Verify the contracts fail before implementation**

Run: `node backend\tests\phase1-hardening-contracts.js`

Expected before implementation: failure mentioning missing `.gitignore` or exposed login test UI.

- [ ] **Step 3: Remove visible login test entry points**

Delete the test-account toggle/list and `quickLogin` helper from `frontend/src/views/Login.vue`. Keep normal username/password and SMS login flows unchanged.

- [ ] **Step 4: Add repository boundary ignore rules**

Create `.gitignore` with these entries:

```gitignore
.env
.env.*
backend/.env
frontend/.env
node_modules/
backend/node_modules/
frontend/node_modules/
dist/
backend/dist/
frontend/dist/
backend/logs/
backend/uploads/
local-db-backups/
*.dump
*.tar.gz
*.log
```

- [ ] **Step 5: Verify**

Run: `node backend\tests\phase1-hardening-contracts.js`

Expected after implementation: contract test exits with code 0.

Run: `npm run build` in `frontend`.

Expected after implementation: Vite build exits with code 0.

---

### Task 2: Registration Submission Writes Phase 2 Application Records

**Files:**
- Modify: `backend/tests/enrollment-phase2-contracts.js`
- Modify: `backend/src/routes/applicationV2.ts`
- Modify: `backend/src/services/enrollmentPolicyService.ts`

- [ ] **Step 1: Write failing contract**

Add a contract that verifies `applicationV2.ts` writes `enrollmentApplication`, `enrollmentApplicationChoice`, and references `studentInsurance` during public or mobile submission:

```js
const applicationV2 = read('backend/src/routes/applicationV2.ts');
assert.ok(applicationV2.includes('enrollmentApplication.create'), 'V2 application must create EnrollmentApplication');
assert.ok(applicationV2.includes('enrollmentApplicationChoice'), 'V2 application must create EnrollmentApplicationChoice rows');
assert.ok(applicationV2.includes('studentInsurance'), 'V2 application must validate or store StudentInsurance');
assert.ok(applicationV2.includes('validateTwoCoursePolicy'), 'V2 application must call shared enrollment policy');
```

- [ ] **Step 2: Verify red**

Run: `node backend\tests\enrollment-phase2-contracts.js`

Expected before implementation: failure on missing Phase 2 write path.

- [ ] **Step 3: Implement minimal write-through**

In `backend/src/routes/applicationV2.ts`, keep existing legacy `Enrollment` behavior for compatibility, but within the same Prisma transaction also create one `EnrollmentApplication` and one choice per selected class section/course. Use `enrollmentPolicyService` before creating records.

- [ ] **Step 4: Verify**

Run: `node backend\tests\enrollment-phase2-contracts.js`

Expected after implementation: contract test exits with code 0.

Run: `npm run build` in `backend`.

Expected after implementation: TypeScript build exits with code 0.

---

### Task 3: Per-Semester Roster Operations Stop Mutating Historical Rosters

**Files:**
- Modify: `backend/tests/enrollment-phase2-scripts-contracts.js`
- Modify: `backend/scripts/enrollment-phase2-create-roster-snapshots.js`
- Modify: `backend/scripts/enrollment-phase2-prepare-next-courses.js`
- Modify: `backend/src/routes/course.ts`

- [ ] **Step 1: Write failing contract**

Assert that next-semester preparation scripts create new `class_sections` and `rosters`, and never copy `roster_members` or mutate source semester `courseId` values.

- [ ] **Step 2: Verify red**

Run: `node backend\tests\enrollment-phase2-scripts-contracts.js`

Expected before implementation: failure for any missing roster creation or dry-run guard.

- [ ] **Step 3: Implement next-semester roster creation**

Extend the existing dry-run-first scripts so `--execute` creates empty rosters for target class sections. Keep source semester rosters unchanged.

- [ ] **Step 4: Verify**

Run: `node backend\tests\enrollment-phase2-scripts-contracts.js`

Expected after implementation: contract test exits with code 0.

Run a dry run:

```powershell
cd backend
node scripts\enrollment-phase2-prepare-next-courses.js --from-semester "2025年秋季" --to-semester "2026年秋季"
```

Expected after implementation: prints planned creations and does not write database rows.

---

### Task 4: Student Academic Events For Retention And Major Change

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260606000000_student_academic_events/migration.sql`
- Create: `backend/src/services/studentAcademicEventService.ts`
- Modify: `backend/src/routes/gradeManagement.ts`
- Modify: `backend/src/routes/student.ts`
- Create: `backend/tests/student-academic-events-contracts.js`

- [ ] **Step 1: Write failing contract**

Create `backend/tests/student-academic-events-contracts.js` asserting the schema contains `StudentAcademicEvent` and grade/major routes call `studentAcademicEventService`.

- [ ] **Step 2: Verify red**

Run: `node backend\tests\student-academic-events-contracts.js`

Expected before implementation: failure on missing model/service.

- [ ] **Step 3: Add append-only event model**

Add `StudentAcademicEvent` with `studentId`, `eventType`, `fromValue`, `toValue`, `reason`, `operatorId`, and `createdAt`. Do not remove existing `Student.currentGrade` or `Student.major`.

- [ ] **Step 4: Route retention and major change through the service**

Update grade retention and student major-change paths so they append an event inside the same transaction as the current field update.

- [ ] **Step 5: Verify**

Run: `node backend\tests\student-academic-events-contracts.js`

Run: `npm run build` in `backend`.

Expected after implementation: both commands exit with code 0.

---

### Task 5: Prisma Client Singleton And Transaction Boundary

**Files:**
- Create: `backend/src/lib/prisma.ts`
- Modify: route files under `backend/src/routes/*.ts` that instantiate `new PrismaClient()`
- Modify: service files under `backend/src/services/*.ts` that instantiate `new PrismaClient()`
- Create: `backend/tests/prisma-singleton-contracts.js`

- [ ] **Step 1: Write failing contract**

Create a contract test that allows `new PrismaClient()` only in `backend/src/lib/prisma.ts`.

- [ ] **Step 2: Verify red**

Run: `node backend\tests\prisma-singleton-contracts.js`

Expected before implementation: failure listing route/service files with direct Prisma construction.

- [ ] **Step 3: Implement singleton**

Create:

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 4: Replace direct construction**

Change routes/services from `const prisma = new PrismaClient()` to `import { prisma } from '../lib/prisma'` or `../../lib/prisma` based on file depth.

- [ ] **Step 5: Verify**

Run: `node backend\tests\prisma-singleton-contracts.js`

Run: `npm run build` in `backend`.

Expected after implementation: both commands exit with code 0.

---

## Release Verification For Every Batch

- Run the relevant contract tests for the touched area.
- Run `npm run build` in `backend` when backend TypeScript changed.
- Run `npm run build` in `frontend` when Vue/TypeScript changed.
- Start or reuse local services and verify the changed page in the browser before copying files to Baota.
- Record the exact source files and generated `dist` files that need to be copied online.
