# African Language Registry

**Status:** Shipped (VL-261 / library Phase 128)  
**Cloud:** African Intelligence Cloud (Volume 12)  
**ADR:** [ADR-0163](./adr/0163-african-language-registry.md)

African Language Registry is part of Lugemi's African Intelligence Cloud. It extends existing Language/Knowledge/Intelligence surfaces — it does **not** regenerate Volumes 1–11.

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/african-language-registry` |
| REST engine | `GET /v1/african-language-registry/engine` |
| REST products | `GET /v1/african-language-registry/products` |
| REST monitoring | `GET /v1/african-language-registry/monitoring` |
| GraphQL | `africanLanguageRegistryEngine` |
| Docs | `/docs/AFRICAN_LANGUAGE_REGISTRY.md` |

## Honesty

- `coverageComplete: false` — representative seed only

## Roadmap

See [`docs/roadmap/volume12-african-intelligence-cloud/`](./roadmap/volume12-african-intelligence-cloud/).
