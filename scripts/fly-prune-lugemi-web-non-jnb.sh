#!/usr/bin/env bash
# Destroy lugemi-web Machines outside Africa primary region (jnb).
# Africa-first production must not keep orphan ams/iad Machines — Fly Doctor
# then fails servicecheck-00-http-3000 on those instances while ports 80/443
# look intermittent from the edge.
#
# Usage (from repo root, with flyctl auth / FLY_API_TOKEN):
#   bash scripts/fly-prune-lugemi-web-non-jnb.sh
#   FLY_WEB_APP=lugemi-web FLY_KEEP_REGION=jnb bash scripts/fly-prune-lugemi-web-non-jnb.sh
set -euo pipefail

export PATH="${FLYCTL_INSTALL:-$HOME/.fly}/bin:${PATH}"

APP="${FLY_WEB_APP:-lugemi-web}"
KEEP="${FLY_KEEP_REGION:-jnb}"
DRY_RUN="${DRY_RUN:-0}"

if ! command -v flyctl >/dev/null 2>&1 && ! command -v fly >/dev/null 2>&1; then
  echo "flyctl not found" >&2
  exit 1
fi
FLY="$(command -v flyctl 2>/dev/null || command -v fly)"

if ! "$FLY" auth whoami >/dev/null 2>&1; then
  echo "Not logged in. Set FLY_API_TOKEN or run: fly auth login" >&2
  exit 1
fi

echo "==> Listing Machines for ${APP} (keep region=${KEEP})"
JSON="$("$FLY" machines list -a "$APP" --json)"
if [[ -z "$JSON" || "$JSON" == "null" || "$JSON" == "[]" ]]; then
  echo "No Machines found."
  exit 0
fi

mapfile -t ROWS < <(
  printf '%s' "$JSON" | python3 -c '
import json, sys
data = json.load(sys.stdin)
keep = "'"$KEEP"'"
rows = data if isinstance(data, list) else []
for m in rows:
    mid = m.get("id") or m.get("ID") or ""
    region = m.get("region") or m.get("Region") or ""
    state = m.get("state") or m.get("State") or ""
    if mid and region and region != keep:
        print(f"{mid}\t{region}\t{state}")
'
)

if [[ ${#ROWS[@]} -eq 0 ]]; then
  echo "All Machines are in ${KEEP}. Nothing to prune."
  exit 0
fi

for row in "${ROWS[@]}"; do
  mid="${row%%$'\t'*}"
  rest="${row#*$'\t'}"
  region="${rest%%$'\t'*}"
  state="${rest#*$'\t'}"
  echo "Prune Machine ${mid} region=${region} state=${state}"
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "  (DRY_RUN=1 — skip destroy)"
    continue
  fi
  "$FLY" machines destroy "$mid" -a "$APP" --force
done

echo "==> Remaining Machines"
"$FLY" machines list -a "$APP"
