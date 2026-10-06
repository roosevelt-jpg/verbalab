# African Knowledge Graph

**Status:** Shipped (VL-263 / library Phase 130)  
**Cloud:** African Intelligence Cloud (Volume 12)  
**ADR:** [ADR-0165](./adr/0165-african-knowledge-graph.md)

African Knowledge Graph is part of VerbaLab's African Intelligence Cloud. It extends existing Language/Knowledge/Intelligence surfaces — it does **not** regenerate Volumes 1–11.

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/african-knowledge-graph` |
| REST engine | `GET /v1/african-knowledge-graph/engine` |
| REST products | `GET /v1/african-knowledge-graph/products` |
| REST monitoring | `GET /v1/african-knowledge-graph/monitoring` |
| GraphQL | `africanKnowledgeGraphEngine` |
| Docs | `/docs/AFRICAN_KNOWLEDGE_GRAPH.md` |

## Honesty

- In-process graph — `neo4jOs: false`

## Roadmap

See [`docs/roadmap/volume12-african-intelligence-cloud/`](./roadmap/volume12-african-intelligence-cloud/).
