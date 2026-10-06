# ADR-0091: Intelligence Cloud Foundation (hub over LLM gateway, not a custom AI kernel)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-180 (library “Phase 47 Intelligence Cloud Foundation” mapped)

## Context

Library Phase 47 asks for VerbaLab Intelligence Cloud as “the brain of the entire platform” with Embeddings, Vector Search, Knowledge Graph, Memory, Context Engine, Reasoning, Recommendations, Orchestration, Agent Intelligence, Prompt/Decision Intelligence, AI Observability — plus DDD/CQRS/hexagonal, REST/GraphQL/realtime, SDKs, CLI, Terraform, Docker, Kubernetes — “everything production ready.”

ROADMAP previously listed v2 47–59 as vision backlog (“Custom AI kernel → LLM + gateway”). Volumes 1–3 already ship Chat (VL-060), Embeddings (VL-063), Knowledge/RAG (VL-062), and the AI Gateway. Regenerating those or inventing a custom reasoner kernel would violate “extend, don’t regenerate.”

## Decision

1. **Schedule** Intelligence Cloud as executable **VL-180–192** (library Phases 47–59), mapped onto LLM gateway + existing primitives.
2. **Map, don’t clone:** Document library terms → modules in `docs/INTELLIGENCE_CLOUD.md`.
3. **Intelligence Cloud = parent hub** over chat / embeddings / knowledge — not a new microservice or AI kernel.
4. **Ship:** `/intelligence-cloud` console + `GET /v1/intelligence-cloud/products` + `GET /v1/intelligence-cloud/overview` + bounded CQRS catalog port + GraphQL `intelligenceProducts` + OpenAPI + thin SDK/CLI.
5. **Shipped / partial today:** Chat orchestration path, text embeddings, pgvector RAG; observability via shared request IDs.
6. **Defer:** Memory Cloud (with GDPR delete/export), knowledge-graph OS, context engine, custom reasoner, recommendation/decision OS, full orchestration product, intelligence analytics (VL-181–191).
7. **Architecture stays:** Nest modular monolith + REST primary; CQRS/hexagonal **slice** for Intelligence Cloud GraphQL only.
8. **Infra:** Reuse Docker/Fly/Actions/Terraform/EKS from platform; no intelligence-specific cluster.
9. **Constraints carried forward:** Phase 50/VL-183 must ship deletion/export before real user memory; Phase 57/VL-190 orchestration must be exercised end-to-end (not unit tests alone).

## Consequences

- Intelligence products are discoverable from one hub with honest deferred flags.
- Later phases extend this catalog — they must not regenerate Volumes 1–3 or invent a custom AI kernel.
- Cloud Blueprint (ADR-0080) gains an Intelligence column starting at Foundation.
- Vision backlog row for v2 47–59 updates to “Scheduled as VL-180+”.
