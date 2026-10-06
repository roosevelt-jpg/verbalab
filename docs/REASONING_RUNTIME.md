# VerbaLab Reasoning Runtime

**Status:** Partial shipped (VL-218 / library Phase 85)  
**Rule:** Kernel reasoning over VL-186 Reasoning Cloud. Extends — does **not** regenerate — Reasoning Cloud. Not a custom reasoner kernel, symbolic reasoner OS, or tool-execution agent OS.

Part of the internal [AI Kernel](./AI_KERNEL.md) (Volume 8). Roadmap: [`docs/roadmap/volume8-ai-kernel/`](./roadmap/volume8-ai-kernel/).

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Reasoning Graphs | **Partial** — `strategy=graph_reasoning` via Reasoning Cloud |
| Tree of Thought | **Partial** — shallow 2-branch ToT |
| Planning | **Shipped** — plan façade (+ sandbox stub) |
| Reflection | **Partial** — heuristic critiques |
| Tool Selection | **Partial** — catalog suggestion; no execution |
| Model Selection | **Partial** — AI Router resolve |
| Decision Trees | **Partial** — Decision Engine façade |
| Self Evaluation | **Partial** — heuristic score |
| Confidence | **Shipped** — blended heuristic + Decision Engine |
| Reasoning History / Replay | **Shipped / Partial** — kernel MemoryRecords |
| Engine / Console | `/reasoning-runtime` + `GET /v1/reasoning-runtime/engine` |
| GraphQL / SDK / CLI | `reasoningRuntimeEngine`, `verbalab reasoning-runtime-engine` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/reasoning-runtime` |
| REST engine | `GET /v1/reasoning-runtime/engine` |
| Reason / plan / reflect | `POST /v1/reasoning-runtime/reason\|plan\|reflect` |
| Select tools / model | `POST /v1/reasoning-runtime/select-tools\|select-model` |
| Decision tree / evaluate / confidence | `POST …/decision-tree\|evaluate\|confidence` |
| History / replay | `GET /v1/reasoning-runtime/history[/:id]` |
| GraphQL | `reasoningRuntimeEngine` |
| SDK | `reasoningRuntimeEngine()`, `reasoningRuntimePlan()` |
| CLI | `verbalab reasoning-runtime-engine` |

## Honesty

| Flag | Value |
| --- | --- |
| `customReasonerKernel` | false |
| `symbolicReasonerOs` | false |
| `toolExecution` | false |
| `agentOs` | false |
| `llmAsJudgeEvalLab` | false |
| `regeneratesReasoningCloud` | false |
| `extendsReasoningCloud` | true |

Env: `VERBALAB_REASONING_RUNTIME_MODE`, `VERBALAB_REASONING_RUNTIME_MAX_HISTORY`.

See ADR-0129.
