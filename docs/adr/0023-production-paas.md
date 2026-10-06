# ADR-0023: Production PaaS (one region)

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-074

## Context

Localhost is not a cloud. We need one production region with managed Postgres, migrations in the release path, and Redis for jobs/rate limits — without inventing a control plane or running EKS.

## Decision

1. **PaaS:** Fly.io — two apps (`lugemi-api`, `lugemi-web`), Dockerfiles at `apps/*/Dockerfile`, config in `infra/fly/*.toml`.
2. **Data:** Managed Postgres with **pgvector** via `DATABASE_URL` (Neon/Supabase/Fly+extension). Redis via `REDIS_URL` (required; no `JOBS_INLINE` in prod).
3. **Migrate:** `prisma migrate deploy` as API Fly `release_command`; CI already migrates on every PR (`ci.yml`).
4. **CI deploy:** `.github/workflows/deploy.yml` deploys when `FLY_API_TOKEN` is present; otherwise skips (no fake prod).
5. **Preview deploys:** deferred. Runbook: `infra/DEPLOY.md`.

## Consequences

- Web `NEXT_PUBLIC_*` values are build-time; redeploy web when API URL or Clerk publishable key changes.
- Document storage remains local disk on the API machine until object storage is needed.
- Multi-region residency islands are VL-075 / ADR-0043 (separate Fly apps + DBs; not a mesh).
