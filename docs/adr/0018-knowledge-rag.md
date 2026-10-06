# ADR-0018: Knowledge + RAG (pgvector)

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-062

## Context

Enterprise users want to ask questions over a small set of workspace documents with citations. VL-063 already provides embeddings; VL-060 provides chat.

## Decision

- Postgres image: `pgvector/pgvector:pg16` (Compose + CI). Migration enables `vector` and creates `knowledge_documents` / `knowledge_chunks` with `vector(1536)` + HNSW cosine index.
- Separate from VL-040 `documents` (translation artifacts).
- Sync ingest on `POST /v1/knowledge/documents`: extract (reuse DocumentCodec) → chunk (~700 chars, overlap ~80) → batch embed via gateway → store vectors.
- `POST /v1/knowledge/query`: embed question → top-k cosine retrieve → chat with citation-aware system prompt → `{ answer, citations[] }`.
- Caps: `KNOWLEDGE_MAX_DOCS` (20), `KNOWLEDGE_MAX_CHUNKS` (200), `RAG_TOP_K` (5).
- Console `/knowledge`.

## Consequences

- Existing local volumes from `postgres:16-alpine` must be recreated when switching images.
- Live path needs `OPENAI_API_KEY` for embeddings + chat.
- No hybrid BM25, re-rankers, streaming, or knowledge graphs in this phase.
