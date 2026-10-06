# Phase 0 + Phase 1 — Smallest real product

This is the **only** engineering work to approve after kickoff. It maps to executable IDs in `ROADMAP.md`:

| Named phase | IDs | Outcome |
| --- | --- | --- |
| **Phase 0** | VL-001, VL-002 | Standards + running monorepo |
| **Phase 1** | VL-010 … VL-024 | Auth, workspace, API key, **real** text translation, usage, console |

Do not start Speech, Voice, OCR, billing, GraphQL, Kubernetes, or marketplace in these phases.

Work **in order**: finish Phase 0 (including tests) before Phase 1. Inside Phase 1, follow the VL-ID order.

---

## Why this slice

The libraries want a language-intelligence **cloud**. The smallest thing that is still that company (and not a ChatGPT clone) is:

**a tenant who can call a translation API backed by a real provider, and see it in a dashboard.**

Identity exists because APIs need keys and orgs. The gateway exists so later STT/TTS/LLMs do not invent a second integration style. Metering exists so Stripe (Phase VL-031, **not** this slice) has something to bill.

African-language positioning starts as a **seeded registry + honest coverage**, not a foundation model.

---

## Phase 0 — Engineering foundation

### In scope

1. **`docs/ENGINEERING.md`** (VL-001)  
   - TypeScript strict  
   - `/v1` REST, error envelope from `ARCHITECTURE.md`  
   - Prisma migrations  
   - Conventional commits optional; Husky/commitlint **optional**, not required  
   - How to run locally  
   - ADR template under `docs/adr/`

2. **Monorepo** (VL-002)  
   - pnpm workspaces + Turborepo  
   - `apps/api` NestJS: `GET /health` → `{ "status": "ok" }`  
   - `apps/web` Next.js: a single page that shows API health (or a static “VerbaLab” shell + health fetch)  
   - `infra/docker-compose.yml`: Postgres 16  
   - Prisma in the API (or `packages/db` if that is cleaner) with an empty-ish schema **plus** a `_prisma` migration that applies  
   - ESLint + Prettier + shared `tsconfig`  
   - Vitest: health endpoint test  
   - GitHub Actions: install, `pnpm lint`, `pnpm typecheck`, `pnpm test`  
   - `.env.example` (no secrets)  
   - Root `README.md` with run instructions

### Out of scope (explicit)

- Redis, Elasticsearch, BullMQ, Prometheus, Grafana, OpenTelemetry collector  
- Kubernetes, Terraform, AWS, Cloudflare  
- Clerk, Stripe, AI providers  
- shadcn design system beyond what Next + Tailwind need for a health page  
- Storybook, Framer Motion, GraphQL  
- Folders for future clouds  
- Playwright (wait for Phase 1)

### Done gate

```text
docker compose up -d
pnpm install
pnpm db:migrate   # or documented equivalent
pnpm test         # health test passes
pnpm typecheck
```

CI green on the default branch workflow.

### Credentials required

None beyond GitHub (for Actions). No cloud accounts.

---

## Phase 1 — Identity + translation wedge

Implement as **one session series**, still one VL-ID at a time if context gets tight. Product-wise it is a single slice.

### In scope

| ID | Build |
| --- | --- |
| VL-010 | Clerk (default) sign-up/sign-in on `apps/web`. API validates Clerk JWT on console-originating routes. |
| VL-011 | Clerk Organizations **or** our `organizations` + `memberships` synced from Clerk. Roles: owner, admin, member. |
| VL-012 | `workspaces`: create default workspace on org creation; name + default source/target language. |
| VL-013 | Create/list/revoke API keys. Secret shown once. `Authorization: Bearer` on `/v1/*`. Secrets stored hashed. |
| VL-020 | `languages` table seeded (ISO 639-1 subset + agreed African set from ROADMAP). `GET /v1/languages`. |
| VL-021 | Gateway module with **one** MT adapter. Timeouts, one retry on 429/5xx, request log fields. |
| VL-022 | `POST /v1/translate` `{ "text", "source", "target" }` → `{ "text", "source", "target", "provider", "characters" }`. Reject unknown codes via registry. |
| VL-023 | Console page: language dropdowns, textarea, result, character count. Session auth (not pasting the key). |
| VL-024 | `usage_events` row per successful translate. Console shows month-to-date characters + request count. |

### API (minimum)

```http
GET  /health

GET  /v1/languages
POST /v1/translate
Authorization: Bearer vl_live_...

POST /v1/api-keys          # session
GET  /v1/api-keys          # session, prefixes only
DELETE /v1/api-keys/:id    # session

GET  /v1/usage/summary     # session
```

Exact rest/session split can be `apps/web` → Nest with Clerk token; do not add GraphQL.

### Tests (required)

- Health (already Phase 0)
- API key: create, authenticate, revoke → 401
- Tenant isolation: org B key cannot see org A usage (even if empty)
- Translate: adapter unit test with a recorded fixture
- Translate: validation errors (`unsupported_language`, missing text)
- **Live test skipped unless `TRANSLATE_LIVE=1` and provider key present** — document this; do not fake success
- Playwright: sign in (Clerk test mode / test user) → translate page renders; if live key present, submit and see non-empty output

### Out of scope (explicit)

- MFA/SAML/SCIM/passkeys as our code  
- Glossaries, TM, documents, batch, webhooks  
- Streaming translation  
- Second MT provider  
- Stripe  
- SDK package (VL-033)  
- Speech/TTS/OCR/chat  
- Redis  
- Production deploy (VL-074)

### Credentials you must provide before Phase 1 can be Done

Phase 1 **cannot** be honestly finished without these. If they are missing, the agent must stop — not stub the translator.

| Secret | Why |
| --- | --- |
| `DATABASE_URL` | Postgres (Compose is fine) |
| `CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Auth (if Clerk). Better Auth alternative: its secrets instead. |
| **Either** `GOOGLE_TRANSLATE_API_KEY` **or** Azure Translator key + region | Real MT |

Optional until VL-031: Stripe. Optional until VL-070: Sentry.

**Pick before coding VL-022:** Google Cloud Translation **or** Azure Translator (not both in Phase 1).

---

## Suggested UI (Phase 1 only)

1. `/sign-in`, `/sign-up` — Clerk components  
2. `/` — redirect to `/translate` if signed in  
3. `/translate` — the product  
4. `/keys` — create/revoke  
5. `/usage` — counts  

No marketing site, no dark-pattern “AI OS” shell, no 12-item sidebar of disabled clouds.

---

## What “Done” looks like end-to-end

A human can:

1. Run Compose + `pnpm dev` (API + web)
2. Create an account and org
3. Create an API key
4. Translate English → Swahili (or another seeded pair) in the console **and** via `curl` using the provider’s real model
5. See usage increment
6. Watch CI tests pass without the live key (fixtures); live path documented

---

## Logical next phase after this slice

**VL-030** (OpenAPI + playground) or **VL-032** (audit log) — both small.  
**VL-031 Stripe** when you are ready to take money.  
**VL-100 eval harness** as soon as VL-022 works, even a spreadsheet of 50 sentences, so the African-language claim is not marketing fiction.

Do **not** “quickly add” Speech Cloud next unless a customer asked for STT. The differentiation work is glossary/TM/eval (M5/M10), not more vendor wrappers.

---

## Blockers to flag immediately if they appear

- Clerk (or Google/Azure) account not created  
- Disagreement on Google vs Azure  
- Desire to add K8s/GraphQL “while we’re here” — **refuse**; record as a ROADMAP override instead
