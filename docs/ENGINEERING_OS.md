# Lugemi Engineering Operating System (Phase 0)

**Status:** Accepted — living standards  
**Date:** 2026-09-07  
**Maps to:** VL-001 (standards) + VL-002 (production monorepo already in repo)  
**Companion:** Thin cheat-sheet [`ENGINEERING.md`](ENGINEERING.md) · Runtime shape [`ARCHITECTURE.md`](../ARCHITECTURE.md) · Enterprise blueprint [`ENTERPRISE_PRODUCT_BLUEPRINT.md`](ENTERPRISE_PRODUCT_BLUEPRINT.md)

**Rule:** Document the OS we actually run. Do not invent empty cloud folders, placeholder apps, or TODO adapters. The production monorepo **is** this repository (`lugemi/`).

---

## 1. Monorepo Standards

| Rule | Detail |
| --- | --- |
| Tooling | **pnpm** workspaces + **Turborepo** only |
| Node | **20+** LTS |
| Language | TypeScript **strict** in every package |
| Apps | `apps/api` (NestJS), `apps/web` (Next.js) |
| Packages | `packages/sdk`, `packages/typescript-config`, `packages/eslint-config` |
| Infra | `infra/docker-compose.yml`, `infra/fly/`, `infra/DEPLOY.md` |
| Docs | `docs/`, `docs/adr/`, `docs/templates/` |
| Forbidden | Second monorepo, six-repo split, per-cloud empty roots |

Root scripts (authoritative): `pnpm dev`, `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm db:migrate`, `pnpm smoke`, `pnpm test:e2e`.

---

## 2. Repository Standards

- Default branch: `main` / `master` (CI + deploy on push).
- Secrets never committed; use `.env.example` keys only.
- `.gitignore` covers `.env*`, `node_modules`, `.next`, `dist`, Playwright artifacts, storage.
- One concern per PR when possible; do not regenerate prior phases.
- Living constitution: `ROADMAP.md`, `PROGRESS.md`, `ARCHITECTURE.md` updated in the same session as behavior changes.

---

## 3. Folder Standards

```text
lugemi/
  apps/api/          # NestJS HTTP + Prisma + workers-in-process
  apps/web/          # Next.js console + public docs/coverage
  packages/sdk/      # @lugemi/sdk — real client, not a stub
  packages/*-config/ # Shared TS/ESLint
  docs/adr/          # Numbered ADRs
  docs/templates/    # RFC / PRD / Runbook templates
  infra/fly/         # Production Fly configs (US + EU)
  .github/workflows/ # ci.yml, deploy.yml
```

**Do not create:** `clouds/`, `services/translation-microservice/`, empty `foundation-model/` trees, or `TODO.md` that pretends work is done.

Nest modules live under `apps/api/src/<context>/`. Next routes under `apps/web/app/`.

---

## 4. Coding Standards

- TypeScript `strict: true`; no `any` without a one-line justification.
- Prefer explicit return types on exported public functions.
- Nest: Controllers thin; business logic in services; vendor SDKs only inside `gateway/` (or dedicated provider adapters called from gateway).
- Next: Server Components by default; `'use client'` only for interactive console surfaces.
- Errors: throw `ApiException` with stable `code`; never leak stack traces to clients.
- No `TODO`, `FIXME`, or commented-out production paths that fake providers.
- Formatting: Prettier; lint: shared ESLint configs.
- Imports: workspace packages via package name; relative within an app.

---

## 5. Database Standards

- **Postgres** is system of record (Compose host **5433** locally).
- **Redis** for BullMQ + rate limits (host **6379**); tests may use `JOBS_INLINE=1`.
- ORM: **Prisma**; schema at `apps/api/prisma/schema.prisma`.
- Migrations: author with `pnpm db:migrate:dev`; apply with `pnpm db:migrate` (`prisma migrate deploy`) in CI/prod.
- Never edit applied migration SQL except for recovery procedures documented in a runbook.
- Every customer-data query scoped by organization (and workspace where applicable). Tenant isolation tests required for new tables.
- Residency: US/EU islands = **separate** databases; no cross-region joins.
- pgvector for RAG embeddings only where the knowledge module owns the columns.

---

## 6. API Standards

- Public product API: `/v1/*`.
- Health: `GET /health` → `{ "status": "ok", ... }` (may include `region`).
- JSON only; no GraphQL/gRPC in the executable roadmap.
- Auth: `Authorization: Bearer lg_live_…` or Clerk session on console routes.
- Error envelope:

```json
{
  "error": {
    "code": "provider_not_configured",
    "message": "Human-readable explanation",
    "request_id": "uuid"
  }
}
```

- Prefer stable `code` strings for clients.
- OpenAPI document at `/v1/openapi.json`; update when adding routes.
- Versioning: additive fields first; path bump only for breaking changes.
- Rate limits: 429 + `Retry-After`; plan quotas: 402 where specified.

---

## 7. UI Standards

- Console: light, monochrome, ElevenLabs-inspired density (see ADR-0003); brand-first on marketing surfaces.
- Design tokens via CSS variables (`--ink`, `--muted`, `--line`, `--brand`, …).
- Expressive fonts via Next font loading — avoid default Inter/Roboto/Arial stacks on branded pages.
- AppShell nav for authenticated product pages; public pages (`/docs`, `/coverage`, `/setup`) may use lighter chrome.
- Cards only when they contain interaction; avoid dashboard clutter on first viewport of marketing pages.
- Forms: clear labels, disabled states while busy, explicit empty states.
- No emojis as UI decoration unless product copy requires them.

---

## 8. Accessibility Standards

- Semantic HTML: one `h1` per view; label controls; buttons are `<button>`.
- Keyboard: all primary actions reachable; focus visible.
- Contrast: body text on light backgrounds meets WCAG AA intent.
- Images/icons: meaningful `alt` or `aria-hidden` when decorative.
- Playwright and manual checks: no critical axe violations on public docs/setup when introduced.
- Do not rely on color alone for status (pair with text badges).

---

## 9. AI Standards

- **Buy models first.** Gateway adapters wrap vendors; no silent fake success.
- Missing credentials → `provider_not_configured` (503/appropriate), never invented output.
- Fixtures allowed in tests; live calls only behind explicit env flags (`TRANSLATE_LIVE`, etc.).
- Own/rented inference (`OWN_TTS_URL`, fine-tune HTTP endpoints) is still “buy GPU / host,” not an in-house FM program.
- Prompt versions (VL-086) are product data; do not hardcode divergent prompts in multiple modules without a key.
- Consent + abuse review + watermark required for voice clones.
- Eval/coverage pages must stay **true** — no marketing numbers without harness backing.

---

## 10. Cloud Standards

- Local: Docker Compose (Postgres + Redis).
- Production: **Fly.io** one app pair per residency island (`infra/fly/*.toml`, `*.eu.toml`).
- No EKS/Terraform requirement for MVP; revisit when multi-service ops hurt.
- Secrets: Fly secrets + GitHub Actions secrets; never bake into images.
- Migrations run in API `release_command` (`prisma migrate deploy`).
- `LUGEMI_REGION` stamped on health and `X-Lugemi-Region`.
- Object storage deferred until multi-instance document disks require it.

---

## 11. Testing Standards

| Layer | Tool | Gate |
| --- | --- | --- |
| Unit / API | Vitest | Phase Done requires tests for shipped behavior |
| SDK | Vitest + mock HTTP | Package green |
| E2E | Playwright | Public surfaces always; signed-in translate when Clerk creds set |
| Config | File assertions | Deploy tomls, smoke script, OpenAPI paths |
| Security | gitleaks + `pnpm audit` | CI |

- Do not mark Done with empty folders or “manual only.”
- Provider tests: fixture default; live optional.
- Prefer deterministic seeds over shared mutable fixtures across files.

---

## 12. Git Standards

- Conventional commits encouraged: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`.
- Husky/commitlint optional — not required to ship.
- No force-push to main; no `--no-verify` unless explicitly requested for an emergency.
- Commit when asked; do not auto-push secrets.
- Branch names: `vl-XXX-short-slug` or clear feature names.

---

## 13. Documentation Standards

| Doc | Role |
| --- | --- |
| `ROADMAP.md` | Executable backlog + vision cut |
| `PROGRESS.md` | Status truth |
| `ARCHITECTURE.md` | Runtime shape |
| `docs/ENGINEERING.md` | Thin daily standards |
| `docs/ENGINEERING_OS.md` | This OS (full) |
| `docs/ENTERPRISE_PRODUCT_BLUEPRINT.md` | Phase −1 blueprint |
| `docs/adr/*` | Sticky decisions |
| `docs/templates/*` | RFC / PRD / Runbook |
| `infra/DEPLOY.md` | Production runbook entry |
| `README.md` | Clone → run |

Docs change in the same PR/session as behavior. No orphan “Cloud Audit” stamps.

---

## 14. Security Standards

- Hash API keys at rest; show secrets once.
- Org-scoped queries; isolation tests for new resources.
- Helmet / Next security headers.
- Clerk for human auth; do not build parallel IdP.
- Stripe for cards; never store PAN.
- Rate limits + plan quotas.
- gitleaks on CI; high+ prod audit.
- Voice clones: consent attestation + review + watermark.
- Data: retention, export, delete cascade, residency pin.

---

## 15. Observability Standards

- Structured JSON logs with `request_id`.
- Sentry optional via DSN (no-op when unset).
- Health checks for Fly + Docker `HEALTHCHECK`.
- Product metrics: translate latency summary where implemented.
- Prefer PaaS logs + Sentry over self-hosted Prometheus until ops scale demands it.

---

## 16. Performance Standards

- API p95 targets are product-defined per endpoint as we harden (translate metrics first).
- Avoid N+1 Prisma; use `include`/`select` deliberately.
- Jobs for long work (documents, batch); do not block HTTP beyond vendor timeouts.
- Next: avoid shipping huge client bundles on public docs; lazy-load heavy panels when needed.
- TTS/STT timeouts via env (`TTS_TIMEOUT_MS`, etc.).

---

## 17. Architecture Decision Standards

- Non-trivial choices get an ADR in `docs/adr/NNNN-slug.md` using [`adr/0000-template.md`](adr/0000-template.md).
- Status: Proposed → Accepted → Superseded.
- One decision per ADR; link phase ID (`VL-XXX`).
- Update `ARCHITECTURE.md` when the runtime shape changes.

---

## 18. RFC Standards

Use [`templates/RFC.md`](templates/RFC.md) for cross-cutting proposals that are not yet a single ADR (e.g. “extract worker process”).

- RFC authors propose; merge only after explicit Accept in PROGRESS/ROADMAP or ADR.
- RFCs do not ship empty services.

---

## 19. PRD Standards

Use [`templates/PRD.md`](templates/PRD.md) for user-facing product slices before large UI builds.

- Problem, users, scope in/out, acceptance criteria, metrics, non-goals.
- Map to VL-IDs; do not invent unscheduled library clouds as MVP scope.

---

## 20. Runbook Standards

Use [`templates/RUNBOOK.md`](templates/RUNBOOK.md) for operational procedures (deploy, migrate, incident, residency island).

- Steps must be copy-pasteable.
- Include rollback and “when to escalate.”
- Canonical deploy entry: `infra/DEPLOY.md`.

---

## 21. Developer Experience Standards

```bash
docker compose -f infra/docker-compose.yml up -d
cp .env.example apps/api/.env   # and apps/web/.env.local as needed
pnpm install
pnpm db:migrate
pnpm test
pnpm typecheck
pnpm dev
```

| URL | Purpose |
| --- | --- |
| http://localhost:3000 | Console |
| http://localhost:3000/setup | Missing Clerk keys |
| http://localhost:3001/health | API health |
| http://localhost:3000/docs | OpenAPI human docs |

DX rules:

- One command to run API+web (`pnpm dev`).
- Fail loud on missing providers; never silent mocks in prod paths.
- Keep `.env.example` complete for new env vars in the same change.
- Prefer fixing the monorepo over documenting workarounds.

---

## Production monorepo (VL-002) — status

This repository **is** the production monorepo. It already includes:

- pnpm + Turborepo workspaces  
- Nest API with Prisma migrations and `/v1` surface  
- Next console with Clerk-aware routes  
- SDK package with tests  
- Compose Postgres/Redis, Fly deploy configs, CI/CD  
- Vitest + Playwright + OpenAPI  

**Phase 0 does not regenerate the monorepo.** Extending it is mandatory; greenfield rewrites are forbidden unless an ADR migrates deliberately.

### Done gate (Phase 0 OS)

- [x] Standards documented (`ENGINEERING.md` + this file + templates)  
- [x] ADR template present  
- [x] Production monorepo operational (clone → migrate → test → dev)  
- [x] No placeholder apps or TODO provider shims introduced by this phase  

---

## Related

- Enterprise blueprint (Phase −1): `ENTERPRISE_PRODUCT_BLUEPRINT.md`  
- Phase 0/1 original slice: `../PHASE_0_1.md`  
- Deploy runbook: `../infra/DEPLOY.md`
