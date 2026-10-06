# Evaluation Platform (VL-275)

Library Phase 142 → Evaluation Platform.

## Mission

Part of Lugemi **Research Cloud** (Volume 13). Incubates R&D that later graduates into production services. Extends Intelligence / Knowledge / Foundation Model clouds — does **not** regenerate Volumes 1–12.

## Honesty

See ADR-0177 and engine `honesty` / `safety` fields on `GET /v1/evaluation-platform/engine`.

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/evaluation-platform` |
| REST engine | `GET /v1/evaluation-platform/engine` |
| REST monitoring | `GET /v1/evaluation-platform/monitoring` |
| GraphQL | `evaluationPlatformEngine` |
| Docs | `/docs/EVALUATION_PLATFORM.md` |

## Status

**Shipped** as Volume 13 Research Cloud product (VL-275).
