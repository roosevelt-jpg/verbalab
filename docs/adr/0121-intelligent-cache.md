# ADR-0121: Intelligent Cache (exact-key sandbox, not Redis/vector OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-210 (library “Phase 77 Intelligent Cache” mapped)

## Context

Library Phase 77 asks for AI Cache covering semantic/translation/embedding/speech/voice/document/prompt/context caches plus platform/REST/GraphQL/monitoring/analytics/docs and production deployment.

Gateway honesty and ROADMAP explicitly defer a blanket response-cache layer. Inventing Redis Cluster, CDN, or ANN vector semantic cache would overshoot and risk silent stale inference.

## Decision

1. Ship `/v1/intelligent-cache/*` + `/intelligent-cache` as an **opt-in** entry store.
2. Support all eight namespaces with **exact keys**; `semantic` uses normalized-text SHA-256 (not vector similarity).
3. Persist `CacheEntry` rows in Postgres with TTL + hard `maxEntriesPerWorkspace`.
4. Do **not** auto-intercept Gateway calls (`autoWiresGatewayResponses: false`).
5. Defer Redis Cluster OS, vector ANN semantic OS, and CDN edge cache.
6. Flip Inference Cloud catalog `intelligent-cache` to partial; deferred flag → false. AI Router caching capability → partial (link only).

## Consequences

- Product clouds can cache hot results intentionally without a hidden Gateway middleware.
- True semantic similarity remains out of scope until a deliberate vector cache design.
- Cost Optimization (VL-211) remains responsible for spend caps; cache only reduces repeat work when used.
