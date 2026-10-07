# Fly.io deploy (Lugemi → lugemi.com)

Monorepo: Nest API (`apps/api`) + Next.js console (`apps/web`), pnpm workspaces.

**Product brand is Lugemi.** The GitHub git repository may still be named `verbalab` (e.g. `roosevelt-jpg/verbalab`); that remote path is not the product brand — do not rename the GitHub repo as part of this branding pass.

**Fly app name ≠ public domain.** Preferred Fly apps: **`lugemi`** / **`lugemi-api`** / **`lugemi-web`**. Production users hit **lugemi.com** / **api.lugemi.com**. Default `*.fly.dev` hostnames remain as Fly internals until custom certs + DNS are live — they are not the brand URLs.

If production still has `verbalab` / `verbalab-api` / `verbalab-web`, either rename or create new apps (do not assume rename already happened):

```bash
fly apps rename verbalab lugemi
fly apps rename verbalab-api lugemi-api
fly apps rename verbalab-web lugemi-web
# Or: fly apps create lugemi-api && fly apps create lugemi-web
```

Fly dashboard launch of a single app once named **verbalab** failed with “Could not find a Dockerfile” because images lived only under `apps/*/`. This repo ships a **root `Dockerfile` + `fly.toml`** so Fly can detect a runtime, plus preferred **two-app** configs for Africa-first (`jnb`).

## Public URLs (production)

| Surface | Public URL | Fly app (preferred internal name) |
| --- | --- | --- |
| Web console / marketing | `https://lugemi.com` | `lugemi-web` |
| `www` | `https://www.lugemi.com` → apex (`lugemi.com`) | same web app |
| Nest API | `https://api.lugemi.com` | `lugemi-api` or single-app `lugemi` |

Do **not** put the Nest API under `https://lugemi.com/api` — prefer the `api.` subdomain.

## Apps, ports, region

| App | Role | Internal port | Config |
| --- | --- | --- | --- |
| `lugemi` | API (dashboard default) | **3001** | root `fly.toml` + root `Dockerfile` |
| `lugemi-api` | Nest API (preferred) | **3001** | `infra/fly/api.jnb.toml` or `apps/api/fly.toml` |
| `lugemi-web` | Next console (preferred) | **3000** | `infra/fly/web.jnb.toml` or `apps/web/fly.toml` |

- **Primary region:** `jnb` (Johannesburg)
- Health checks: `GET /health` on both services (`[[http_service.checks]]`, grace **45s**)
- **API port pair:** `internal_port = 3001` **and** `[env] PORT = '3001'` (plus `API_PORT`). Nest binds `0.0.0.0:$PORT` in `apps/api/src/main.ts`. Keep these matched — a mismatch yields Fly `[PC01] instance refused connection`.
- Nest starts and serves `/health` **even when `DATABASE_URL` is unset** (Prisma connect + boot seeders soft-skip; health JSON includes `database: "skipped"`). Set secrets before relying on DB routes.
- Without `REDIS_URL`, jobs / rate-limit / event-fabric use in-process / memory (no hang on `127.0.0.1:6379`).
- US/EU residency islands remain in `infra/fly/api.toml`, `web.toml`, `*.eu.toml` (`lugemi-*` / `lugemi-*-eu` + `*.fly.dev` until those islands get custom hosts)

## Required secrets (first boot)

The Fly UI app may still be named **`verbalab`** until renamed. Prefer renaming to **`lugemi-api`**, then set secrets:

```bash
# If the dashboard still shows verbalab / verbalab-api:
fly apps rename verbalab lugemi-api
# or: fly apps rename verbalab-api lugemi-api

# Required for Prisma / migrations / DB routes:
fly secrets set -a lugemi-api \
  DATABASE_URL='postgresql://USER:PASS@HOST:5432/DB?sslmode=require'

# Recommended for BullMQ jobs + Redis-backed rate limits:
fly secrets set -a lugemi-api \
  REDIS_URL='redis://...'
```

Until `DATABASE_URL` is set, migrate logs show `[fly-migrate] DATABASE_URL unset — skipping prisma migrate deploy`. The proxy can still route once Nest listens on `0.0.0.0:3001` and `/health` returns 200.

## Custom domains (Fly certs + Cloudflare DNS)

Domain is on **Cloudflare Registrar** (`lugemi.com`). **Operator walkthrough (deploy → DNS → Clerk → admin):** [`docs/domain-setup.md`](./domain-setup.md). Full DNS / CF product table: [`docs/cloudflare.md`](./cloudflare.md).

**Apex currently wrong?** If browsers hit Nest `Cannot GET /` on `lugemi.com`, `@`/`www` are still on the API Shared IPs — cutover runbook + one-shot deploy: [`docs/dns-apex-cutover.md`](./dns-apex-cutover.md), `scripts/fly-deploy-lugemi-web.sh`.

### 1. Allocate addresses + add certificates

```bash
# Preferred two-app layout
fly ips list -a lugemi-web
fly ips list -a lugemi-api

# Web (apex + www)
fly certs add lugemi.com -a lugemi-web
fly certs add www.lugemi.com -a lugemi-web

# API subdomain
fly certs add api.lugemi.com -a lugemi-api

# If you kept the single dashboard API app instead of lugemi-api:
# fly certs add api.lugemi.com -a lugemi
```

Then print the ownership / ACME records Fly expects:

```bash
fly certs setup lugemi.com -a lugemi-web
fly certs setup www.lugemi.com -a lugemi-web
fly certs setup api.lugemi.com -a lugemi-api
```

Add every `_fly-ownership` TXT (and any other challenge records shown) in Cloudflare DNS **exactly** as printed. Monitor with:

```bash
fly certs check lugemi.com -a lugemi-web
fly certs check api.lugemi.com -a lugemi-api
```

If you still run legacy `verbalab*` app names, pass `-a verbalab-web` / `-a verbalab-api` until renamed.

### 2. Cloudflare DNS (create these records)

Get IPs from `fly ips list` (or use CNAME to `*.fly.dev` where Fly’s setup output allows).

| Type | Name | Target / content | Proxy |
| --- | --- | --- | --- |
| `A` | `@` (`lugemi.com`) | Fly **shared/dedicated IPv4** for `lugemi-web` | Orange (CDN) **or** DNS-only — see notes |
| `AAAA` | `@` | Fly **IPv6** for `lugemi-web` | Same as A |
| `CNAME` | `www` | `lugemi.com` (or Fly web `.fly.dev` target) | Same; redirect www→apex via Cloudflare Redirect Rule if desired |
| `A` / `AAAA` or `CNAME` | `api` | Fly IPs for `lugemi-api` **or** `lugemi-api.fly.dev` | Orange or DNS-only |
| `TXT` | `_fly-ownership` (and host-specific names from `fly certs setup`) | Value from Fly | **DNS-only** (grey cloud) |

**Proxy guidance (Fly + Cloudflare):**

- **DNS-only (grey cloud):** simplest; Fly issues/renews Let’s Encrypt certs directly. See [Fly: Understanding Cloudflare](https://fly.io/docs/networking/understanding-cloudflare/).
- **Proxied (orange cloud):** set Cloudflare SSL/TLS to **Full (strict)**; add `_fly-ownership` TXT from `fly certs setup`. Prefer HTTP-01-friendly settings; if issuance stalls, import a Cloudflare Origin Certificate into Fly.

Until these records exist and certs check green, browsers still only reach `*.fly.dev` — **do not assume lugemi.com is live** after a code deploy alone.

### 3. Secrets + build args (brand URLs)

#### API (`lugemi` or `lugemi-api`)

```bash
fly secrets set -a lugemi-api \
  DATABASE_URL='postgresql://USER:PASS@HOST:5432/DB?sslmode=require' \
  REDIS_URL='redis://...' \
  CORS_ORIGIN='https://lugemi.com,https://www.lugemi.com' \
  APP_URL='https://lugemi.com' \
  APP_PUBLIC_URL='https://lugemi.com' \
  CLERK_SECRET_KEY='...' \
  STRIPE_SECRET_KEY='...' \
  STRIPE_WEBHOOK_SECRET='...' \
  STRIPE_PRICE_ID_PRO='...' \
  BILLING_SUCCESS_URL='https://lugemi.com/billing?checkout=success' \
  BILLING_CANCEL_URL='https://lugemi.com/billing?checkout=cancel' \
  BILLING_PORTAL_RETURN_URL='https://lugemi.com/billing'
```

Use `-a lugemi` when deploying the single dashboard API app. Nest also always allows `https://lugemi.com`, `https://www.lugemi.com`, and `https://api.lugemi.com` in CORS (see `apps/api/src/main.ts`).

Optional: `MIGRATE_STRICT=1` makes migrate failures abort release/boot (default is soft-fail so a bad DB URL does not brick the Fly release step).

Also set any legacy adapter keys you use (`GOOGLE_TRANSLATE_API_KEY`, `OPENAI_API_KEY`, `OWN_TTS_URL`, …). Full list: `.env.example`.

#### Web (`lugemi-web`)

```bash
fly secrets set -a lugemi-web \
  CLERK_SECRET_KEY='...' \
  APP_URL='https://lugemi.com'
```

Browser-visible values are **build args** (not secrets):

| Build arg | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | **`https://api.lugemi.com`** (production) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `NEXT_PUBLIC_APP_URL` | Optional; `https://lugemi.com` |

Point the web app at the API hostname — do **not** use localhost or `*.fly.dev` in production builds once the custom domain is ready.

#### Clerk dashboard

In Clerk → Domains / Allowed origins, allow:

- `https://lugemi.com`
- `https://www.lugemi.com`
- Redirect / sign-in URLs under those hosts (and keep `*.fly.dev` only if you still use Fly preview hostnames)

## What `release_command` does

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

## What to do in the Fly UI (existing `verbalab` app)

1. Set **`DATABASE_URL`** (and other secrets above) on the app — including `CORS_ORIGIN` / `APP_URL` for lugemi.com.
2. Optionally **`fly apps rename verbalab lugemi`** (and rename `verbalab-api` / `verbalab-web`), **or** create new `lugemi*` apps — either path is fine; update secrets/DNS after.
3. Pull / reconnect the GitHub repo so Fly sees the latest root **`Dockerfile`** and **`fly.toml`**.
4. Use **Retry from latest commit (main)** after this lands on `main`.
5. After the first successful API deploy, ensure the console app exists:

```bash
fly apps create lugemi-api   # or rename/reuse verbalab / verbalab-api as the API
fly apps create lugemi-web   # or rename verbalab-web
```

6. Add custom certs + Cloudflare DNS (section above). Until then the UI still shows `*.fly.dev` — that is expected.

If you keep a single dashboard API app (`lugemi` or legacy `verbalab`), it runs the **API** on port **3001**. Deploy web separately as `lugemi-web`.

If the Fly account shows **Suspended**, unsuspend/billing must be fixed on Fly’s side before any retry succeeds — configs here only fix the release_command / migrate path.

## CLI deploy (preferred two apps)

From the **repository root** (pnpm lockfile + workspace packages must be in the build context):

```bash
fly auth login

fly apps create lugemi-api
fly apps create lugemi-web

# API — set DATABASE_URL + CORS/APP_URL first (see secrets above)
fly deploy -c infra/fly/api.jnb.toml --dockerfile apps/api/Dockerfile

# Web (bake public env at build time — brand API host)
fly deploy -c infra/fly/web.jnb.toml --dockerfile apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://api.lugemi.com \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```

Equivalent configs: `apps/api/fly.toml` / `apps/web/fly.toml` (pass `--dockerfile apps/.../Dockerfile` from repo root).

Single-app dashboard path:

```bash
fly deploy -c fly.toml
```

## Local Docker dry-run

```bash
docker build -t lugemi-api .
docker build -f apps/web/Dockerfile -t lugemi-web \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 .

# Migrate soft-skips without DATABASE_URL; Nest still starts on 0.0.0.0:3001
docker run --rm -e PORT=3001 -p 3001:3001 lugemi-api
```

## Why monorepo Dockerfiles copy the workspace

pnpm workspaces need the root `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and referenced `packages/*` manifests before `pnpm install --filter ...`. Both Dockerfiles install only the filtered package graph, then copy app sources and build.

## More

- End-to-end domain guide: [`docs/domain-setup.md`](./domain-setup.md)
- Cloudflare DNS detail: [`docs/cloudflare.md`](./cloudflare.md)
- Canonical longer runbook: [`infra/DEPLOY.md`](../infra/DEPLOY.md)
- CI: `.github/workflows/deploy.yml` (skips without `FLY_API_TOKEN`)
