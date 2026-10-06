# ADR-0020: Rate limits (Redis) + monthly quotas

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-071

## Context

Monthly character quotas (VL-031 / `assertWithinQuota` → 402) do not stop burst abuse. We need per-key and per-org request rate limits.

## Decision

- Fixed-window counters in Redis (`rl:key:*`, `rl:org:*`) via `RateLimitService`.
- Limits come from plan entitlements (`PLANS.free|pro.rateLimitPerKey/Org`), overridable by env.
- `RateLimitGuard` after `TranslateAuthGuard` on `POST /v1/translate` and `POST /v1/detect`.
- On exceed: HTTP **429**, `Retry-After`, `X-RateLimit-*` headers, code `rate_limited`.
- Tests / no Redis: in-memory store when `JOBS_INLINE=1` or `RATE_LIMIT_MEMORY=1` (fail closed in memory, not fail open).
- Monthly character quota remains separate (402 `quota_exceeded`).

## Consequences

- Window is process-local when using memory mode (Vitest).
- Other TranslateAuth routes can adopt the same guard later.
