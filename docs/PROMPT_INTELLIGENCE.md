# Lugemi Prompt Intelligence

**Status:** Partial shipped (VL-188 / library Phase 55)  
**Rule:** Extend existing versioned prompts (VL-086). Do **not** invent an auto-prompt research lab, evolutionary optimizer, or LLM-as-judge evaluation OS.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Prompt Registry | **Shipped** — `GET /v1/prompt-intelligence/registry` |
| Prompt Versioning | **Shipped** — `/v1/prompts/*` (ADR-0030) |
| Prompt Testing | **Partial** — preview/resolve without LLM call |
| Prompt Evaluation | **Partial** — heuristic score/findings |
| Prompt Marketplace | **Partial** — marketplace `kind=prompt` (VL-091) |
| Prompt Security | **Partial** — pattern scan (injection/secrets) |
| Prompt Analytics | **Shipped** — audit aggregates |
| Prompt Optimization | **Deferred** — auto-prompt research lab |
| Prompt Approval | **Partial** — admin activate as approval proxy |
| Engine / Dashboard | **VL-188** — `GET /v1/prompt-intelligence/engine` + `/prompt-intelligence` |
| GraphQL / SDK / CLI | `promptIntelligence`, `lugemi prompt-intelligence` |

---

## Honesty

Not a prompt research lab. See ADR-0099. Manage bodies at `/prompts`.
