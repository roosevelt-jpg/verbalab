# Cultural Intelligence

**Status:** Shipped (VL-262 / library Phase 129)  
**Cloud:** African Intelligence Cloud (Volume 12)  
**ADR:** [ADR-0164](./adr/0164-cultural-intelligence.md)

Cultural Intelligence is part of Lugemi's African Intelligence Cloud. It extends existing Language/Knowledge/Intelligence surfaces — it does **not** regenerate Volumes 1–11.

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/cultural-intelligence` |
| REST engine | `GET /v1/cultural-intelligence/engine` |
| REST products | `GET /v1/cultural-intelligence/products` |
| REST monitoring | `GET /v1/cultural-intelligence/monitoring` |
| GraphQL | `culturalIntelligenceEngine` |
| Docs | `/docs/CULTURAL_INTELLIGENCE.md` |

## Honesty

- Every entry has `provenance`, `sourceCommunity`, `consentStatus` (`unverified|attested|restricted`)
- `traditionalKnowledgeConsentRequired: true`
- Not an extractive scrape of traditional knowledge

## Roadmap

See [`docs/roadmap/volume12-african-intelligence-cloud/`](./roadmap/volume12-african-intelligence-cloud/).
