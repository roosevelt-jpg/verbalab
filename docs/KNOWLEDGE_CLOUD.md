# VerbaLab Knowledge Cloud

**Status:** Volume complete through Production Audit (VL-193–203 / library Phases 60–70)  
**Rule:** Enterprise knowledge layer over VL-062 RAG and Intelligence Cloud (embeddings, vectors, knowledge graph, context). Extend existing Knowledge / Vector / Graph modules. Do **not** regenerate Intelligence Cloud or invent a Confluence/SharePoint/ontology OS. Follow the [12-layer Cloud Blueprint](./CLOUD_BLUEPRINT.md) (ADR-0080). Roadmap: [`docs/roadmap/volume6-knowledge-cloud/`](./roadmap/volume6-knowledge-cloud/). Evidence: [`docs/knowledge-cloud-audit/`](./knowledge-cloud-audit/).

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Knowledge Cloud Foundation | **VL-193** — `/knowledge-cloud` + product catalog / overview |
| Enterprise Knowledge Base | **Partial** — **VL-194** `/knowledge-base` over VL-062; org/workspace-scoped; media/approval deferred |
| Enterprise Search | **Partial** — **VL-195** `/enterprise-search`; keyword/semantic/light hybrid; not Elastic OS |
| Ontology Platform | **Partial** — **VL-196** `/ontology` over VL-184 KG; not OWL/Protege OS |
| Taxonomy Platform | **Partial** — **VL-197** `/taxonomy` trees + doc assign; not enterprise taxonomy OS |
| Enterprise RAG Platform | **Partial** — **VL-198** `/enterprise-rag` retrieve/cite/grounded query; not LangChain OS |
| Knowledge Memory | **Partial** — **VL-199** `/knowledge-memory` over VL-183; ≠ Memory Cloud hub; not Mem0 OS |
| Knowledge Intelligence | **Partial** — **VL-200** `/knowledge-intelligence` heuristic insight; not BI/Palantir OS |
| Enterprise Knowledge APIs | **Partial** — **VL-201** `/knowledge-apis` pack over REST/GraphQL/OpenAPI/SDK/CLI; gRPC/Kafka deferred |
| Knowledge Analytics | **Partial** — **VL-202** `/knowledge-analytics` growth/usage/quality; not BI OS |
| Production Audit | **Done** — **VL-203** evidence pack under `docs/knowledge-cloud-audit/` |
| Knowledge Graph | Linked VL-184 — not regenerated as this cloud |
| GraphQL / CQRS | Bounded Knowledge Cloud catalog slice |
| Terraform / Kubernetes | Shared platform — Fly default; optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console hub | `/knowledge-cloud` |
| REST catalog | `GET /v1/knowledge-cloud/products` (public) |
| REST overview | `GET /v1/knowledge-cloud/overview` (Clerk session) |
| GraphQL | `knowledgeProducts` |
| OpenAPI | `/v1/openapi.json` |
| SDK | `knowledgeProducts()` on `@verbalab/sdk` |
| CLI | `verbalab knowledge-products` |
| Existing RAG | `/knowledge` · `POST /v1/knowledge/query` (VL-062) |
| Knowledge Base | `/knowledge-base` · `GET /v1/knowledge-base/engine` (VL-194) |
| Enterprise Search | `/enterprise-search` · `POST /v1/enterprise-search/search` (VL-195) |
| Ontology | `/ontology` · `GET /v1/ontology/engine` (VL-196) |
| Taxonomy | `/taxonomy` · `GET /v1/taxonomy/engine` (VL-197) |
| Enterprise RAG | `/enterprise-rag` · `POST /v1/enterprise-rag/query` (VL-198) |
| Knowledge Memory | `/knowledge-memory` · `GET /v1/knowledge-memory/engine` (VL-199) |
| Knowledge Intelligence | `/knowledge-intelligence` · `GET /v1/knowledge-intelligence/engine` (VL-200) |
| Knowledge APIs | `/knowledge-apis` · `GET /v1/knowledge-apis/engine` (VL-201) |
| Knowledge Analytics | `/knowledge-analytics` · `GET /v1/knowledge-analytics/engine` (VL-202) |

---

## Honesty

Knowledge Cloud is **not** an enterprise knowledge OS, ontology platform, or Neo4j knowledge-graph suite. It is a **bounded hub** that makes VL-062 RAG and related Intelligence surfaces discoverable and schedules KB / search / ontology / taxonomy / enterprise RAG / knowledge memory products with **tenant-scoped access from day one** (Phase 61). It maps onto existing **VL-062** knowledge/RAG (pgvector), **VL-063** embeddings, and Intelligence Cloud hubs — it does **not** regenerate those surfaces. See ADR-0104.

## Constraints carried forward (README)

1. **Phase 61 / Enterprise Knowledge Base** — access controls must be org/workspace-scoped from the first ingestion path (classic cross-tenant leak risk).
2. **Phase 65 / Enterprise RAG** — do not trust green unit tests alone; hand-check retrieved context on real documents and known-answer questions.
