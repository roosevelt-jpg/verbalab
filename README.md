# Lugemi

First-party **language intelligence infrastructure**. Site: [lugemi.com](https://lugemi.com).

Lugemi is in the a first-party speech and language API platform: **our API** and **our models** — generate speech, transcribe, and translate. We do not position the product as a wrapper around Google Translate, OpenAI, or other vendor APIs.

**Africa first:** Lugemi is a fully built Africa-first language intelligence platform covering languages and dialects across **all African countries and ethnic communities**. We also support **Latin America, Southeast Asia, the Middle East, the EU**, and other global markets. The Africa language catalog documents product scope; live API seed and eval pairs publish gateway availability. Do not treat Africa as one culture or use flags as language selectors.

Visible brand, packages, env vars, `X-Lugemi-*` headers, and health JSON (`lugemi-web` / `lugemi-api`) are **Lugemi**. Legacy API key prefixes `vl_live_` / `vl_test_` are still accepted for one release; new keys use `lg_live_` / `lg_test_`. See `docs/brand/LUGEMI_BRAND_GUIDELINES.md` and `docs/brand/PUBLIC_POSITIONING.md`.

Vendor adapters in `apps/api/src/gateway/` are **historical scaffolding** for local/legacy fallbacks — not the public product. Intended production speech uses `OWN_TTS_URL` (`own:*` voices). Do not treat fixtures as live GPU.

**Residency:** Person residency = registration origin; model residency = data-center host. See [`docs/residency.md`](docs/residency.md) and `GET /v1/residency`.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+
- Docker (Postgres **and Redis** via Compose)

## Quick start

```bash
docker compose -f infra/docker-compose.yml up -d
cp .env.example .env
# apps/api/.env should use localhost:5433 (Compose maps 5433→5432) and REDIS_URL=redis://127.0.0.1:6379
pnpm install
pnpm db:migrate
pnpm test
pnpm typecheck
pnpm dev
```

- Web console: **http://127.0.0.1:43125** (Studio default) or http://localhost:3000
- API health: http://127.0.0.1:3001/health
- Without Clerk keys: http://127.0.0.1:43125/setup
- **Until Fly DNS is connected:** open **http://127.0.0.1:43125** (or Cursor’s port preview) — **not** https://lugemi.com. See [`docs/domain-setup.md`](docs/domain-setup.md).
- **Auth → post-auth → onboarding:** `/sign-up` and `/sign-in` are Lugemi-branded shells around Clerk; after success they hit `/post-auth` (platform admins → `/admin` with no wizard flash; others → `/onboarding` for Creative vs Agents, personalization, persona, plan). Completed users are forwarded to Creative or Agents. Details: `docs/clerk-auth-branding.md`.
- **Skip setup after login (local):** open **`/dev-login`** (Skip setup checked by default) or visit `/onboarding?skipOnboarding=1` → Creative Studio; optional `NEXT_PUBLIC_SKIP_ONBOARDING=1` in web env
- **Live Clerk keys on local:** production keys reject bare `localhost` / `127.0.0.1` Origin (`origin_invalid` from `clerk.lugemi.com`). On **http://127.0.0.1:43125/dev-login**, use **Sign in without OTP (hosted ticket)** (no proxy required). Optional HTTPS proxy path (agent VM only): map `127.0.0.1 local.lugemi.com`, terminate HTTPS on **:443** → Next **:43125**, set `ALLOW_CLERK_DEV_LOGIN=true`, open **`https://local.lugemi.com/dev-login`**. Your laptop will not resolve `local.lugemi.com` unless you add hosts and run the proxy yourself. Prefer `pnpm --filter @lugemi/web dev:local` so empty shell `CLERK_*` overrides do not wipe `.env.local` and bounce you to `/setup`.
- Marketing CMS: signed-in **Admin → CMS content** edits homepage, footer, `/p/*` pages, images, and videos (`GET/PUT /api/cms`, uploads to `/cms-media/`)

## Workspace scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | API + web |
| `pnpm test` | Vitest across packages |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm db:migrate` | Apply Prisma migrations (CI/prod) |
| `pnpm db:migrate:dev` | Create/apply migrations locally |
| `pnpm smoke` | Hit API + web `/health` (services must be up) |
| `pnpm test:e2e` | Playwright public pages + optional signed-in translate |

## Platform admin console

Super-admin console for **all customer workspaces** (not just your own org).

| Surface | Path |
| --- | --- |
| Workspace admin UI | `/admin/workspaces` (local web often on :43125 or :3000) |
| CMS + quick org search | `/admin` |
| API | `/v1/admin/workspaces…` on port **3001** |

**Access (local / dev)**

1. Add your Clerk user email to the API allowlist in `apps/api/.env` (or root `.env`):

```bash
ADMIN_EMAILS=you@company.com
# aliases also accepted:
# LUGEMI_PLATFORM_ADMIN_EMAILS=you@company.com
# ADMIN_USER_IDS=user_clerk_xxx
```

2. Sign in via Clerk, or open **`/dev-login`** for the local ticket/password helper.
3. Open `/admin/workspaces`. Empty allowlist means no platform admins (safe default).

**Capabilities:** cross-workspace search/filters/pagination, detail (members, invites, masked API keys, connectors, model defaults, branding snapshot, quotas, activity), suspend/resume, bulk suspend/resume/CSV export, usage analytics, feature entitlement overrides, platform audit log, create workspace + invite, and “Open as workspace” (switches admin session org context via `X-Lugemi-Organization-Id`).

## Stripe billing

Plans: **Free → Pro → Business → Enterprise**.
Each organization workspace inherits the subscribed features (speech, commercial use, voice clones, marketplace, SSO, …).
Workspace seats: Free–Pro = 1, Business = 3, Enterprise = unlimited. Extra creates return `plan_required`.

Add to `apps/api/.env`:

| Variable | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | API secret |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing (`stripe listen --forward-to localhost:3001/v1/billing/webhook`) |
| `STRIPE_PRICE_ID_PRO` / `STRIPE_PRICE_ID_BUSINESS` | Recurring Price IDs (Free + Enterprise have no Checkout price) |
| `BILLING_SUCCESS_URL` / `BILLING_CANCEL_URL` | Checkout redirects |
| `BILLING_PORTAL_RETURN_URL` | Customer portal return |

Create products/prices in Stripe Dashboard, then map the `STRIPE_PRICE_ID_*` env vars.

## TypeScript SDK

```ts
import { Lugemi } from '@lugemi/sdk';

const client = new Lugemi({
  apiKey: process.env.LUGEMI_API_KEY!,
  baseUrl: process.env.LUGEMI_BASE_URL ?? 'http://localhost:3001',
});

await client.translate({ text: 'Hello', source: 'en', target: 'sw' });
await client.regions();
await client.localize({ source: 'en', target: 'sw', content: { hello: 'Hello' } });
```

Package lives at `packages/sdk`.

## Lugemi MCP

Agent IDE connector for first-party **Baobab** (translate), **Echo** (TTS/STT), and **Atlas** (models) — plus Mix, accents, and voice clones.

- Marketing: `/mcp` · Docs: [`docs/mcp.md`](docs/mcp.md) · `/docs/mcp`
- Hosted: `POST https://api.lugemi.com/v1/mcp` with `Authorization: Bearer lg_live_…`
- Stdio: `packages/mcp` (`pnpm --filter @lugemi/mcp build`)

```json
{
  "mcpServers": {
    "lugemi": {
      "url": "https://api.lugemi.com/v1/mcp",
      "headers": { "Authorization": "Bearer lg_live_..." }
    }
  }
}
```

## Credentials

Add to `apps/api/.env` and `apps/web/.env.local` (see `.env.example`). Lead with Lugemi / first-party. Vendor keys are optional legacy adapters, not the product path.

| Variable | Where | Needed for |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | web | Console sign-in |
| `CLERK_SECRET_KEY` | web + api | Sessions |
| `NEXT_PUBLIC_SKIP_ONBOARDING` | web | Set `1` locally to land in Creative after sign-in (skips setup wizard) |
| `REDIS_URL` | api | Jobs + rate limits (Compose Redis) |
| `OWN_TTS_URL` | api | **Intended production speech** (`own:*` voices). Optional `OWN_TTS_API_KEY`. Unset = that path not configured |
| `LUGEMI_REGION` | api | Residency island (`us` / `eu`) |
| `STRIPE_*` | api | Billing (optional) |
| `GOOGLE_TRANSLATE_API_KEY` | api | **Legacy / internal** translate + detect adapter |
| `OPENAI_API_KEY` | api | **Legacy / internal** STT, stock TTS, chat, embeddings adapter |
| `VENDOR_VOICE_CLONE_API_KEY` | api | **Legacy / internal** voice-clone adapter |

Without Clerk, open http://localhost:3000/setup. API tests still pass (fixtures). Live MT via the legacy adapter: `TRANSLATE_LIVE=1 pnpm --filter @lugemi/api test`. `OWN_TTS_FIXTURE=1` is CI/local only — never claim live GPU without `OWN_TTS_URL`.

Playwright signed-in translate (optional): set `E2E_CLERK_USER_EMAIL` + `E2E_CLERK_USER_PASSWORD` with a Clerk test user, then `pnpm test:e2e`. Without those env vars the signed-in case is skipped; public `/setup`, `/docs`, `/coverage`, `/health` still run.

## Production hostnames (lugemi.com)

| Surface | URL |
| --- | --- |
| Web | `https://lugemi.com` (`www` → apex) |
| API | `https://api.lugemi.com` |

Preferred Fly **app names** are `lugemi` / `lugemi-api` / `lugemi-web` (legacy `verbalab*` may need `fly apps rename` or new apps). That is an internal Fly identifier, **not** the public domain. Default `*.fly.dev` URLs appear until Cloudflare DNS + `fly certs add` are completed. See `docs/domain-setup.md`, `docs/fly.md`, and `docs/cloudflare.md`.

If `https://lugemi.com/` returns Nest `Cannot GET /`, apex DNS still points at the API app — deploy web and move `@`/`www` to `lugemi-web` IPs: [`docs/dns-apex-cutover.md`](docs/dns-apex-cutover.md), `scripts/fly-deploy-lugemi-web.sh`.

## Vercel (web console)

Production hostname: **lugemi.com**. The Next.js console (`apps/web`) can be configured for Vercel **or** Fly (`lugemi-web`). Prefer **one** origin for the apex. The Nest API stays on Fly / Docker — do not set this repo’s Root Directory to `apps/api`.

1. Open [Import Git Repository](https://vercel.com/new/import) and select the Lugemi monorepo (GitHub may still show as `roosevelt-jpg/verbalab` — product brand is **Lugemi**; the Vercel GitHub App is already installed on the account).
2. Confirm **Root Directory** is `apps/web` (also set in root `vercel.json`).
3. Framework: **Next.js**. Install is `pnpm install --filter @lugemi/web...` from the repo root.
4. Add environment variables, then Deploy:

| Variable | Required |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Production API origin: **`https://api.lugemi.com`** |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Console sign-in (omit to keep `/setup`) |
| `CLERK_SECRET_KEY` | Server-side Clerk (omit with the publishable key) |

Without Clerk keys the production site serves `/setup`, same as local.

## Docs

- `docs/mcp.md` — Lugemi MCP (Cursor / Claude Desktop / Claude Code)
- `docs/cloudflare.md` — free Cloudflare products useful with this monorepo (DNS/SSL/CDN, R2, Turnstile, …)
- `docs/brand/LUGEMI_BRAND_GUIDELINES.md` — identity, voice, and visual standards
- `docs/brand/PUBLIC_POSITIONING.md` — public category (first-party API + models; Africa first; global regions)
- `docs/ENGINEERING.md` — thin daily standards
- `docs/ENGINEERING_OS.md` — Engineering Operating System (full standards)
- `docs/ENTERPRISE_PRODUCT_BLUEPRINT.md` — Enterprise blueprint (C4, DDD, contracts, deploy)
- `docs/CLOUD_PLATFORM_FOUNDATION.md` — Cloud Foundation
- `docs/IDENTITY_CLOUD.md` — Identity Cloud
- `docs/DEVELOPER_CLOUD.md` — Developer Cloud
- `docs/ENTERPRISE_CLOUD.md` — Enterprise Cloud
- `docs/AI_GATEWAY_CLOUD.md` — AI Gateway Cloud
- `docs/LANGUAGE_CLOUD.md` — Language Cloud
- `docs/templates/` — RFC / PRD / Runbook templates
- `ARCHITECTURE.md` — stack and boundaries
- `docs/fly.md` — Fly.io (`lugemi*` apps → **lugemi.com** / **api.lugemi.com**), certs, secrets
- `infra/DEPLOY.md` — Fly.io production (AF `jnb` + US/EU residency islands)
- `PHASE_0_1.md` — Early platform scope
- `PROGRESS.md` / `ROADMAP.md` — delivery status
