# Lugemi Context Fabric

**Status:** Shipped (VL-241 / library Phase 108)  
**Rule:** Context Fabric is the **internal** cross-cloud context router over Context Runtime — **not** an infinite context window, WebSocket OS, or customer-facing product. Extends AI Fabric + Context Runtime. Do **not** regenerate Volumes 1–9 or VL-217/VL-185. Roadmap: [`docs/roadmap/volume10-ai-fabric/`](./roadmap/volume10-ai-fabric/).

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Context Fabric | **VL-241** — `/context-fabric` |
| User / Workspace / Conversation / Language / Project / Knowledge / Model Context | **Shipped** via Context Runtime assemble include map |
| Agent Context | **Partial** — discovery to Agent Runtime; Agent Fabric VL-246 |
| Context Router | **Shipped** — `POST /v1/context-fabric/route` |
| Realtime APIs | **Partial** — SSE ticks + optional Event Fabric CloudEvents |
| REST / SDK / Monitoring / Docs | **Shipped** |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console (internal) | `/context-fabric` |
| REST catalog | `GET /v1/context-fabric/products` |
| Routes | `GET /v1/context-fabric/routes` |
| Router plan | `POST /v1/context-fabric/route` |
| Propagate | `POST /v1/context-fabric/propagate` (auth) |
| Realtime SSE | `GET /v1/context-fabric/stream` |
| Monitoring / overview | `GET /v1/context-fabric/monitoring`, `/overview` |
| GraphQL | `contextFabricCapabilities`, `contextFabricRoutes` |
| SDK | `contextFabricProducts()`, `contextFabricRoute()`, `contextFabricPropagate()` |
| CLI | `lugemi context-fabric-products` |

## Action safety

1. **Policy Fabric (VL-247)** — must hard-gate across fabric buses, not log-only.
2. Until then, **Policy Runtime** hard-gates Agent/Workflow/Plugin.

## Honesty

| Flag | Value |
| --- | --- |
| `customerFacingProduct` | false |
| `infiniteContextWindow` | false |
| `websocketOs` | false |
| `regeneratesContextRuntime` | false |
| `optionalEventFabricPropagation` | true |
| `fabricWidePolicyHardGateRequired` | true |

See ADR-0143.
