# VerbaLab Enterprise Search

**Status:** Partial (VL-195 / library Phase 62)  
**Parent:** [Knowledge Cloud](./KNOWLEDGE_CLOUD.md)  
**Rule:** Search across org/workspace-scoped Knowledge Base chunks. Extends VL-062 + Vector Cloud. Do **not** invent Elastic/OpenSearch/BM25 OS, image search, or voice search.

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/enterprise-search` |
| Engine | `GET /v1/enterprise-search/engine` |
| Modes | `GET /v1/enterprise-search/modes` |
| Search | `POST /v1/enterprise-search/search` `{ query, mode?, k?, collection?, tag?, contentKind?, documentId? }` |
| Suggest | `GET /v1/enterprise-search/suggest?q=` |
| Analytics / monitoring | `GET /v1/enterprise-search/analytics` · `/monitoring` |
| GraphQL | `enterpriseSearchEngine` |
| SDK / CLI | `enterpriseSearchEngine()` · `enterpriseSearch()` · `verbalab enterprise-search` |

## Modes

| Mode | Behavior |
| --- | --- |
| `keyword` | Case-insensitive substring match on `knowledge_chunks.content` |
| `semantic` | pgvector cosine via `KnowledgeService.searchVectors` (VL-182) |
| `hybrid` | Light reciprocal-rank fusion of keyword + semantic (**not** BM25 parity) |

All paths require **organizationId + workspaceId**.

## Honesty

| Flag | Value |
| --- | --- |
| `elasticOs` | false |
| `openSearchParity` | false |
| `bm25Parity` | false |
| `imageSearch` | false |
| `voiceSearch` | false |
| `orgWorkspaceScoped` | true |
| `extendsVl062` | true |
| `extendsVectorCloud` | true |

See ADR-0106.
