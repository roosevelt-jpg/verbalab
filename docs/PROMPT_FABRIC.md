# Lugemi Prompt Fabric

**Status:** Shipped (VL-243 / library Phase 110)  
**Rule:** Prompt Fabric is the **internal** prompt router over Prompt Runtime — **not** a prompt mesh, auto-prompt research lab, LLM-as-judge, or customer-facing product. Extends AI Fabric + Prompt Runtime. Do **not** regenerate Volumes 1–9 or VL-216 / VL-086 / VL-188. Roadmap: [`docs/roadmap/volume10-ai-fabric/`](./roadmap/volume10-ai-fabric/).

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Prompt Fabric / Prompt Platform | **VL-243** — `/prompt-fabric` |
| Prompt Routing | **Shipped** — fabric routes + Prompt Runtime feature→key |
| Prompt Versioning | **Shipped** — façade over Prompt Runtime / VL-086 |
| Prompt Synchronization / Distribution | **Shipped** — same-org plans + optional Event Fabric |
| Prompt Validation | **Shipped** — delegates to Prompt Runtime validate |
| Prompt Policies | **Partial** — Policy Runtime today; Policy Fabric VL-247 |
| REST / SDK / Dashboard / Monitoring / Docs | **Shipped** |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console (dashboard) | `/prompt-fabric` |
| REST catalog | `GET /v1/prompt-fabric/products` |
| Routes / router | `GET /routes`, `POST /route` |
| Versions / validate / policies | `GET /versions`, `POST /validate`, `GET /policies` |
| Distribute / sync | `POST /distribute`, `/sync` |
| Monitoring / overview | `GET /monitoring`, `/overview` |
| GraphQL | `promptFabricCapabilities`, `promptFabricRoutes` |
| SDK / CLI | `promptFabricProducts()`, `lugemi prompt-fabric-products` |

## Action safety

1. **Policy Fabric (VL-247)** — must hard-gate across fabric buses, not log-only.
2. Until then, **Policy Runtime** hard-gates Agent/Workflow/Plugin; prompt policies are discovery + that gate.

## Honesty

| Flag | Value |
| --- | --- |
| `customerFacingProduct` | false |
| `promptMeshOs` | false |
| `autoPromptResearchLab` | false |
| `regeneratesPromptRuntime` | false |
| `crossWorkspaceSameOrgOnly` | true |
| `fabricWidePolicyHardGateRequired` | true |

See ADR-0145.
