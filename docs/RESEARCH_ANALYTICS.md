# Research Analytics (VL-279)

Library Phase 146 → Research Analytics.

## Mission

Part of Lugemi **Research Cloud** (Volume 13). Incubates R&D that later graduates into production services. Extends Intelligence / Knowledge / Foundation Model clouds — does **not** regenerate Volumes 1–12.

## Honesty

See ADR-0181 and engine `honesty` / `safety` fields on `GET /v1/research-analytics/engine`.

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/research-analytics` |
| REST engine | `GET /v1/research-analytics/engine` |
| REST monitoring | `GET /v1/research-analytics/monitoring` |
| GraphQL | `researchAnalyticsEngine` |
| Docs | `/docs/RESEARCH_ANALYTICS.md` |

## Status

**Shipped** as Volume 13 Research Cloud product (VL-279).
