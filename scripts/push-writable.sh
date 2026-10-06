#!/usr/bin/env bash
# Push VerbaLab main to the writable v0-ppbb history branch (never hits verbalab 403).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

"$ROOT/scripts/configure-writable-push.sh" "$@"
git push origin main
echo "Pushed $(git rev-parse --short HEAD) → v0-ppbb cursor/verbalab-main-5aae"
