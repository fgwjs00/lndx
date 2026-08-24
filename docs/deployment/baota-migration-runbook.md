# LNDX Baota Migration Runbook

This runbook is the required path before copying local files to the Baota
server or running Prisma migrations against production.

`baota-deploy.sh` is a legacy script and is disabled by default. Do not use it
as the current production deployment entry point unless it has been reviewed and
rewritten for the exact production port, Nginx, and `.env` handling.

## Dependency Tooling

Both applications use `pnpm@10.13.1` and their committed `pnpm-lock.yaml`
files. Do not use `npm install`, do not copy local `node_modules`, and do not
reintroduce a second lock file. On the rehearsal machine and Baota server:

```bash
corepack enable
pnpm --version
pnpm --dir backend install --frozen-lockfile
pnpm --dir frontend install --frozen-lockfile
```

## Current Migration Chain

- `20250814161629_111`
- `20250819161543_add_insurance_period_fields`
- `20250819164123_make_course_fields_optional`
- `20250819171044_add_course_teaching_fields`
- `20250819173734_change_to_uuid_format`
- `20250820012828_add_student_photo_field`
- `20260605000000_enrollment_phase2_foundation`
- `20260606000000_student_academic_events`
- `20260820000000_roster_and_insurance_snapshots`
- `20260820010000_attendance_class_section_eligibility`
- `20260824000000_registration_signatures`

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
npx prisma migrate resolve --applied 20260606000000_student_academic_events
npx prisma migrate resolve --applied 20260820000000_roster_and_insurance_snapshots
npx prisma migrate resolve --applied 20260820010000_attendance_class_section_eligibility
npx prisma migrate resolve --applied 20260824000000_registration_signatures
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
pnpm --dir backend run build
pnpm --dir frontend run build
```

8. Verify the Baota copy boundary before packaging or copying files.

```bash
node backend/scripts/check-baota-copy-boundary.js
```

The script writes three local review files:

- `local-db-backups/baota-source-manifest.txt`: tracked source files that may be
  copied after review.
- `local-db-backups/baota-build-manifest.txt`: generated build output under
  `backend/dist/` and `frontend/dist/`. This list is valid only after both
  backend and frontend builds pass.
- `local-db-backups/baota-forbidden-local-paths.txt`: local-only paths currently
  present in the workspace. These paths are expected during development but must
  not be copied by a whole-directory upload.

Copy source and build output as separate categories. Do not copy local `.env`,
logs, dependencies, uploaded files, backup dumps, `.git`, or the
`local-db-backups/` review folder.

9. After committing the verified source, create the release packages from a
   clean worktree:

```bash
pnpm --dir backend run release:baota
```

The command creates a timestamped directory under
`local-db-backups/releases/` containing:

- `lndx-source-*.tar.gz`: source files from the exact Git commit.
- `lndx-build-*.tar.gz`: the locally verified `backend/dist/` and
  `frontend/dist/` output.
- `release-manifest.json`: commit id, migration list, file sizes, and SHA-256
  checksums.

The packaging command refuses to run with uncommitted source changes. This
prevents local-only edits from silently entering a Baota upload.

## Copy Boundary

Use this as the practical Baota upload boundary:

| Category | Local path | Baota handling |
| --- | --- | --- |
| Backend source | files listed in `baota-source-manifest.txt` | Copy reviewed source only, excluding local runtime data. |
| Backend build | `backend/dist/` | Copy after `pnpm --dir backend run build` succeeds. |
| Frontend build | `frontend/dist/` | Copy as the static site bundle. |
| Dependencies | `node_modules/`, `backend/node_modules/`, `frontend/node_modules/` | Do not copy from local; install or reuse server dependencies on Baota. |
| Environment | `.env`, `backend/.env`, `.env.*` | Do not copy local values; keep production values on Baota. |
| Runtime uploads | `backend/uploads/` | Do not overwrite from local; these are production data and must be backed up/restored deliberately. |
| Logs | `logs/`, `backend/logs/`, `*.log` | Do not copy. |
| Backups | `local-db-backups/`, `lndx_backup_*/`, `*.dump`, `*.tar.gz`, `*.backup` | Do not copy into `/www/wwwroot/lndx`. Store backups under `/www/backup/lndx`. |

Never upload the whole local project directory through the Baota file manager.
Use the manifests to review the exact files, then upload the approved source and
the two `dist` directories deliberately.

## Production Deployment Order

1. Confirm the latest `pg_dump` bundle exists and can be downloaded.
2. Complete the local restore and migration rehearsal.
3. Stop writes or open a short maintenance window.
4. Keep the production `.env` on Baota and set `TRUST_PROXY_HOPS=1` when
   exactly one trusted Nginx reverse proxy sits in front of Express. Do not use
   an unbounded `trust proxy=true` setting. Keep `SMS_ENABLED=false` until a
   real SMS provider has been integrated and acceptance-tested; disabled SMS
   endpoints must return `503` with `SMS_SERVICE_DISABLED`.
5. Copy reviewed source files and verified build output only.
6. Run `pnpm --dir backend install --frozen-lockfile`; never copy local
   `node_modules` to Baota.
7. Run the exact migration path rehearsed locally.
8. Run `npx prisma generate` if Prisma schema changed, after stopping the old
   Node process so Windows/Linux file locks cannot retain an old query engine.
9. Restart PM2.

```bash
pm2 restart lndx-backend
```

10. Verify:

```bash
curl http://127.0.0.1:3000/api/health
curl -i http://127.0.0.1:3000/uploads/id-cards/default-avatar.jpg
```

The health endpoint must report database healthy. The uploads request without a
token must return `401`; if Nginx serves it directly, the deployment is unsafe.
Old upload guides that configure Nginx `alias` or `root` for `/uploads/` are not
safe for the current system. `/uploads/` must be proxied to Express so
`authMiddleware` can enforce access control.

## Rollback

- If migration rehearsal fails, do not continue to production.
- If production migration partially applies, keep the maintenance window closed
  and restore the `pg_dump` backup.
- If `/api/health` fails after restart, restore the previous backend bundle and
  database backup together.
