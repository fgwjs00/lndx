# Enrollment phase 2 scripts

These scripts prepare the roster and insurance foundation for the LNDX enrollment redesign.

## Safety rules

- Scripts default to dry-run mode.
- Add `--execute` only after a PostgreSQL backup is available.
- Scripts refuse non-local databases by default.
- Add `--allow-remote` only for a planned production maintenance window.
- The current `enrollments` table is not rewritten by these scripts.

## 1. Apply foundation tables

Dry run:

```bash
node scripts/enrollment-phase2-apply-foundation.js
```

Execute against the configured local database:

```bash
node scripts/enrollment-phase2-apply-foundation.js --execute
```

This applies `prisma/migrations/20260605000000_enrollment_phase2_foundation/migration.sql`.

## 2. Create historical roster snapshots

Dry run:

```bash
node scripts/enrollment-phase2-create-roster-snapshots.js --semester "2025年秋季"
```

Execute:

```bash
node scripts/enrollment-phase2-create-roster-snapshots.js --semester "2025年秋季" --execute
```

The script:

- creates or updates the academic year and semester record;
- creates one `class_sections` row per active published course in the semester;
- creates one `rosters` row per class section;
- inserts `roster_members` only from `APPROVED` historical enrollments;
- keeps `sourceEnrollmentId` so every roster member can be traced back to the old record.

## 3. Prepare next semester class sections

Dry run:

```bash
node scripts/enrollment-phase2-prepare-next-sections.js --from-semester "2025年秋季" --to-semester "2026年秋季"
```

Execute:

```bash
node scripts/enrollment-phase2-prepare-next-sections.js --from-semester "2025年秋季" --to-semester "2026年秋季" --execute
```

The script creates target-semester `class_sections` only. It does not copy old roster members.

## 4. Prepare next semester legacy courses

The current public registration page still reads published rows from the legacy `courses` table.
Use this script when the new semester must appear in the existing registration UI.

Dry run:

```bash
node scripts/enrollment-phase2-prepare-next-courses.js --from-semester "2025年秋季" --to-semester "2026年秋季"
```

Execute as draft courses, so admins can review before publishing:

```bash
node scripts/enrollment-phase2-prepare-next-courses.js --from-semester "2025年秋季" --to-semester "2026年秋季" --execute
```

Execute and publish immediately only after review:

```bash
node scripts/enrollment-phase2-prepare-next-courses.js --from-semester "2025年秋季" --to-semester "2026年秋季" --execute --publish --open-enrollment
```

The script:

- creates or updates the academic year and semester record;
- clones each published source-semester course into a new target-semester course row;
- copies existing course-teacher links to the cloned course;
- creates or rebinds `class_sections` to the cloned target course;
- does not copy old roster members or old enrollments.

## Recommended local rehearsal sequence

```bash
node scripts/enrollment-phase2-apply-foundation.js --execute
node scripts/enrollment-phase2-create-roster-snapshots.js --semester "2024年秋季" --execute
node scripts/enrollment-phase2-create-roster-snapshots.js --semester "2025年秋季" --execute
node scripts/enrollment-phase2-prepare-next-sections.js --from-semester "2025年秋季" --to-semester "2026年秋季" --execute
```

## Production backup and local rehearsal

Before touching Baota production migrations, follow the full deployment runbook:
`docs/deployment/baota-migration-runbook.md`.

Before running phase 2 scripts on Baota, export a PostgreSQL custom-format backup from the production server:

```bash
pg_dump --format=custom --file=/www/backup/lndx/lndx_phase2_before_$(date +%Y%m%d_%H%M%S).dump "$DATABASE_URL"
```

Restore that dump into a local rehearsal database. The local database name can be different from production:

```bash
createdb lndx_phase2_rehearsal
pg_restore --clean --if-exists --no-owner --dbname=lndx_phase2_rehearsal /path/to/lndx_phase2_before.dump
```

Point `backend/.env` at the rehearsal database, then run the recommended local rehearsal sequence above. Do not copy the production database name into local commands blindly; only `DATABASE_URL` decides the target.

Also run the legacy-course preparation script when the existing registration UI must show the new semester:

```bash
node scripts/enrollment-phase2-prepare-next-courses.js --from-semester "2025 autumn" --to-semester "2026 autumn" --execute
```

## Migration bookkeeping options

Use exactly one of these migration paths:

1. Prisma-managed path:

```bash
npx prisma migrate deploy
```

2. Manual SQL script path:

```bash
node scripts/enrollment-phase2-apply-foundation.js --execute
npx prisma migrate resolve --applied 20260605000000_enrollment_phase2_foundation
```

Do not run `prisma migrate deploy` after the manual SQL script unless `prisma migrate resolve` has recorded the migration. Otherwise PostgreSQL may see duplicate enum or table creation attempts.

## Baota deployment order

Use a short maintenance window because registration writes can create inconsistent rehearsal evidence while scripts run.

1. Confirm latest production backup with `pg_dump`.
2. Restore the backup locally with `pg_restore` and complete the rehearsal sequence.
3. In Baota, stop registration writes or put the app into a maintenance window.
4. Upload the verified source/dist bundle.
5. Run either `npx prisma migrate deploy` or the manual SQL script plus `prisma migrate resolve`.
6. Run dry-run scripts first, then execute the approved commands:

```bash
node scripts/enrollment-phase2-create-roster-snapshots.js --semester "2024 autumn" --execute --allow-remote
node scripts/enrollment-phase2-create-roster-snapshots.js --semester "2025 autumn" --execute --allow-remote
node scripts/enrollment-phase2-prepare-next-courses.js --from-semester "2025 autumn" --to-semester "2026 autumn" --execute --allow-remote
```

7. Rebuild Prisma client if dependencies changed, then restart the service:

```bash
npx prisma generate
pm2 restart lndx-backend
```

8. Verify `/api/health`, public registration semesters/courses, insurance review, and one test application flow before reopening writes.

## Rollback decision

Rollback decision points:

- If migration tables are only partially present, stop and restore from the `pg_dump` backup.
- If dry-run output does not match expected semester/course counts, do not add `--execute`.
- If `/api/health` fails after `pm2 restart`, keep the maintenance window closed and restore the previous backend bundle.
- If roster or course creation is wrong after execution, prefer restoring the backup over hand-deleting rows on production.

## Freeze roster after review

Freeze roster only after all submitted applications for the class section have been reviewed.
The freeze API publishes the roster snapshot and blocks later approval from adding members to that roster:

```bash
curl -X POST \
  -H "Authorization: Bearer <admin-token>" \
  http://127.0.0.1:3000/api/applications-v2/rosters/:classSectionId/freeze
```

Operational order:

1. Review pending insurance and enrollment applications.
2. Check that the class section has no submitted applications.
3. Call `/api/applications-v2/rosters/:classSectionId/freeze`.
4. Export or print the published roster as the final class roster for that semester.

## Baota copy exclude list

When copying files from local to Baota, do not upload these paths:

- `backend/logs/`
- `backend/uploads/`
- `backend/backups/`
- `local-db-backups/`
- `backend/node_modules/`
- `frontend/node_modules/`
- `lndx_backup_*/`
- `*.dump`
- `*.tar.gz`
- `*.backup`
- `.git/`
- local `.env` files unless the production values are intentionally reviewed

Run `node backend/scripts/check-baota-copy-boundary.js` before copying. Upload source
files and the verified build output only. Rebuild or regenerate dependencies on the
server when needed.
