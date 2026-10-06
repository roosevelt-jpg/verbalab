# Financial Intelligence

**Status:** Shipped (VL-266 / library Phase 133)  
**Cloud:** African Intelligence Cloud (Volume 12)  
**ADR:** [ADR-0168](./adr/0168-financial-intelligence.md)

Financial Intelligence is part of VerbaLab's African Intelligence Cloud. It extends existing Language/Knowledge/Intelligence surfaces — it does **not** regenerate Volumes 1–11.

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/financial-intelligence` |
| REST engine | `GET /v1/financial-intelligence/engine` |
| REST products | `GET /v1/financial-intelligence/products` |
| REST monitoring | `GET /v1/financial-intelligence/monitoring` |
| GraphQL | `financialIntelligenceEngine` |
| Docs | `/docs/FINANCIAL_INTELLIGENCE.md` |

## Safety

- `notInvestmentAdvice: true`; fair-lending considerations flagged

## Roadmap

See [`docs/roadmap/volume12-african-intelligence-cloud/`](./roadmap/volume12-african-intelligence-cloud/).
