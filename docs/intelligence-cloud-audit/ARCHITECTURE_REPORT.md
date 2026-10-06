# Intelligence Cloud — Architecture Report (VL-192)

**Date:** 2026-10-03  
**Scope:** VL-180–191 Intelligence Cloud volume (+ supporting VL-060/062/063)

## Verdict

Intelligence Cloud is a **hub over Nest modular monolith chat/embeddings/RAG modules**, not a separate microservice mesh and not a custom AI research OS. REST is primary; GraphQL is a façade; CQRS applies to the Intelligence Cloud catalog slice (VL-180).

Clouds follow the **12-layer Lugemi Cloud Blueprint** (ADR-0080).

## System shape

| Layer | Reality |
| --- | --- |
| Runtime | NestJS API (`apps/api`) + Next.js console (`apps/web`) |
| Data | Postgres + pgvector; Redis for jobs/rate limits |
| Hub | `GET /v1/intelligence-cloud/products` + `/intelligence-cloud` console |
| Deploy | Fly.io default; optional AWS EKS `af-south-1` |
| Blueprint | ADR-0080 (Foundation → Production Audit) |

## Capability map (honest)

| Product | VL | Status note |
| --- | --- | --- |
| Foundation | 180 | Hub/catalog/overview; not custom AI kernel |
| Embedding Cloud | 181 / 063 | Text embeds; multimodal deferred |
| Vector Cloud | 182 / 062 | pgvector hub; hybrid/sharding deferred |
| Memory Cloud | 183 | CRUD + GDPR; semantic NN deferred |
| Knowledge Graph | 184 | Bounded Postgres ER; prefer RAG; Neo4j deferred |
| Context Engine | 185 | Assemble + char-budget; infinite window deferred |
| Reasoning Cloud | 186 | LLM strategies; not custom reasoner |
| Recommendation Engine | 187 | Light rankers; not retail OS |
| Prompt Intelligence | 188 | Hub over VL-086; not research lab |
| Decision Engine | 189 | Light rules; not Drools/Pega |
| AI Orchestration | 190 | e2e pipelines; not multi-cloud agent OS |
| Intelligence Analytics | 191 | Aggregates for this cloud only |

## Integration findings

- Catalogs discoverable; chat/embeddings billing metering wired.
- GraphQL exposes intelligence product engines without regenerating REST.
- Orchestration calls real Translate/Chat/Gateway/Decision/Context services.
- Sibling Language/Speech/Voice analytics are **not** regenerated.

## Rejected architecture claims

- Custom AI kernel / LangGraph OS  
- Proprietary Lugemi Intelligence Graph as this phase’s deliverable  
- Enterprise BRMS / retail recommender / multi-cloud agent OS
