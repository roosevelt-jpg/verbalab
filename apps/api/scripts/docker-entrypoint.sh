#!/bin/sh
# Apply migrations (soft-skip without DATABASE_URL), then start the Nest API.
set -eu
/bin/sh /app/apps/api/scripts/fly-migrate.sh
exec "$@"
