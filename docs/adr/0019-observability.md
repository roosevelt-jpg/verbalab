# ADR-0019: Observability (JSON logs, Sentry, translate p95)

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-070

## Context

We need SLA-friendly visibility without operating Prometheus/Grafana.

## Decision

- Structured JSON logs via `structuredLog` + HTTP access lines (`event: http.request`) with `request_id`, method, path, status, `duration_ms`.
- `x-request-id` accepted or generated; echoed on all responses; already present on error envelopes.
- Sentry: `@sentry/node` (API) and `@sentry/nextjs` (web) initialize only when `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` are set.
- Translate latency: in-process rolling window (`TranslateLatencyService`); expose `GET /v1/metrics/translate` and include snapshot on `GET /health`. Not a multi-node metrics store.

## Consequences

- p95 is per API process — fine for single-region MVP; revisit when scaling horizontally.
- No self-hosted metrics stack until K8s (per roadmap).
