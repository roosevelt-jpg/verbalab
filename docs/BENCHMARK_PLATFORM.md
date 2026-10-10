# Benchmark Platform (VL-274)

Library Phase 141 → Benchmark Platform.

## Mission

Part of Lugemi **Research Cloud** (Volume 13). Incubates R&D that later graduates into production services. Extends Intelligence / Knowledge / Foundation Model clouds — does **not** regenerate Volumes 1–12.

## Honesty

See ADR-0176 and engine `honesty` / `safety` fields on `GET /v1/benchmark-platform/engine`.

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/benchmark-platform` |
| REST engine | `GET /v1/benchmark-platform/engine` |
| REST monitoring | `GET /v1/benchmark-platform/monitoring` |
| GraphQL | `benchmarkPlatformEngine` |
| Docs | `/docs/BENCHMARK_PLATFORM.md` |

## Status

**Shipped** as Volume 13 Research Cloud product (VL-274).
