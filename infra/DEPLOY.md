# Production deploy

Three supported paths:

1. **Fly.io (default PaaS)** — this document (VL-074 / ADR-0023)  
2. **AWS EKS `af-south-1`** — [`AWS_EKS.md`](./AWS_EKS.md) + Terraform under `infra/terraform/aws-eks/` (VL-138 / ADR-0059)
3. **Vercel (web console only)** — import `roosevelt-jpg/lugemi`, Root Directory `apps/web`. See the Vercel section in `README.md`. Keep the API on Fly or Compose.

PaaS choice for day-to-day API: **Fly.io**. EKS is optional when AWS/K8s is required. Vercel hosts the Next.js console.

Enterprise Language Registry (VL-139), Localization Platform (VL-141), and Language Analytics (VL-146) ship with the API database/migrations + boot seed / Intl helpers. Language Cloud production audit evidence: [`docs/language-cloud-audit/`](../docs/language-cloud-audit/) (VL-147). Speech Cloud production audit evidence: [`docs/speech-cloud-audit/`](../docs/speech-cloud-audit/) (VL-160). Voice Cloud production audit evidence: [`docs/voice-cloud-audit/`](../docs/voice-cloud-audit/) (VL-179). Cloud blueprint: [`docs/CLOUD_BLUEPRINT.md`](../docs/CLOUD_BLUEPRINT.md) (ADR-0080).

## Architecture (Fly)

| Piece | What |
| --- | --- |
| `verbalab` / `verbalab-api` | Nest API (`Dockerfile` at repo root + `apps/api/Dockerfile`) — Africa default `jnb` |
| `verbalab-web` | Next console (`apps/web/Dockerfile`, standalone) — `jnb` |
| `lugemi-api` / `lugemi-web` | Legacy US/EU island names in `infra/fly/*.toml` / `*.eu.toml` |
| Postgres | Managed DB with **pgvector** (Neon / Supabase / Fly Postgres + `CREATE EXTENSION vector`) via `DATABASE_URL` |
| Redis | Required for BullMQ + rate limits (`REDIS_URL`). Fly Redis or Upstash. Do **not** set `JOBS_INLINE=1` in production. |
| Region | Africa-first: `jnb` (`infra/fly/*.jnb.toml`, root `fly.toml`). US `iad` / EU `ams` remain for residency islands. |

Short verbalab / Fly UI guide: [`docs/fly.md`](../docs/fly.md).

## First-time setup (manual; needs Fly account)

```bash
# Install flyctl, then:
fly auth login
fly apps create lugemi-api
fly apps create lugemi-web

# Attach or set secrets (examples — use your real values)
fly secrets set -a lugemi-api \
  DATABASE_URL='postgresql://...' \
  REDIS_URL='redis://...' \
  CORS_ORIGIN='https://lugemi-web.fly.dev' \
  CLERK_SECRET_KEY='...' \
  GOOGLE_TRANSLATE_API_KEY='...' \
  OPENAI_API_KEY='...' \
  STRIPE_SECRET_KEY='...' \
  STRIPE_WEBHOOK_SECRET='...' \
  STRIPE_PRICE_ID_PRO='...' \
  BILLING_SUCCESS_URL='https://lugemi-web.fly.dev/billing?checkout=success' \
  BILLING_CANCEL_URL='https://lugemi-web.fly.dev/billing?checkout=cancel' \
  BILLING_PORTAL_RETURN_URL='https://lugemi-web.fly.dev/billing'

# Web build args are set at deploy time; also set runtime Clerk secret if used server-side:
fly secrets set -a lugemi-web CLERK_SECRET_KEY='...'
```

Deploy (from repo root):

```bash
fly deploy -c infra/fly/api.toml --dockerfile apps/api/Dockerfile
fly deploy -c infra/fly/web.toml --dockerfile apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://lugemi-api.fly.dev \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```

API **release_command** runs `pnpm db:migrate` (`prisma migrate deploy`) before each new release replaces machines.

## Migrations

- Local authoring: `pnpm db:migrate:dev`
- CI + production: `pnpm db:migrate` (`prisma migrate deploy`)
- CI already migrates against ephemeral Postgres on every PR (`ci.yml`)
- Production migrate: Fly API `release_command` (and optional GitHub deploy job)

## GitHub Actions deploy

`.github/workflows/deploy.yml` runs on push to `main`/`master` when `FLY_API_TOKEN` is set as a repository secret. Without the token the job **skips** (no failure) so forks and local CI stay green.

Optional secrets: `FLY_API_TOKEN`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.

Optional EU island (VL-075): set repository **variable** `FLY_DEPLOY_EU=true` and secret `NEXT_PUBLIC_API_URL_EU` to also deploy `infra/fly/*.eu.toml`.

## Local Docker dry-run (no Fly secrets)

```bash
docker build -f apps/api/Dockerfile -t lugemi-api .
docker build -f apps/web/Dockerfile -t lugemi-web \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 .
```

### Smoke health checks

Both apps expose `GET /health` (Fly `http_service.checks` + Docker `HEALTHCHECK`).

With API + web already running (`pnpm dev` or containers):

```bash
pnpm smoke
```

Web-only Docker smoke (builds + runs web, skips needing a live API if you set the flag):

```bash
SMOKE_DOCKER_WEB=1 SMOKE_SKIP_API=1 pnpm smoke
```

Full container smoke for API needs Compose Postgres/Redis reachable from the container (`host.docker.internal` on Docker Desktop) plus `DATABASE_URL` / `REDIS_URL` / `JOBS_INLINE=1`.

## Preview deploys

Deferred. Ship one production pair first; add Fly preview apps later if needed.

- Global mesh / multi-master Postgres / automatic geo-failover
- Separate worker process (jobs run inside the API today)
- Object storage for multi-instance document disks (single machine / volume is enough for MVP)

## Multi-region residency (VL-075)

Each region is a **separate deploy + database** (residency island), not a mesh.

| Island | Fly configs | `LUGEMI_REGION` | Fly `primary_region` |
| --- | --- | --- | --- |
| AF (verbalab default) | root `fly.toml`, `infra/fly/*.jnb.toml`, `apps/*/fly.toml` | `af` | `jnb` |
| US | `infra/fly/api.toml`, `web.toml` | `us` | `iad` |
| EU | `infra/fly/api.eu.toml`, `web.eu.toml` | `eu` | `ams` |

```bash
fly apps create lugemi-api-eu
fly apps create lugemi-web-eu
# Attach a *separate* EU Postgres + Redis, then:
fly secrets set -a lugemi-api-eu DATABASE_URL='...' REDIS_URL='...' LUGEMI_REGION=eu ...
fly deploy -c infra/fly/api.eu.toml --dockerfile apps/api/Dockerfile
fly deploy -c infra/fly/web.eu.toml --dockerfile apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://lugemi-api-eu.fly.dev \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
```

Orgs may pin `dataRegion` via `PATCH /v1/organization/residency`. A pin to `eu` rejects API calls on the US island (`residency_mismatch`). **Pinning does not migrate data.**
