# ADR-0109: Enterprise RAG Platform (grounded RAG, not LangChain OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-198 (library “Phase 65 Enterprise RAG Platform” mapped)

## Context

Library Phase 65 asks for an Enterprise RAG Platform with retrieval, chunking, hybrid/vector search, ranking, citations, context optimization, grounded responses, enterprise security, workspace isolation, generate/engine, REST/GraphQL/SDK, monitoring, analytics, and documentation.

VL-062 already ships `POST /v1/knowledge/query` (pgvector retrieve + chat). Enterprise Search (VL-195) adds keyword/hybrid. The README for Volume 6 warns that RAG can pass tests while retrieving wrong context — hand verification on real documents is required.

## Decision

1. **Ship** `/v1/enterprise-rag/*` as a product hub over VL-062 + Enterprise Search — do not regenerate Knowledge ingest or invent LangChain/LlamaIndex OS.
2. **Retrieve** path returns passages + structured citations + context optimization stats (dedupe, maxChars).
3. **Query** path uses hybrid-capable retrieval then the existing `rag` prompt for grounded generation.
4. **Chunk** preview reuses `chunkText` from VL-062.
5. **Honesty:** `langchainOs`, `agenticRagOs`, `bm25Parity`, `learnedRanker` = false; `handVerifyRequired` = true; org+workspace scoped.
6. **Flip** Knowledge Cloud deferred `enterpriseRagProduct` → false; catalog points at `/v1/enterprise-rag/engine`.

## Consequences

- Enterprise RAG is discoverable beside VL-062 `/knowledge` without replacing it.
- Operators must still hand-check retrieval quality on real docs (README Phase 05 constraint).
