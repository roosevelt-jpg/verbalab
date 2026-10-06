# VerbaLab Context Engine

**Status:** Partial shipped (VL-185 / library Phase 52)  
**Rule:** Assemble retrieval + memory + prompt context for AI requests. Do not claim infinite context windows. Compression is char-budget truncation, not LLM summarization.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Conversation / Document / Org / Project / Language / User / Workspace / Historical Context | **Shipped** — `POST /v1/context-engine/assemble` sources |
| Context Retrieval | **Shipped** — multi-source → `promptContext` |
| Context Compression | **Partial** — priority char budget; LLM summarization deferred |
| Realtime APIs | **Deferred** |
| Engine / Dashboard | **VL-185** — `GET /v1/context-engine/engine` + `/context-engine` |
| GraphQL / SDK / CLI | `contextEngine`, `verbalab context-engine` / `context-assemble` |
| Related | Vector Cloud, Memory Cloud, Knowledge Graph, Prompts |

---

## Honesty

Not an infinite context product. See ADR-0096. Document retrieval needs embeddings (live: `OPENAI_API_KEY`).
