# Knowledge Cloud — Performance Report (VL-203)

**Date:** 2026-10-03

## What was run

| Smoke | Method | Bound |
| --- | --- | --- |
| Catalog load | Sequential GETs across Knowledge Cloud engines | 24 iterations &lt; 30s |
| Rapid stress | Sequential GETs on products catalog | 12 iterations &lt; 15s |
| Search / knowledge “benchmarks” | **Rejected as invented platforms** | Covered by existing unit/integration specs (`enterprise-search`, `enterprise-rag`, `knowledge`, `knowledge-base`) |

## Results

Executed by `apps/api/test/knowledge-cloud-audit.spec.ts` in CI/local vitest. No k6, Locust, or vendor load certificate is claimed.

## Honesty

Library Phase 70 asks for performance/search/knowledge benchmarks. Lugemi ships **bounded smokes + existing suite evidence**, not a benchmark lab. Live semantic/RAG latency depends on OpenAI availability and is env-gated.
