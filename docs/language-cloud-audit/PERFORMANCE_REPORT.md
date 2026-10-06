# Language Cloud — Performance Report (VL-147)

**Date:** 2026-09-07  
**Scope:** Bounded evidence only — not a load-test certification.

## What we measured

| Check | Method | Result |
| --- | --- | --- |
| Translate latency math | `translate-latency.spec.ts` | p50/p95/p99 unit assertions pass |
| Org latency analytics | `GET /v1/analytics/latency` | Percentiles from `translation_requests.latency_ms` |
| In-process metrics | `GET /v1/metrics/translate` | Single-instance rolling window (not cluster-wide) |
| Catalog load smoke | 24 sequential GETs across public catalogs | Completes &lt; 30s in audit test |

## What we did **not** claim

- No k6/Locust multi-region soak.
- No published p95 SLA for production vendor MT (depends on Google/OpenAI).
- No CDN/edge language cache product.

## Recommendations (ops)

1. Keep Redis + non-inline jobs in production (`JOBS_INLINE` unset).
2. Watch Fly/EKS instance metrics separately from in-process p95.
3. Use `GET /v1/analytics/latency` for org historical latency; use `/v1/metrics/translate` only for the local process.
