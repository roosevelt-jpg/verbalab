# VerbaLab Knowledge Memory

**Status:** Partial (VL-199 / library Phase 66)  
**Parent:** [Knowledge Cloud](./KNOWLEDGE_CLOUD.md)  
**Rule:** Persistent knowledge-layer memory for Knowledge Cloud. Extends [Memory Cloud](./MEMORY_CLOUD.md) (VL-183) storage with `metadata.layer=knowledge`. Do **not** regenerate Memory Cloud or invent Mem0/Zep OS.

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/knowledge-memory` |
| Engine | `GET /v1/knowledge-memory/engine` |
| Scopes | `GET /v1/knowledge-memory/scopes` |
| Memories | `GET/POST /v1/knowledge-memory/memories` |
| Evolve | `POST /v1/knowledge-memory/memories/:id/evolve` |
| Versions | `GET /v1/knowledge-memory/memories/:id/versions` |
| Search | `POST /v1/knowledge-memory/search` |
| Analytics / monitoring | `GET /v1/knowledge-memory/analytics` · `/monitoring` |
| GraphQL | `knowledgeMemoryEngine` |
| SDK / CLI | `knowledgeMemoryEngine()` · `verbalab knowledge-memory-engine` |
| GDPR | Via Memory Cloud `export` / `erase` (same rows) |

## Scopes → Memory Cloud

| Knowledge Memory | Memory Cloud |
| --- | --- |
| `organization` | `scope=organization` |
| `workspace` | `scope=workspace` |
| `user` | `scope=workspace` + `subjectUserId` |
| `conversation` | `scope=conversation` + `conversationId` |
| `ai` | `scope=workspace` or `agent` |

Optional `documentId` links a Knowledge Document (org/workspace scoped). All writes are workspace-scoped.

## Honesty

| Flag | Value |
| --- | --- |
| `mem0Os` | false |
| `zepParity` | false |
| `infinitePersonalizationOs` | false |
| `regeneratesMemoryCloud` | false |
| `extendsVl183` | true |
| `distinctFromMemoryCloud` | true |
| `orgWorkspaceScoped` | true |
| `gdprViaMemoryCloud` | true |

See ADR-0110.
