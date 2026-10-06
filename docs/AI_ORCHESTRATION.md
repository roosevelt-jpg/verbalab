# VerbaLab AI Orchestration

**Status:** Partial shipped (VL-190 / library Phase 57)  
**Rule:** Load-bearing orchestration that coordinates the AI Gateway and engines with **real e2e requests**. Do **not** invent a multi-cloud agent OS, LangGraph OS, or distributed AI fabric.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Multi Model Execution | **Partial** — `pipeline=model_chain` sequential chat calls |
| Multi Cloud Routing | **Deferred** |
| Workflow Orchestration | **Shipped** — named pipelines + VL-083 `/workflows` |
| Agent Collaboration | **Deferred** |
| Tool Chaining | **Shipped** — `pipeline=tool_chain` allowlisted ops |
| Model Chaining | **Partial** — draft→refine chat |
| Pipeline Execution | **Shipped** — `POST /v1/ai-orchestration/run` |
| Distributed AI | **Deferred** |
| Engine / Dashboard | **VL-190** — `GET /v1/ai-orchestration/engine` + `/ai-orchestration` |
| GraphQL / SDK / CLI | `aiOrchestration`, `verbalab ai-orchestration-run` |

---

## Honesty

Not Temporal/LangGraph/multi-cloud agents. See ADR-0101. Pipelines call Translate/Chat/Gateway/Decision/Context for real.
