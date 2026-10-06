# VerbaLab Reasoning Fabric

**Status:** Shipped (VL-244 / library Phase 111)  
**Rule:** Reasoning Fabric is the **internal** reasoning router over Reasoning Runtime — **not** a custom reasoner kernel, symbolic reasoner OS, tool-execution agent OS, or customer-facing product. Extends AI Fabric + Reasoning Runtime. Do **not** regenerate Volumes 1–9 or VL-218 / VL-186. Roadmap: [`docs/roadmap/volume10-ai-fabric/`](./roadmap/volume10-ai-fabric/).

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Reasoning Fabric | **VL-244** — `/reasoning-fabric` |
| Reasoning Router | **Shipped** — `POST /route` |
| Reasoning Pipelines | **Shipped** — ordered Runtime handoff plans |
| Reasoning Replay / Versioning | **Shipped** — Runtime history façade + fabric version catalog |
| Reasoning Distribution | **Shipped** — same-org plans + optional Event Fabric |
| Reasoning Cache | **Partial** — Intelligent Cache discovery |
| Reasoning Federation | **Partial** — product-handoff catalog |
| REST / GraphQL / SDK / Monitoring / Docs | **Shipped** |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/reasoning-fabric` |
| REST catalog | `GET /v1/reasoning-fabric/products` |
| Routes / pipeline / versions / cache / federate | `GET|POST` under `/v1/reasoning-fabric/*` |
| History / replay | `GET /history`, `GET /replay/:id` |
| Distribute | `POST /distribute` |
| GraphQL | `reasoningFabricCapabilities`, `reasoningFabricRoutes` |
| SDK / CLI | `reasoningFabricProducts()`, `verbalab reasoning-fabric-products` |

## Action safety

1. **Policy Fabric (VL-247)** — must hard-gate across fabric buses, not log-only.
2. Until then, **Policy Runtime** hard-gates Agent/Workflow/Plugin.

## Honesty

| Flag | Value |
| --- | --- |
| `customerFacingProduct` | false |
| `customReasonerOs` | false |
| `regeneratesReasoningRuntime` | false |
| `crossWorkspaceSameOrgOnly` | true |
| `fabricWidePolicyHardGateRequired` | true |

See ADR-0146.
