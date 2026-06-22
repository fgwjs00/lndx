# Enrollment roster and insurance phase 2 plan

## Goal

Build the foundation for per-academic-year roster snapshots, semester class sections, two-major enrollment choices, public self-registration, and insurance coverage validation.

## Safety boundary

- Do not mutate production data in this phase.
- Do not replace the current `Enrollment` workflow yet.
- Add schema, migration draft, policy service, public read endpoints, and contract tests first.
- Keep existing authenticated admin routes runnable.
- Run migration only after local rehearsal, backup, and rollback SQL are ready.

## Tasks

- [x] Add contracts for the new enrollment architecture.
- [x] Add Prisma models for academic years, semesters, class sections, rosters, enrollment applications, choices, and student insurance.
- [x] Add a migration draft that creates only new tables and indexes.
- [x] Add a backend policy service for max two choices, time conflict detection, and insurance coverage checks.
- [x] Add public registration read endpoints for semesters and courses without exposing admin routes.
- [x] Wire mobile self-registration to the public course and semester endpoints.
- [x] Fix anonymous historical enrollment queries so course semester is available.
- [x] Validate contracts, Prisma schema, and backend build.

## Next phase

- [x] Rehearse migration against the restored local PostgreSQL database.
- [x] Generate 2024/2025 roster snapshots from approved historical enrollments.
- [x] Generate 2026 autumn class sections without mutating 2025 rosters.
- [x] Move V2 application submission to the shared enrollment policy service.
- [x] Add self-registration insurance upload and review workflow.
