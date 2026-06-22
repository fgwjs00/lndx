# LNDX Baota Migration Runbook

This runbook is the required path before copying local files to the Baota
server or running Prisma migrations against production.

`baota-deploy.sh` is a legacy script and is disabled by default. Do not use it
as the current production deployment entry point unless it has been reviewed and
rewritten for the exact production port, Nginx, and `.env` handling.

## Current Migration Chain

- `20250814161629_111`
- `20250819161543_add_insurance_period_fields`
- `20250819164123_make_course_fields_optional`
- `20250819171044_add_course_teaching_fields`
- `20250819173734_change_to_uuid_format`
- `20250820012828_add_student_photo_field`
- `20260605000000_enrollment_phase2_foundation`
- `20260606000000_student_academic_events`

## Required Safety Order

1. Export a fresh production backup on Baota.

```bash
pg_dump --format=custom --no-owner --no-privileges \
  --file=/www/backup/lndx/lndx_before_migration_$(date +%Y%m%d_%H%M%S).dump \
  "$DATABASE_URL"
```

2. Restore that backup into a local rehearsal database. The local database name
   can differ from production.

```bash
createdb lndx_migration_rehearsal
pg_restore --clean --if-exists --no-owner \
  --dbname=lndx_migration_rehearsal \
  /path/to/lndx_before_migration.dump
```

3. Point `backend/.env` at the rehearsal database.

4. Check migration bookkeeping and P3005 risk.

```bash
node backend/scripts/check-prisma-migration-state.js
```

If the database has existing tables but no `_prisma_migrations` table, Prisma
will report `P3005` for direct deployment. Do not force it. Baseline the already
present migrations explicitly after confirming their tables/columns exist.

5. Record baseline migrations only after local evidence confirms the objects are
   already present.

```bash
cd backend
npx prisma migrate resolve --applied 20250814161629_111
npx prisma migrate resolve --applied 20250819161543_add_insurance_period_fields
npx prisma migrate resolve --applied 20250819164123_make_course_fields_optional
npx prisma migrate resolve --applied 20250819171044_add_course_teaching_fields
npx prisma migrate resolve --applied 20250819173734_change_to_uuid_format
npx prisma migrate resolve --applied 20250820012828_add_student_photo_field
npx prisma migrate resolve --applied 20260605000000_enrollment_phase2_foundation
```

6. Apply migrations that are not already present in the rehearsal database.

For a Prisma-managed rehearsal after baseline:

```bash
npx prisma migrate deploy
```

For a manual SQL rehearsal of a single reviewed migration:

```bash
npx prisma db execute \
  --schema prisma/schema.prisma \
  --file prisma/migrations/20260606000000_student_academic_events/migration.sql
npx prisma migrate resolve --applied 20260606000000_student_academic_events
```

Use the manual SQL fallback only for rehearsals or an approved maintenance
window where the exact SQL file has been reviewed.

7. Run local verification.

```bash
node backend/tests/migration-governance-contracts.js
node backend/tests/student-academic-events-contracts.js
npm run build
```

8. Verify the Baota copy boundary before packaging or copying files.

```bash
node backend/scripts/check-baota-copy-boundary.js
```

The script writes `local-db-backups/baota-source-manifest.txt` for review. Copy
tracked source and verified build output only. Do not copy local `.env`, logs,
dependencies, uploaded files, backup dumps, or `.git`.

## Production Deployment Order

1. Confirm the latest `pg_dump` bundle exists and can be downloaded.
2. Complete the local restore and migration rehearsal.
3. Stop writes or open a short maintenance window.
4. Copy reviewed source files and verified build output only.
5. Run the exact migration path rehearsed locally.
6. Run `npx prisma generate` if Prisma schema changed.
7. Restart PM2.

```bash
pm2 restart lndx-backend
```

8. Verify:

```bash
curl http://127.0.0.1:3000/api/health
curl -i http://127.0.0.1:3000/uploads/id-cards/default-avatar.jpg
```

The health endpoint must report database healthy. The uploads request without a
token must return `401`; if Nginx serves it directly, the deployment is unsafe.

## Rollback

- If migration rehearsal fails, do not continue to production.
- If production migration partially applies, keep the maintenance window closed
  and restore the `pg_dump` backup.
- If `/api/health` fails after restart, restore the previous backend bundle and
  database backup together.
