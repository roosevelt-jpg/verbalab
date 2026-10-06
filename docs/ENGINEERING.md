# VerbaLab Engineering Standards

Thin daily cheat-sheet for Phase 0+. **Full Engineering Operating System:** [`ENGINEERING_OS.md`](ENGINEERING_OS.md). Templates: [`templates/`](templates/). Expand sticky decisions with ADRs — do not grow a 30-folder empty encyclopedia.

## Language and runtime

- TypeScript **strict** everywhere (`strict: true`).
- Node.js **20+** LTS for API and tooling.
- Package manager: **pnpm** only (see root `packageManager`).
- Monorepo orchestration: **Turborepo**.

## Repository layout

```text
apps/api          NestJS HTTP API
apps/web          Next.js console
packages/*        Shared config + @verbalab/sdk
docs/             ENGINEERING_OS, ADRs, templates, blueprint
infra/            Compose + Fly + DEPLOY.md
```

Do not pre-create empty “cloud” folders for future products. This repo **is** the production monorepo.

## API shape

- Public product API lives under `/v1`.
- Health is unversioned: `GET /health` → `{ "status": "ok" }`.
- JSON only. No GraphQL in MVP.
- Error envelope:

```json
{
  "error": {
    "code": "unsupported_language",
    "message": "Human-readable explanation",
    "request_id": "uuid-or-request-id"
  }
}
```

- Prefer stable `code` strings over parsing `message`.
- Auth for product routes: `Authorization: Bearer vl_live_...`. Console may use Clerk session/JWT.

## Database

- **Postgres** via Docker Compose locally (host port **5433** → container 5432); Prisma as the ORM/migration tool.
- **Redis** via Compose (host **6379**) for BullMQ jobs. Tests may set `JOBS_INLINE=1`.
- Schema changes: edit `schema.prisma`, then `pnpm db:migrate:dev`. Apply with `pnpm db:migrate` in CI/production.
- Every customer-data query must be scoped by organization. Prove isolation with tests.

## Testing

- **Vitest** for unit and API tests. A phase is not Done without tests for what it shipped.
- Provider integrations: fixture/unit tests always; live calls only when an env flag and real key are present (never fake success).
- Playwright: `pnpm test:e2e` — public surfaces always; signed-in translate when `E2E_CLERK_*` set (no fake auth).

## Local development

```bash
docker compose -f infra/docker-compose.yml up -d
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

- API default: `http://localhost:3001`
- Web default: `http://localhost:3000`

## CI

GitHub Actions: lint, typecheck, test, Playwright public e2e, gitleaks, audit.

## Pull requests

- One phase / one clear concern per PR when possible.
- Do not regenerate previous phases.
- No TODOs or placeholder provider adapters pretending to be production.
- If a credential or infra piece is missing, stop and document the blocker instead of stubbing.

## Commits

Conventional commits (`feat:`, `fix:`, `docs:`, …) are encouraged but not enforced.

## Architecture Decision Records

Non-trivial choices get an ADR under `docs/adr/` using the template. RFCs/PRDs/runbooks use `docs/templates/`.
