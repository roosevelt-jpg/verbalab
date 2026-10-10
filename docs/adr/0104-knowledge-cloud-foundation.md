# ADR-0104: Knowledge Cloud Foundation (hub over VL-062 RAG, not an enterprise knowledge OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-193 (library “Phase 60 Knowledge Cloud Foundation” mapped)

## Context

Library Phase 60 asks for Lugemi Enterprise Knowledge Cloud as a first-class platform with Knowledge Base, Enterprise Search, Knowledge Graph, Document Intelligence, Semantic Knowledge, Organizational/AI Memory, Ontology, Taxonomy, Knowledge APIs — plus DDD/CQRS/hexagonal, REST/GraphQL/realtime, SDKs, CLI, Terraform, Docker, Kubernetes — “everything production ready.”

Volumes 1–5 already ship Knowledge/RAG (VL-062), Embeddings (VL-063), Vector Cloud, Memory Cloud, Knowledge Graph (bounded ER), and Intelligence Cloud. Regenerating those or inventing a Confluence/SharePoint/ontology OS would violate “extend, don’t regenerate.”

Volume 6 README (`docs/roadmap/volume6-knowledge-cloud/README_VOLUME6.md`) requires building on Intelligence Cloud and calling out tenant scoping (Phase 61) and hand-verification of RAG (Phase 65).

## Decision

1. **Schedule** Knowledge Cloud as executable **VL-193–203** (library Phases 60–70), mapped onto VL-062 RAG + Intelligence knowledge surfaces.
2. **Map, don’t clone:** Document library terms → modules in `docs/KNOWLEDGE_CLOUD.md`.
3. **Knowledge Cloud = parent hub** over `/knowledge` + Intelligence RAG/vector/graph — not a new microservice or knowledge OS.
4. **Ship:** `/knowledge-cloud` console + `GET /v1/knowledge-cloud/products` + `GET /v1/knowledge-cloud/overview` + bounded CQRS catalog port + GraphQL `knowledgeProducts` + OpenAPI + thin SDK/CLI.
5. **Shipped / partial today:** VL-062 document upload/chunk/embed/query; VL-184 knowledge-graph bridge; shared pgvector.
6. **Defer:** Enterprise KB, Search, Ontology, Taxonomy, full Enterprise RAG product, Knowledge Memory, Knowledge Intelligence, API pack, Knowledge Analytics (VL-194–202).
7. **Architecture stays:** Nest modular monolith + REST primary; CQRS/hexagonal **slice** for Knowledge Cloud GraphQL only.
8. **Infra:** Reuse Docker/Fly/Actions/Terraform/EKS from platform; no knowledge-specific cluster.
9. **Constraints carried forward:** Phase 61 must ship org/workspace-scoped access on ingestion; Phase 65 Enterprise RAG must be exercised with real docs/questions (not unit tests alone).

## Consequences

- Knowledge products are discoverable from one hub with honest deferred flags.
- Later phases extend this catalog — they must not regenerate VL-062 or Intelligence Cloud, or invent enterprise knowledge / ontology OS parity.
- Cloud Blueprint (ADR-0080) gains a Knowledge column starting at Foundation.
