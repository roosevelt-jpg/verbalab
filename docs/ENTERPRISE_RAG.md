# Lugemi Enterprise RAG Platform

**Status:** Partial (VL-198 / library Phase 65)  
**Parent:** [Knowledge Cloud](./KNOWLEDGE_CLOUD.md)  
**Rule:** Workspace-scoped retrieval-augmented generation over Knowledge Base chunks. Extends VL-062 RAG + [Enterprise Search](./ENTERPRISE_SEARCH.md) hybrid + Vector/Context. Do **not** invent a LangChain / LlamaIndex / agentic-RAG OS.

**README check:** Green unit tests alone are insufficient — hand-verify retrieved context on real documents and known-answer questions.

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/enterprise-rag` |
| Engine | `GET /v1/enterprise-rag/engine` |
| Chunk preview | `POST /v1/enterprise-rag/chunk` `{ text, size?, overlap? }` |
| Retrieve | `POST /v1/enterprise-rag/retrieve` `{ query, mode?, k?, maxChars?, … }` |
| Grounded query | `POST /v1/enterprise-rag/query` `{ question, mode?, k?, … }` |
| Analytics / monitoring | `GET /v1/enterprise-rag/analytics` · `/monitoring` |
| GraphQL | `enterpriseRagEngine` |
| SDK / CLI | `enterpriseRagEngine()` · `enterpriseRagRetrieve` · `enterpriseRagQuery` |
| Legacy VL-062 | `POST /v1/knowledge/query` (still available) |

## Modes

| Mode | Behavior |
| --- | --- |
| `keyword` | ILIKE over chunk content (Enterprise Search) |
| `semantic` | pgvector cosine (VL-182 / VL-062) |
| `hybrid` | Light RRF of keyword + semantic (not BM25 OS) |

## Pipeline

1. **Chunking** — overlapping character windows (same as VL-062 ingest); preview via `/chunk`.
2. **Retrieval** — Enterprise Search modes, workspace-scoped.
3. **Ranking / context optimization** — score/RRF order, dedupe, `maxChars` truncation.
4. **Citations** — structured `[n]` with documentId, chunkId, filename, snippet, score.
5. **Grounded generate** — `rag` system prompt; answer from context only.

## Honesty

| Flag | Value |
| --- | --- |
| `langchainOs` | false |
| `llamaindexParity` | false |
| `agenticRagOs` | false |
| `bm25Parity` | false |
| `learnedRanker` | false |
| `regeneratesVl062` | false |
| `extendsVl062` | true |
| `extendsEnterpriseSearch` | true |
| `orgWorkspaceScoped` | true |
| `handVerifyRequired` | true |

See ADR-0109.
