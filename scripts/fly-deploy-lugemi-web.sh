#!/usr/bin/env bash
# Create / deploy Fly app lugemi-web (Next.js apps/web) for lugemi.com + www.
# Run from the monorepo root on a machine with flyctl auth (FLY_API_TOKEN or `fly auth login`).
#
# Usage:
#   export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY='pk_live_...'
#   export CLERK_SECRET_KEY='sk_live_...'   # optional but recommended
#   bash scripts/fly-deploy-lugemi-web.sh
#
# Prints Shared IPv4/IPv6 and an exact Cloudflare DNS paste table.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="${FLYCTL_INSTALL:-$HOME/.fly}/bin:${PATH}"

APP="${FLY_WEB_APP:-lugemi-web}"
ORG="${FLY_ORG:-}"
REGION="${FLY_PRIMARY_REGION:-jnb}"
CONFIG="${FLY_WEB_CONFIG:-infra/fly/web.jnb.toml}"
DOCKERFILE="${FLY_WEB_DOCKERFILE:-apps/web/Dockerfile}"
API_URL="${NEXT_PUBLIC_API_URL:-https://api.lugemi.com}"
APP_URL="${APP_URL:-https://lugemi.com}"
CLERK_PK="${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-pk_live_Y2xlcmsubHVnZW1pLmNvbSQ}"

# Known production API (verbalab) IPs — DO NOT change these for apex; keep on api.lugemi.com only.
API_IPV4="${FLY_API_IPV4:-66.241.125.66}"
API_IPV6="${FLY_API_IPV6:-2a09:8280:1::1a9:e613:0}"

if ! command -v fly >/dev/null 2>&1 && ! command -v flyctl >/dev/null 2>&1; then
  echo "flyctl not found. Install: curl -L https://fly.io/install.sh | sh" >&2
  exit 1
fi
FLY="$(command -v fly 2>/dev/null || command -v flyctl)"

echo "==> Auth check"
if ! "$FLY" auth whoami >/dev/null 2>&1; then
  echo "Not logged in. Set FLY_API_TOKEN or run: fly auth login" >&2
  exit 1
fi
"$FLY" auth whoami

echo "==> Ensure app exists: $APP"
if ! "$FLY" apps list --json 2>/dev/null | grep -q "\"Name\":\"${APP}\""; then
  if [[ -n "$ORG" ]]; then
    "$FLY" apps create "$APP" --org "$ORG" || true
  else
    "$FLY" apps create "$APP" || true
  fi
fi

echo "==> Allocate shared IPv4 + IPv6 (idempotent)"
"$FLY" ips allocate-v4 --shared -a "$APP" 2>/dev/null || true
"$FLY" ips allocate-v6 -a "$APP" 2>/dev/null || true

echo "==> Current IPs for $APP"
"$FLY" ips list -a "$APP"

if [[ -n "${CLERK_SECRET_KEY:-}" ]]; then
  echo "==> Set runtime secrets"
  "$FLY" secrets set -a "$APP" \
    "CLERK_SECRET_KEY=${CLERK_SECRET_KEY}" \
    "APP_URL=${APP_URL}"
else
  echo "==> Skipping CLERK_SECRET_KEY (unset). Set later with:"
  echo "    fly secrets set -a $APP CLERK_SECRET_KEY=... APP_URL=$APP_URL"
fi

GOOGLE_OAUTH="${NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED:-true}"
BUILD_ARGS=(
  --build-arg "NEXT_PUBLIC_API_URL=${API_URL}"
  --build-arg "NEXT_PUBLIC_APP_URL=${APP_URL}"
  --build-arg "NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED=${GOOGLE_OAUTH}"
)
if [[ -n "$CLERK_PK" ]]; then
  BUILD_ARGS+=(--build-arg "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${CLERK_PK}")
else
  echo "WARN: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY unset — Clerk UI will not work in production." >&2
fi

echo "==> Deploy ($CONFIG → $DOCKERFILE)"
"$FLY" deploy . -c "$CONFIG" --dockerfile "$DOCKERFILE" --remote-only "${BUILD_ARGS[@]}"

if [[ "$REGION" == "jnb" && "$APP" == "lugemi-web" ]]; then
  echo "==> Prune non-jnb Machines (Africa-first)"
  FLY_WEB_APP="$APP" FLY_KEEP_REGION=jnb bash "$ROOT/scripts/fly-prune-lugemi-web-non-jnb.sh" || true
fi

echo "==> Add TLS certificate hosts (DNS must point here before issuance completes)"
"$FLY" certs add lugemi.com -a "$APP" 2>/dev/null || true
"$FLY" certs add www.lugemi.com -a "$APP" 2>/dev/null || true

echo "==> Cert setup hints (add TXT records DNS-only / grey cloud)"
"$FLY" certs setup lugemi.com -a "$APP" 2>/dev/null || true
"$FLY" certs setup www.lugemi.com -a "$APP" 2>/dev/null || true

echo "==> Smoke fly.dev"
if curl -fsS --max-time 30 "https://${APP}.fly.dev/health"; then
  echo
else
  echo "WARN: https://${APP}.fly.dev/health failed — check fly status -a $APP" >&2
fi

# Parse IPv4 / IPv6 from ips list JSON
IPS_JSON="$("$FLY" ips list -a "$APP" --json 2>/dev/null || true)"
WEB_IPV4=""
WEB_IPV6=""
if [[ -n "$IPS_JSON" ]] && command -v python3 >/dev/null 2>&1; then
  eval "$(
    printf '%s' "$IPS_JSON" | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    data = []
v4 = v6 = ""
rows = data if isinstance(data, list) else []
for row in rows:
    addr = row.get("Address") or row.get("address") or ""
    typ = (row.get("Type") or row.get("type") or "").lower()
    if addr and ":" not in addr and (not v4 or "v4" in typ or "shared" in typ):
        if ":" not in addr:
            v4 = addr
    if addr and ":" in addr and (not v6 or "v6" in typ):
        v6 = addr
if not v4:
    for row in rows:
        addr = row.get("Address") or row.get("address") or ""
        if addr and ":" not in addr:
            v4 = addr
            break
if not v6:
    for row in rows:
        addr = row.get("Address") or row.get("address") or ""
        if addr and ":" in addr:
            v6 = addr
            break
print("WEB_IPV4=%r" % (v4,))
print("WEB_IPV6=%r" % (v6,))
'
  )"
fi

if [[ -z "$WEB_IPV4" || -z "$WEB_IPV6" ]]; then
  echo
  echo "Could not auto-parse IPs. Copy from:"
  echo "  fly ips list -a $APP"
  WEB_IPV4="${WEB_IPV4:-<PASTE_FROM_fly_ips_list_v4>}"
  WEB_IPV6="${WEB_IPV6:-<PASTE_FROM_fly_ips_list_v6>}"
fi

cat <<EOF

================================================================================
Cloudflare → DNS → Records for zone lugemi.com
UPDATE apex (@) and www to WEB. Leave api on verbalab IPs.
Prefer Proxy = DNS only (grey) until fly certs check is green, then optional orange.
================================================================================

| Type  | Name | Content / Target                                      | Proxy          | Action   |
|-------|------|-------------------------------------------------------|----------------|----------|
| A     | @    | ${WEB_IPV4}                                           | DNS only       | UPDATE   |
| AAAA  | @    | ${WEB_IPV6}                                           | DNS only       | UPDATE   |
| CNAME | www  | lugemi.com                                            | DNS only       | UPDATE   |
| A     | api  | ${API_IPV4}                                           | DNS only/orange| KEEP     |
| AAAA  | api  | ${API_IPV6}                                           | DNS only/orange| KEEP     |

Also add every TXT from \`fly certs setup lugemi.com -a ${APP}\` and
\`fly certs setup www.lugemi.com -a ${APP}\` with Proxy = DNS only (grey).

Do NOT point @ or www at ${API_IPV4} — that is the Nest API (Cannot GET /).

Verify after DNS + certs:
  curl -fsS -I https://lugemi.com/          # expect HTML / 200, not Cannot GET /
  curl -fsS https://lugemi.com/health       # {"status":"ok","service":"lugemi-web"}
  curl -fsS https://api.lugemi.com/health   # Nest health JSON
  fly certs check lugemi.com -a ${APP}
  fly certs check www.lugemi.com -a ${APP}
================================================================================
EOF
