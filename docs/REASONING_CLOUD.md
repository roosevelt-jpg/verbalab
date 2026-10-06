# Lugemi Reasoning Cloud

**Status:** Partial shipped (VL-186 / library Phase 53)  
**Rule:** Multi-step reasoning via LLM gateway prompts. Do **not** invent a custom reasoner kernel or symbolic reasoner OS.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Chain of Thought | **Shipped** — `strategy=chain_of_thought` |
| Tree of Thought | **Partial** — 2 branches + pick (not full ToT research) |
| Graph Reasoning | **Partial** — KG neighborhood injected into prompt |
| Multilingual Reasoning | **Shipped** — optional `language` hint |
| Planning / Decision / Problem Solving | **Shipped** — prompt strategies |
| Tool Selection | **Partial** — suggests catalog tools; no execution |
| Knowledge Retrieval | **Shipped** — Context Engine assemble when `retrieve=true` |
| Agent Reasoning | **Partial** — single-shot agent prompt; agent OS deferred |
| Engine / Dashboard | **VL-186** — `GET /v1/reasoning-cloud/engine` + `/reasoning-cloud` |
| GraphQL / SDK / CLI | `reasoningCloudEngine`, `lugemi reasoning-cloud-reason` |

---

## Honesty

Not a custom reasoner kernel and not a proprietary symbolic reasoner. Live reason needs `OPENAI_API_KEY` (or configured chat provider). See ADR-0097.
