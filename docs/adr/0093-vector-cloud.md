# ADR-0093: Vector Cloud (product hub over VL-062 pgvector)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-182 (library “Phase 49 Vector Cloud” mapped)

## Context

Library Phase 49 asks for enterprise vector storage, semantic/NN/hybrid/similarity search, metadata filters, namespaces, collections, index management, sharding, replication, plus REST/GraphQL/SDK, dashboard, monitoring, analytics, and production deployment.

Lugemi already stores and retrieves 1536-d cosine vectors on `knowledge_chunks` with an HNSW index (VL-062). Building a Pinecone-parity managed vector OS would violate buy-vs-build and honesty rules.

## Decision

1. Ship **Vector Cloud** hub under `/v1/vector-cloud/*` + console `/vector-cloud`.  
2. **Reuse** Knowledge ingest for vector storage (`POST /v1/knowledge/documents`).  
3. Add `POST /v1/vector-cloud/search` for nearest-neighbor / similarity search (embed query + pgvector `<=>`).  
4. Treat **workspace id as namespace** and expose a single **knowledge** collection.  
5. Catalog the migration-managed HNSW index; defer create/drop/rebuild APIs.  
6. **Defer** hybrid BM25, sharding, and vector-specific replication products.  
7. Keep RAG chat answers on `POST /v1/knowledge/query` — search hub does not regenerate that path.

## Consequences

- Intelligence Cloud marks vector `partial` with hub links.  
- Dedicated managed vector DB remains deferred until scale forces it.  
- Memory Cloud (VL-183) is next and must include GDPR delete/export.
