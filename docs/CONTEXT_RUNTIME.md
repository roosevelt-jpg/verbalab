# Lugemi Context Runtime

**Status:** Partial shipped (VL-217 / library Phase 84)  
**Rule:** Kernel context assembly over VL-185 Context Engine. Extends — does **not** regenerate — Context Engine. Not an infinite context window, LLM summarization OS, or realtime push bus.

Part of the internal [AI Kernel](./AI_KERNEL.md) (Volume 8). Roadmap: [`docs/roadmap/volume8-ai-kernel/`](./roadmap/volume8-ai-kernel/).

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Conversation / Workspace / Org / Project / User / Language | **Shipped** — via Context Engine assemble |
| Knowledge Context | **Shipped** — documents + KG (`include.knowledge` alias) |
| Model Context | **Partial** — sandbox model/provider hint block |
| Context Prioritization | **Shipped** — `POST /prioritize` + assemble overrides |
| Context Compression | **Partial** — char-budget truncation |
| Context Retrieval | **Shipped** — `POST /retrieve` façade |
| Realtime APIs | **Deferred** |
| Engine / Console | `/context-runtime` + `GET /v1/context-runtime/engine` |
| GraphQL / SDK / CLI | `contextRuntimeEngine`, `lugemi context-runtime-engine` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/context-runtime` |
| REST engine | `GET /v1/context-runtime/engine` |
| Assemble / retrieve | `POST /v1/context-runtime/assemble\|retrieve` |
| Prioritize / compress | `POST /v1/context-runtime/prioritize\|compress` |
| Analytics / monitoring | `GET /v1/context-runtime/analytics\|monitoring` |
| GraphQL | `contextRuntimeEngine` |
| SDK | `contextRuntimeEngine()`, `contextRuntimeAssemble()` |
| CLI | `lugemi context-runtime-engine` |

## Honesty

| Flag | Value |
| --- | --- |
| `infiniteContextWindow` | false |
| `llmSummarization` | false |
| `realtimePush` | false |
| `regeneratesContextEngine` | false |
| `extendsContextEngine` | true |
| `usesIntelligentCacheContextNamespace` | true |
| `modelRouterOs` | false |

Env: `LUGEMI_CONTEXT_RUNTIME_MODE`, `LUGEMI_CONTEXT_RUNTIME_MAX_CHARS`, `LUGEMI_CONTEXT_RUNTIME_CACHE_TTL_SEC`.

See ADR-0128.
