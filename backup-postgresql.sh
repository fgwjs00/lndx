#!/usr/bin/env bash

# LNDX PostgreSQL backup script for Baota/Linux servers.
# It creates one downloadable tar.gz bundle containing:
#   - PostgreSQL custom-format dump
#   - backend/uploads archive, when present
#   - MANIFEST.txt with restore hints and checksums

set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/www/wwwroot/lndx}"
BACKUP_ROOT="${BACKUP_ROOT:-/www/backup/lndx}"
ENV_FILE="${ENV_FILE:-$PROJECT_DIR/backend/.env}"
UPLOADS_DIR="${UPLOADS_DIR:-$PROJECT_DIR/backend/uploads}"
SKIP_UPLOADS="${SKIP_UPLOADS:-0}"
KEEP_UNPACKED="${KEEP_UNPACKED:-0}"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-0}"

timestamp="$(date +%Y%m%d_%H%M%S)"
work_dir="$BACKUP_ROOT/.work-$timestamp"
bundle_file="$BACKUP_ROOT/lndx_backup_$timestamp.tar.gz"
dump_file="$work_dir/lndx_db_$timestamp.dump"
uploads_archive="$work_dir/uploads_$timestamp.tar.gz"
manifest_file="$work_dir/MANIFEST.txt"

log() {
  printf '[%s] %s\n' "$(date '+%F %T')" "$*"
}

die() {
  printf '[ERROR] %s\n' "$*" >&2
  exit 1
}

cleanup() {
  if [ "${KEEP_UNPACKED:-0}" != "1" ] && [ -n "${work_dir:-}" ] && [ -d "$work_dir" ]; then
    rm -rf "$work_dir"
  fi
}

trap cleanup EXIT
trap 'die "backup failed at line $LINENO"' ERR

show_help() {
  cat <<'EOF'
Usage:
  ./backup-postgresql.sh

Common overrides:
  PROJECT_DIR=/www/wwwroot/lndx ./backup-postgresql.sh
  BACKUP_ROOT=/www/backup/lndx ./backup-postgresql.sh
  SKIP_UPLOADS=1 ./backup-postgresql.sh
  DATABASE_URL='postgresql://user:pass@127.0.0.1:5432/lndx_db?schema=public' ./backup-postgresql.sh

Defaults:
  PROJECT_DIR=/www/wwwroot/lndx
  ENV_FILE=$PROJECT_DIR/backend/.env
  BACKUP_ROOT=/www/backup/lndx
  UPLOADS_DIR=$PROJECT_DIR/backend/uploads

The script reads DATABASE_URL from the environment first, then from backend/.env.
It never prints the database password.
EOF
}

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  show_help
  exit 0
fi

find_tool() {
  local name="$1"
  local candidate

  if command -v "$name" >/dev/null 2>&1; then
    command -v "$name"
    return 0
  fi

  for candidate in \
    "/www/server/pgsql/bin/$name" \
    "/www/server/postgresql/bin/$name" \
    "/usr/pgsql/bin/$name" \
    "/usr/local/pgsql/bin/$name" \
    "/usr/bin/$name"; do
    if [ -x "$candidate" ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  return 1
}

read_database_url() {
  if [ -n "${DATABASE_URL:-}" ]; then
    printf '%s\n' "$DATABASE_URL"
    return 0
  fi

  [ -f "$ENV_FILE" ] || die "ENV file not found: $ENV_FILE"

  local value
  value="$(sed -nE 's/^[[:space:]]*DATABASE_URL=//p' "$ENV_FILE" | tail -n 1 | sed -E 's/\r$//')"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"

  [ -n "$value" ] || die "DATABASE_URL is empty in $ENV_FILE"
  printf '%s\n' "$value"
}

safe_cleanup_old_backups() {
  case "$BACKUP_KEEP_DAYS" in
    ''|0) return 0 ;;
    *[!0-9]*) die "BACKUP_KEEP_DAYS must be a number, got: $BACKUP_KEEP_DAYS" ;;
  esac

  [ "$BACKUP_KEEP_DAYS" -gt 0 ] || return 0
  [ -d "$BACKUP_ROOT" ] || return 0

  log "Removing backup bundles older than $BACKUP_KEEP_DAYS days under $BACKUP_ROOT"
  find "$BACKUP_ROOT" -maxdepth 1 -type f -name 'lndx_backup_*.tar.gz' -mtime +"$BACKUP_KEEP_DAYS" -print -delete
}

write_manifest() {
  {
    printf 'LNDX backup manifest\n'
    printf 'Created at: %s\n' "$(date '+%F %T %z')"
    printf 'Project dir: %s\n' "$PROJECT_DIR"
    printf 'Env file: %s\n' "$ENV_FILE"
    printf 'Database dump: %s\n' "$(basename "$dump_file")"
    if [ -f "$uploads_archive" ]; then
      printf 'Uploads archive: %s\n' "$(basename "$uploads_archive")"
    else
      printf 'Uploads archive: skipped\n'
    fi
    printf '\nRestore database example:\n'
    printf '  createdb -U postgres lndx_db_restore\n'
    printf '  pg_restore -U postgres -d lndx_db_restore --clean --if-exists %s\n' "$(basename "$dump_file")"
    if [ -f "$uploads_archive" ]; then
      printf '\nExtract uploads example:\n'
      printf '  tar -xzf %s -C /www/wwwroot/lndx/backend\n' "$(basename "$uploads_archive")"
    fi
    printf '\nChecksums:\n'
    if command -v sha256sum >/dev/null 2>&1; then
      (cd "$work_dir" && find . -maxdepth 1 -type f ! -name 'MANIFEST.txt' -exec sha256sum {} \;)
    else
      printf 'sha256sum not available on this server\n'
    fi
  } > "$manifest_file"
}

umask 077

pg_dump_bin="${PG_DUMP_BIN:-$(find_tool pg_dump || true)}"
[ -n "$pg_dump_bin" ] || die "pg_dump not found. Install PostgreSQL client tools or set PG_DUMP_BIN."

pg_restore_bin="${PG_RESTORE_BIN:-$(find_tool pg_restore || true)}"
database_url="$(read_database_url)"

case "$database_url" in
  postgresql://*|postgres://*) ;;
  *) die "DATABASE_URL is not a PostgreSQL URL" ;;
esac

# Prisma uses ?schema=public, but pg_dump/libpq may reject that query parameter.
pg_dump_url="${database_url%%\?*}"

mkdir -p "$work_dir"
mkdir -p "$BACKUP_ROOT"

log "Starting PostgreSQL backup"
log "Project: $PROJECT_DIR"
log "Backup root: $BACKUP_ROOT"
log "Dumping database to $(basename "$dump_file")"

"$pg_dump_bin" \
  -F c \
  -Z 6 \
  --no-owner \
  --no-privileges \
  -f "$dump_file" \
  "$pg_dump_url"

if [ -n "$pg_restore_bin" ]; then
  log "Validating dump with pg_restore -l"
  "$pg_restore_bin" -l "$dump_file" >/dev/null
else
  log "pg_restore not found; skipping dump validation"
fi

if [ "$SKIP_UPLOADS" = "1" ]; then
  log "Skipping uploads archive because SKIP_UPLOADS=1"
elif [ -d "$UPLOADS_DIR" ]; then
  uploads_parent="$(dirname "$UPLOADS_DIR")"
  uploads_name="$(basename "$UPLOADS_DIR")"
  log "Archiving uploads from $UPLOADS_DIR"
  tar -czf "$uploads_archive" -C "$uploads_parent" "$uploads_name"
else
  log "Uploads directory not found, skipping: $UPLOADS_DIR"
fi

write_manifest

log "Creating downloadable bundle $(basename "$bundle_file")"
tar -czf "$bundle_file" -C "$work_dir" .

safe_cleanup_old_backups

log "Backup completed: $bundle_file"
log "Download this file from Baota file manager or with scp."
