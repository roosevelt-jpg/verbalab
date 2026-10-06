# Fly.io deploy (verbalab / Lugemi)

Monorepo: Nest API (`apps/api`) + Next.js console (`apps/web`), pnpm workspaces.

Fly dashboard launch of a single app named **verbalab** failed with “Could not find a Dockerfile” because images lived only under `apps/*/`. This repo now ships a **root `Dockerfile` + `fly.toml`** so Fly can detect a runtime, plus preferred **two-app** configs for Africa-first (`jnb`).

## Apps, ports, region

| App | Role | Internal port | Config |
| --- | --- | --- | --- |
| `verbalab` | API (dashboard default) | **3001** | root `fly.toml` + root `Dockerfile` |
| `verbalab-api` | Nest API (preferred) | **3001** | `infra/fly/api.jnb.toml` or `apps/api/fly.toml` |
| `verbalab-web` | Next console (preferred) | **3000** | `infra/fly/web.jnb.toml` or `apps/web/fly.toml` |

- **Primary region:** `jnb` (Johannesburg)
- Health checks: `GET /health` on both services
- Nest listens on `0.0.0.0:$PORT` (`PORT` / `API_PORT`, default **3001** in Fly `[env]`)
- Legacy US/EU islands remain in `infra/fly/api.toml`, `web.toml`, `*.eu.toml` (`lugemi-*` app names)

## Required secrets before a healthy API

Set these **before** expecting migrations or DB-backed routes to work. A deploy can still succeed without `DATABASE_URL` (migrate soft-skips); the process will boot, but Prisma-backed handlers will fail until Postgres is configured.

### API (`verbalab` or `verbalab-api`) — set first

```bash
# Minimum for migrate + schema:
fly secrets set -a verbalab \
  DATABASE_URL='postgresql://USER:PASS@HOST:5432/DB?sslmode=require'

# Recommended production set:
fly secrets set -a verbalab \
  DATABASE_URL='postgresql://...' \
  REDIS_URL='redis://...' \
  CORS_ORIGIN='https://verbalab-web.fly.dev' \
  CLERK_SECRET_KEY='...' \
  STRIPE_SECRET_KEY='...' \
  STRIPE_WEBHOOK_SECRET='...' \
  STRIPE_PRICE_ID_PRO='...' \
  BILLING_SUCCESS_URL='https://verbalab-web.fly.dev/billing?checkout=success' \
  BILLING_CANCEL_URL='https://verbalab-web.fly.dev/billing?checkout=cancel' \
  BILLING_PORTAL_RETURN_URL='https://verbalab-web.fly.dev/billing'
```

Use `-a verbalab-api` when deploying the preferred two-app layout.

Optional: `MIGRATE_STRICT=1` makes migrate failures abort release/boot (default is soft-fail so a bad DB URL does not brick the Fly release step).

Also set any legacy adapter keys you use (`GOOGLE_TRANSLATE_API_KEY`, `OPENAI_API_KEY`, `OWN_TTS_URL`, …). Full list: `.env.example`.

### What `release_command` does

Fly runs **before** swapping machines:

```text
/bin/sh /app/apps/api/scripts/fly-migrate.sh
```

Behavior (`apps/api/scripts/fly-migrate.sh`):

1. If **`DATABASE_URL` is unset** → logs a clear skip message and **exits 0** (first boot without Postgres still deploys).
2. If set → runs the image’s `prisma` CLI: `prisma migrate deploy --schema=/app/apps/api/prisma/schema.prisma`.
3. On migrate failure → **soft-fails (exit 0)** unless `MIGRATE_STRICT=1`.

The same script runs again from the Docker **entrypoint** before `node apps/api/dist/main.js`, so machines that skip release still attempt migrate on boot.

`prisma` is a **production** dependency of `@lugemi/api` so `NODE_ENV=production` can still resolve the CLI (the old `pnpm --filter … exec prisma` release command failed when the CLI was only a devDependency).

### Web (`verbalab-web`)

```bash
fly secrets set -a verbalab-web CLERK_SECRET_KEY='...'
```

Browser-visible values are **build args** (not secrets):

| Build arg | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | API origin, e.g. `https://verbalab-api.fly.dev` (or `https://verbalab.fly.dev` if using the single API app) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |

Point the web app at the API hostname — do **not** use localhost in production.

## What to do in the Fly UI (existing `verbalab` app)

1. Set **`DATABASE_URL`** (and other secrets above) on the app.
2. Pull / reconnect the GitHub repo so Fly sees the latest root **`Dockerfile`** and **`fly.toml`**.
3. Use **Retry from latest commit (main)** after this fix lands on `main`.
4. After the first successful API deploy, create the second app for the console (recommended):

```bash
fly apps create verbalab-api   # or rename/reuse verbalab as the API
fly apps create verbalab-web
```

If you keep the single dashboard app `verbalab`, it runs the **API** on port **3001**. Deploy web separately as `verbalab-web`.

If the Fly account shows **Suspended**, unsuspend/billing must be fixed on Fly’s side before any retry succeeds — configs here only fix the release_command / migrate path.

## CLI deploy (preferred two apps)

From the **repository root** (pnpm lockfile + workspace packages must be in the build context):

```bash
fly auth login

fly apps create verbalab-api
fly apps create verbalab-web

# API — set DATABASE_URL first (see secrets above)
fly deploy -c infra/fly/api.jnb.toml --dockerfile apps/api/Dockerfile

# Web (bake public env at build time)
fly deploy -c infra/fly/web.jnb.toml --dockerfile apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://verbalab-api.fly.dev \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```

Equivalent configs: `apps/api/fly.toml` / `apps/web/fly.toml` (pass `--dockerfile apps/.../Dockerfile` from repo root).

Single-app dashboard path:

```bash
fly deploy -c fly.toml
```

## Local Docker dry-run

```bash
docker build -t verbalab-api .
docker build -f apps/web/Dockerfile -t verbalab-web \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 .

# Migrate soft-skips without DATABASE_URL; Nest still starts on 0.0.0.0:3001
docker run --rm -e PORT=3001 -p 3001:3001 verbalab-api
```

## Why monorepo Dockerfiles copy the workspace

pnpm workspaces need the root `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and referenced `packages/*` manifests before `pnpm install --filter ...`. Both Dockerfiles install only the filtered package graph, then copy app sources and build.

## More

- Canonical longer runbook: [`infra/DEPLOY.md`](../infra/DEPLOY.md)
- CI: `.github/workflows/deploy.yml` (skips without `FLY_API_TOKEN`)
