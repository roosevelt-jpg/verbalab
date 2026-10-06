# VerbaLab AI

Enterprise language-intelligence platform. See `ROADMAP.md` and `PROGRESS.md` for phase gating.

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

## Stripe billing (VL-031)

Add to `apps/api/.env`:

| Variable | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | API secret |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing (`stripe listen --forward-to localhost:3001/v1/billing/webhook`) |
| `STRIPE_PRICE_ID_PRO` | Recurring Price ID for Pro |
| `BILLING_SUCCESS_URL` / `BILLING_CANCEL_URL` | Checkout redirects |
| `BILLING_PORTAL_RETURN_URL` | Customer portal return |

Create a Pro product/price in Stripe Dashboard, then map `STRIPE_PRICE_ID_PRO`.

## TypeScript SDK

```ts
import { VerbaLab } from '@verbalab/sdk';

const client = new VerbaLab({
  apiKey: process.env.VERBALAB_API_KEY!,
  baseUrl: process.env.VERBALAB_BASE_URL ?? 'http://localhost:3001',
});

await client.translate({ text: 'Hello', source: 'en', target: 'sw' });
await client.regions();
await client.localize({ source: 'en', target: 'sw', content: { hello: 'Hello' } });
```

Package lives at `packages/sdk`.

## Credentials

Add to `apps/api/.env` and `apps/web/.env.local` (see `.env.example`):

| Variable | Where | Needed for |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | web | Console sign-in |
| `CLERK_SECRET_KEY` | web + api | Sessions |
| `GOOGLE_TRANSLATE_API_KEY` | api | Live MT / detect |
| `REDIS_URL` | api | Jobs + rate limits (Compose Redis) |
| `OPENAI_API_KEY` | api | Audio, chat, embeddings, RAG |
| `ELEVENLABS_API_KEY` | api | Voice cloning |
| `STRIPE_*` | api | Billing |
| `VERBALAB_REGION` | api | Residency island (`us` / `eu`) |

Without Clerk/Google, open http://localhost:3000/setup. API tests still pass (fixtures). Live MT: `TRANSLATE_LIVE=1 pnpm --filter @verbalab/api test`.

Playwright signed-in translate (optional): set `E2E_CLERK_USER_EMAIL` + `E2E_CLERK_USER_PASSWORD` with a Clerk test user, then `pnpm test:e2e`. Without those env vars the signed-in case is skipped; public `/setup`, `/docs`, `/coverage`, `/health` still run.

## Docs

- `docs/ENGINEERING.md` — thin daily standards
- `docs/ENGINEERING_OS.md` — Phase 0 Engineering Operating System (full standards)
- `docs/ENTERPRISE_PRODUCT_BLUEPRINT.md` — Phase −1 enterprise blueprint (C4, DDD, contracts, deploy)
- `docs/CLOUD_PLATFORM_FOUNDATION.md` — Library Phase 1 Cloud Foundation mapped (VL-125 / ADR-0046)
- `docs/IDENTITY_CLOUD.md` — Library Phase 2 Identity Cloud mapped (VL-126 / ADR-0047)
- `docs/DEVELOPER_CLOUD.md` — Library Phase 3 Developer Cloud mapped (VL-127 / ADR-0048)
- `docs/ENTERPRISE_CLOUD.md` — Library Phase 4 Enterprise Cloud mapped (VL-128 / ADR-0049)
- `docs/AI_GATEWAY_CLOUD.md` — Library Phase 5 AI Gateway Cloud mapped (VL-129 / ADR-0050); Volume 1 Part A complete
- `docs/LANGUAGE_CLOUD.md` — Library Phase 6 Language Cloud mapped (VL-130 / ADR-0051)
- `docs/templates/` — RFC / PRD / Runbook templates
- `ARCHITECTURE.md` — stack and boundaries
- `infra/DEPLOY.md` — Fly.io production (US + EU residency islands)
- `PHASE_0_1.md` — Phase 0 / Phase 1 scope
- `PROGRESS.md` / `ROADMAP.md` — phase status
