# Lugemi Prompt Runtime

**Status:** Partial shipped (VL-216 / library Phase 83)  
**Rule:** Kernel prompt execution over VL-086 versioned prompts + VL-188 Prompt Intelligence. Extends — does **not** regenerate — those hubs. Not an auto-prompt research lab, LLM-as-judge, or prompt mesh OS. `execute` does **not** call an LLM.

Part of the internal [AI Kernel](./AI_KERNEL.md) (Volume 8). Roadmap: [`docs/roadmap/volume8-ai-kernel/`](./roadmap/volume8-ai-kernel/).

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Prompt Execution | **Shipped** — resolve + `{{var}}` render + validate (+ optional cache) |
| Prompt Templates | **Shipped** — chat/rag/voice_faq over VL-086 |
| Prompt Variables | **Shipped** — `POST /v1/prompt-runtime/render` |
| Prompt Routing | **Partial** — sandbox feature→key table |
| Prompt Versioning | **Shipped** — façade over VL-086 versions |
| Prompt Optimization | **Partial** — heuristic trim/tips |
| Prompt Security | **Partial** — Prompt Intelligence pattern scan |
| Prompt Validation | **Shipped** — length/empty/placeholder checks |
| Prompt Cache | **Partial** — Intelligent Cache `namespace=prompt` |
| Prompt Analytics | **Shipped** — audit aggregates |
| Prompt Registry Integration | **Shipped** — reads VL-086/188 registry |
| Engine / Console | `/prompt-runtime` + `GET /v1/prompt-runtime/engine` |
| GraphQL / SDK / CLI | `promptRuntimeEngine`, `lugemi prompt-runtime-engine` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/prompt-runtime` |
| REST engine | `GET /v1/prompt-runtime/engine` |
| Execute | `POST /v1/prompt-runtime/execute` |
| Render / validate / optimize / security | `POST /v1/prompt-runtime/render\|validate\|optimize\|security-scan` |
| Templates / registry / versions | `GET /v1/prompt-runtime/templates\|registry\|versions` |
| Analytics / monitoring | `GET /v1/prompt-runtime/analytics\|monitoring` |
| GraphQL | `promptRuntimeEngine` |
| SDK | `promptRuntimeEngine()`, `promptRuntimeExecute()` |
| CLI | `lugemi prompt-runtime-engine` |

## Honesty

| Flag | Value |
| --- | --- |
| `autoPromptResearchLab` | false |
| `llmAsJudgeEvalLab` | false |
| `promptMeshOs` | false |
| `redisPromptCacheOs` | false |
| `callsLlmOnExecute` | false |
| `regeneratesPromptIntelligence` | false |
| `extendsPromptIntelligence` | true |
| `extendsVersionedPrompts` | true |
| `usesIntelligentCachePromptNamespace` | true |

Env: `LUGEMI_PROMPT_RUNTIME_MODE`, `LUGEMI_PROMPT_RUNTIME_MAX_CHARS`, `LUGEMI_PROMPT_RUNTIME_CACHE_TTL_SEC`.

See ADR-0127.
