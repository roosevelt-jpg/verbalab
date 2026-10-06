# Knowledge Cloud — Architecture Report (VL-203)

**Date:** 2026-10-03  
**Scope:** VL-193–202 Knowledge Cloud volume (+ supporting VL-062 / Intelligence KG)

## Verdict

Knowledge Cloud is a **hub over Nest modular monolith knowledge/RAG modules**, not a separate microservice mesh and not an enterprise knowledge OS. REST is primary; GraphQL is a façade; CQRS applies to the Knowledge Cloud catalog slice (VL-193).

Clouds follow the **12-layer Lugemi Cloud Blueprint** (ADR-0080).

## System shape

| Layer | Reality |
| --- | --- |
| Runtime | NestJS API (`apps/api`) + Next.js console (`apps/web`) |
| Data | Postgres + pgvector; Redis for jobs/rate limits |
| Hub | `GET /v1/knowledge-cloud/products` + `/knowledge-cloud` console |
| Deploy | Fly.io default; optional AWS EKS `af-south-1` |
| Blueprint | ADR-0080 (Foundation → Production Audit) |

## Capability map (honest)

| Product | VL | Status note |
| --- | --- | --- |
| Foundation | 193 | Hub/catalog/overview; not enterprise knowledge OS |
| Enterprise Knowledge Base | 194 | Collections/tags/MD/HTML over VL-062; Confluence deferred |
| Enterprise Search | 195 | Keyword/semantic/light hybrid RRF; Elastic deferred |
| Ontology Platform | 196 | Concepts/is_a/synonyms over VL-184; OWL deferred |
| Taxonomy Platform | 197 | Trees + assign + heuristic classify; taxonomy OS deferred |
| Enterprise RAG | 198 | Retrieve/cite/grounded query; LangChain deferred |
| Knowledge Memory | 199 | layer=knowledge over VL-183; Mem0 deferred |
| Knowledge Intelligence | 200 | Heuristic discover/link/validate; BI deferred |
| Enterprise Knowledge APIs | 201 | REST/GraphQL/OpenAPI/SDK/CLI/SSE pack; gRPC/Kafka deferred |
| Knowledge Analytics | 202 | Growth/usage/quality aggregates; BI OS deferred |

## Integration findings

- Catalogs discoverable; org/workspace scoping on authed knowledge routes.
- GraphQL exposes knowledge product engines without regenerating REST.
- Enterprise RAG/search reuse VL-062 chunks + embeddings; ontology reuses VL-184 KG.
- Sibling Language/Speech/Voice/Intelligence analytics are **not** regenerated.

## Rejected architecture claims

- Enterprise knowledge / Confluence / Elastic / OWL / taxonomy OS  
- LangChain / Mem0 / Palantir BI / gRPC-Kafka API platform  
- Inference Cloud as this phase’s deliverable (Volume 7)
