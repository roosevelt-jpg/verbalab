# Lugemi

First-party **language intelligence infrastructure**. Site: [lugemi.com](https://lugemi.com).

Lugemi is in the a first-party speech and language API platform: **our API** and **our models** — generate speech, transcribe, and translate. We do not position the product as a wrapper around Google Translate, OpenAI, or other vendor APIs.

**Africa first:** Lugemi is a fully built Africa-first language intelligence platform covering languages and dialects across **all African countries and ethnic communities**. We also support **Latin America, Southeast Asia, the Middle East, the EU**, and other global markets. The Africa language catalog documents product scope; live API seed and eval pairs publish gateway availability. Do not treat Africa as one culture or use flags as language selectors.

Visible brand, packages, env vars, `X-Lugemi-*` headers, and health JSON (`lugemi-web` / `lugemi-api`) are **Lugemi**. Legacy API key prefixes `vl_live_` / `vl_test_` are still accepted for one release; new keys use `lg_live_` / `lg_test_`. See `docs/brand/LUGEMI_BRAND_GUIDELINES.md` and `docs/brand/PUBLIC_POSITIONING.md`.

Vendor adapters in `apps/api/src/gateway/` are **historical scaffolding** for local/legacy fallbacks — not the public product. Intended production speech uses `OWN_TTS_URL` (`own:*` voices). Do not treat fixtures as live GPU.

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

- Web console: http://localhost:3000
- API health: http://localhost:3001/health
- Without Clerk keys: http://localhost:3000/setup
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

## Credentials

Add to `apps/api/.env` and `apps/web/.env.local` (see `.env.example`). Lead with Lugemi / first-party. Vendor keys are optional legacy adapters, not the product path.

| Variable | Where | Needed for |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | web | Console sign-in |
| `CLERK_SECRET_KEY` | web + api | Sessions |
| `REDIS_URL` | api | Jobs + rate limits (Compose Redis) |
| `OWN_TTS_URL` | api | **Intended production speech** (`own:*` voices). Optional `OWN_TTS_API_KEY`. Unset = that path not configured |
| `LUGEMI_REGION` | api | Residency island (`us` / `eu`) |
| `STRIPE_*` | api | Billing (optional) |
| `GOOGLE_TRANSLATE_API_KEY` | api | **Legacy / internal** translate + detect adapter |
| `OPENAI_API_KEY` | api | **Legacy / internal** STT, stock TTS, chat, embeddings adapter |
| `VENDOR_VOICE_CLONE_API_KEY` | api | **Legacy / internal** voice-clone adapter |

Without Clerk, open http://localhost:3000/setup. API tests still pass (fixtures). Live MT via the legacy adapter: `TRANSLATE_LIVE=1 pnpm --filter @lugemi/api test`. `OWN_TTS_FIXTURE=1` is CI/local only — never claim live GPU without `OWN_TTS_URL`.

Playwright signed-in translate (optional): set `E2E_CLERK_USER_EMAIL` + `E2E_CLERK_USER_PASSWORD` with a Clerk test user, then `pnpm test:e2e`. Without those env vars the signed-in case is skipped; public `/setup`, `/docs`, `/coverage`, `/health` still run.

## Vercel (web console)

Production hostname: **lugemi.com**. The Next.js console (`apps/web`) is configured for Vercel. The Nest API stays on Fly / Docker — do not set this repo’s Root Directory to `apps/api`.

1. Open [Import Git Repository](https://vercel.com/new/import) and select `roosevelt-jpg/lugemi` (the Vercel GitHub App is already installed on the account).
2. Confirm **Root Directory** is `apps/web` (also set in root `vercel.json`).
3. Framework: **Next.js**. Install is `pnpm install --filter @lugemi/web...` from the repo root.
4. Add environment variables, then Deploy:

| Variable | Required |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Production API origin (e.g. `https://lugemi-api.fly.dev`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Console sign-in (omit to keep `/setup`) |
| `CLERK_SECRET_KEY` | Server-side Clerk (omit with the publishable key) |

Without Clerk keys the production site serves `/setup`, same as local.

## Docs

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
- `infra/DEPLOY.md` — Fly.io production (US + EU residency islands)
- `PHASE_0_1.md` — Early platform scope
- `PROGRESS.md` / `ROADMAP.md` — delivery status
