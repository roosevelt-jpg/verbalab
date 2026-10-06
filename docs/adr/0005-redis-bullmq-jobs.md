# ADR-0005: Redis + BullMQ for async jobs

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-044

## Context

Document and batch translation cannot complete inside a single HTTP request timeout. The roadmap deferred Redis until the first justified queue use (VL-044).

## Decision

- Run **Redis 7** in local Compose (`infra/docker-compose.yml`, host `6379`) and CI.
- Use **BullMQ** in the Nest API process for MVP (queue + worker co-located). Extract `apps/worker` later if load requires it.
- Persist job state in Postgres (`jobs` table). BullMQ is the work queue; Postgres is the source of truth for API polling.
- Outbound webhooks are HMAC-SHA256 signed (`X-Lugemi-Timestamp` + `X-Lugemi-Signature: v1=<hex>` over `{timestamp}.{body}`). Org stores `webhook_signing_secret`.
- First job type: `batch_translate` (≤100 items), reusing the existing translate path (quota + metering).
- Tests set `JOBS_INLINE=1` to process without Redis; production/dev use Redis when available, with inline fallback if Redis fails to connect.

## Consequences

- Local `docker compose up` now starts Postgres **and** Redis.
- Env: `REDIS_URL` (default `redis://127.0.0.1:6379`), optional `JOBS_INLINE=1`.
- Document translation (VL-040) should enqueue jobs rather than blocking HTTP.
