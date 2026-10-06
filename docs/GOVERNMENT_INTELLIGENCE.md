# Government Intelligence

**Status:** Shipped (VL-264 / library Phase 131)  
**Cloud:** African Intelligence Cloud (Volume 12)  
**ADR:** [ADR-0166](./adr/0166-government-intelligence.md)

Government Intelligence is part of Lugemi's African Intelligence Cloud. It extends existing Language/Knowledge/Intelligence surfaces — it does **not** regenerate Volumes 1–11.

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/government-intelligence` |
| REST engine | `GET /v1/government-intelligence/engine` |
| REST products | `GET /v1/government-intelligence/products` |
| REST monitoring | `GET /v1/government-intelligence/monitoring` |
| GraphQL | `governmentIntelligenceEngine` |
| Docs | `/docs/GOVERNMENT_INTELLIGENCE.md` |

## Safety

- `officialGuidanceMustBeSourced: true`; stale-guidance risk noted

## Roadmap

See [`docs/roadmap/volume12-african-intelligence-cloud/`](./roadmap/volume12-african-intelligence-cloud/).
