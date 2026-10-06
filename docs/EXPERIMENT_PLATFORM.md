# Experiment Platform (VL-272)

Library Phase 139 → Experiment Platform.

## Mission

Part of Lugemi **Research Cloud** (Volume 13). Incubates R&D that later graduates into production services. Extends Intelligence / Knowledge / Foundation Model clouds — does **not** regenerate Volumes 1–12.

## Honesty

See ADR-0174 and engine `honesty` / `safety` fields on `GET /v1/experiment-platform/engine`.

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/experiment-platform` |
| REST engine | `GET /v1/experiment-platform/engine` |
| REST monitoring | `GET /v1/experiment-platform/monitoring` |
| GraphQL | `experimentPlatformEngine` |
| Docs | `/docs/EXPERIMENT_PLATFORM.md` |

## Status

**Shipped** as Volume 13 Research Cloud product (VL-272).
