# ADR-0106: Enterprise Search (keyword + semantic + light hybrid, not Elastic OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-195 (library “Phase 62 Enterprise Search” mapped)

## Context

Library Phase 62 asks for Enterprise Search with full-text, semantic, hybrid, keyword, vector, image, voice, document, translation search, filters, ranking, suggestions — plus engine/REST/GraphQL/SDK/dashboard.

VL-062 RAG and VL-182 Vector Cloud already provide workspace-scoped vector search. Shipping Elastic/OpenSearch parity or multimodal search would violate honesty and “extend, don’t regenerate.”

## Decision

1. **Ship** `/v1/enterprise-search/*` hub with modes `keyword` | `semantic` | `hybrid`.
2. **Reuse** `KnowledgeService.searchVectors` for semantic; keyword via Prisma ILIKE on chunks; hybrid via light RRF.
3. **Filters** collection/tag/contentKind/documentId — always org+workspace scoped.
4. **Suggest** filename/tag/collection prefixes (not autocomplete OS).
5. **Defer** image/voice/translation search OS, BM25/Elastic parity, learned rankers.
6. **Flip** Knowledge Cloud catalog `enterprise-search` → `partial`.

## Consequences

- Search stays a thin product over the Knowledge Base, not a second search cluster.
- Enterprise RAG (VL-198) remains the answer-generation layer; this phase is retrieval/discovery.
