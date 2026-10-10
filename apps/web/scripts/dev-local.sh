#!/usr/bin/env bash
# Start Next for local Lugemi Studio on 0.0.0.0:43125.
# Cloud/agent shells sometimes export empty CLERK_* vars; those override
# apps/web/.env.local and send every route to /setup. Unset empties first.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-43125}"
HOST="${HOST:-0.0.0.0}"

for k in \
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
  CLERK_SECRET_KEY \
  ALLOW_CLERK_DEV_LOGIN \
  E2E_CLERK_USER_EMAIL \
  E2E_CLERK_USER_PASSWORD \
  NEXT_PUBLIC_CLERK_SIGN_IN_URL \
  NEXT_PUBLIC_CLERK_SIGN_UP_URL
do
  if [ -z "${!k:-}" ]; then
    unset "$k" || true
  fi
done

if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.local
  set +a
fi

if [ -z "${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}" ]; then
  echo "warning: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY unset — / will redirect to /setup" >&2
fi

exec pnpm exec next dev --hostname "$HOST" --port "$PORT"
