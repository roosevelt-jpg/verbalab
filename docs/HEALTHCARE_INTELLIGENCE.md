# Healthcare Intelligence

**Status:** Shipped (VL-265 / library Phase 132)  
**Cloud:** African Intelligence Cloud (Volume 12)  
**ADR:** [ADR-0167](./adr/0167-healthcare-intelligence.md)

Healthcare Intelligence is part of Lugemi's African Intelligence Cloud. It extends existing Language/Knowledge/Intelligence surfaces — it does **not** regenerate Volumes 1–11.

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/healthcare-intelligence` |
| REST engine | `GET /v1/healthcare-intelligence/engine` |
| REST products | `GET /v1/healthcare-intelligence/products` |
| REST monitoring | `GET /v1/healthcare-intelligence/monitoring` |
| GraphQL | `healthcareIntelligenceEngine` |
| Docs | `/docs/HEALTHCARE_INTELLIGENCE.md` |

## Safety

- `notMedicalAdvice: true` — information only; consult a professional

## Roadmap

See [`docs/roadmap/volume12-african-intelligence-cloud/`](./roadmap/volume12-african-intelligence-cloud/).
