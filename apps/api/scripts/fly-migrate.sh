#!/bin/sh
# Fly release_command + Docker entrypoint helper.
# Soft-skips when DATABASE_URL is unset so first boots without Postgres still deploy.
# With DATABASE_URL set, runs `prisma migrate deploy` from the image paths.
set -eu

API_ROOT="/app/apps/api"
SCHEMA="${API_ROOT}/prisma/schema.prisma"

log() {
  echo "[fly-migrate] $*"
}

if [ -z "${DATABASE_URL:-}" ]; then
  log "DATABASE_URL unset — skipping prisma migrate deploy."
  log "Set secrets before relying on schema, e.g.:"
  log "  fly secrets set -a lugemi-api DATABASE_URL='postgresql://...'"
  exit 0
fi

if [ -x "${API_ROOT}/node_modules/.bin/prisma" ]; then
  PRISMA_BIN="${API_ROOT}/node_modules/.bin/prisma"
elif [ -x "/app/node_modules/.bin/prisma" ]; then
  PRISMA_BIN="/app/node_modules/.bin/prisma"
else
  log "ERROR: prisma CLI not found under /app (expected production dependency)."
  if [ "${MIGRATE_STRICT:-0}" = "1" ]; then
    exit 1
  fi
  log "Soft-failing (MIGRATE_STRICT!=1). App will still start."
  exit 0
fi

log "Running: ${PRISMA_BIN} migrate deploy --schema=${SCHEMA}"
cd "${API_ROOT}"

set +e
"${PRISMA_BIN}" migrate deploy --schema="${SCHEMA}"
status=$?
set -e

if [ "$status" -eq 0 ]; then
  log "Migrations applied."
  exit 0
fi

log "prisma migrate deploy failed (exit ${status})."
if [ "${MIGRATE_STRICT:-0}" = "1" ]; then
  exit "$status"
fi
log "Soft-failing so deploy/boot can continue. Set MIGRATE_STRICT=1 to hard-fail."
exit 0
