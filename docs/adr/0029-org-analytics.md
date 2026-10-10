# ADR-0029: Org analytics on usage SQL

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-085

## Context

We need an org dashboard for volume, cost, and error rate to guide pricing and coverage. We will not build an “analytics cloud” or ship event data to a third-party product analytics stack.

## Decision

1. **`GET /v1/analytics/overview`** (Clerk or API key) aggregates the current org for a period (default: month-to-date).
2. **Volume by feature** — SQL `GROUP BY` on `usage_events`.
3. **Volume by language pair** — SQL on `translation_requests` (pairs are not stored on `usage_events`).
4. **Cost** — estimated USD from units × env-tunable rates (`ANALYTICS_COST_*`). Explicitly not Stripe invoices.
5. **Error rate** — `jobs` succeeded vs failed in the window.
6. **Console** `/analytics` renders the overview; `/usage` remains the simple MTD meter.

## Consequences

- Language-pair analytics only cover translate (not STT/TTS alone).
- Cost is directional for ops; billing remains Stripe + quotas.
