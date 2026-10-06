# Intelligence Cloud — Performance Report (VL-192)

**Date:** 2026-10-03

## What was run

| Smoke | Method | Bound |
| --- | --- | --- |
| Catalog load | Sequential GETs across Intelligence Cloud engines | 24 iterations &lt; 30s |
| Rapid stress | Sequential GETs on products catalog | 12 iterations &lt; 15s |
| Reasoning / vector “benchmarks” | **Rejected as invented platforms** | Covered by existing unit/integration specs (`reasoning-cloud`, `vector-cloud`, `embedding-cloud`) |

## Results

Executed by `apps/api/test/intelligence-cloud-audit.spec.ts` in CI/local vitest. No k6, Locust, or vendor load certificate is claimed.

## Honesty

Library Phase 59 asks for performance/reasoning/vector benchmarks. VerbaLab ships **bounded smokes + existing suite evidence**, not a benchmark lab. Live LLM latency depends on OpenAI availability and is env-gated.
