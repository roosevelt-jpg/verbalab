#!/usr/bin/env bash
# Route `git push` to roosevelt-jpg/v0-ppbb (writable from Cursor cloud),
# because cursor[bot] cannot push to roosevelt-jpg/verbalab (403).
#
# Usage (from verbalab repo root):
#   ./scripts/configure-writable-push.sh [v0-ppbb-git-url]
#   git push            # → v0-ppbb branch cursor/verbalab-main-5aae
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DEFAULT_PUSH_URL="https://github.com/roosevelt-jpg/v0-ppbb.git"
PUSH_URL="${1:-}"
if [[ -z "$PUSH_URL" ]]; then
  if [[ -d /workspace/.git ]]; then
    PUSH_URL="$(git -C /workspace remote get-url origin 2>/dev/null || true)"
  fi
  PUSH_URL="${PUSH_URL:-$DEFAULT_PUSH_URL}"
fi

BRANCH_REF="refs/heads/main:refs/heads/cursor/verbalab-main-5aae"

git remote set-url origin https://github.com/roosevelt-jpg/verbalab.git
git remote set-url --push origin "$PUSH_URL"
git config remote.origin.push "$BRANCH_REF"

if git remote get-url v0ppbb >/dev/null 2>&1; then
  git remote set-url v0ppbb "$PUSH_URL"
else
  git remote add v0ppbb "$PUSH_URL"
fi
git config remote.v0ppbb.push "$BRANCH_REF"

echo "Configured:"
echo "  fetch: https://github.com/roosevelt-jpg/verbalab.git"
echo "  push:  $PUSH_URL ($BRANCH_REF)"
echo
echo "Verify with: git push origin main"
