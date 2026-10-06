# VerbaLab Vector Cloud

**Status:** Partial shipped (VL-182 / library Phase 49)  
**Rule:** Productize nearest-neighbor search over Postgres pgvector (`knowledge_chunks`). Do not ship a Pinecone/Weaviate/Qdrant managed vector OS. Hybrid BM25, sharding, and replication product APIs stay deferred.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Vector Storage | **Shipped** — `knowledge_chunks.embedding` via Knowledge ingest (VL-062) |
| Semantic / NN / Similarity Search | **Shipped** — `POST /v1/vector-cloud/search` |
| Metadata Filtering | **Partial** — `documentId` (+ optional `minScore`); arbitrary JSON filters deferred |
| Namespaces | **Shipped** — workspace id = namespace |
| Collections | **Partial** — single `knowledge` collection per workspace |
| Index Management | **Partial** — HNSW cosine from VL-062 migration; create/drop API deferred |
| Hybrid Search | **Deferred** |
| Sharding / Replication | **Deferred** — use Postgres scale / HA |
| Engine / Dashboard | **VL-182** — `GET /v1/vector-cloud/engine` + `/vector-cloud` |
| Analytics / Monitoring | **Shipped** — `/analytics`, `/monitoring` |
| GraphQL / SDK / CLI | `vectorCloudEngine`, `verbalab vector-cloud-engine` |
| Related | Embedding Cloud VL-181; RAG answers stay `POST /v1/knowledge/query` |

---

## Honesty

Not a managed vector database product. See ADR-0093. Search embeds the query via the AI Gateway (needs `OPENAI_API_KEY` live).
