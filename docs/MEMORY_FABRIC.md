# Lugemi Memory Fabric

**Status:** Shipped (VL-245 / library Phase 112)  
**Rule:** Memory Fabric is the **internal** memory router over Memory Runtime — **not** Mem0, multi-region replication OS, infinite personalization OS, or a customer-facing product. Extends AI Fabric + Memory Runtime. Do **not** regenerate Volumes 1–9 or VL-215 / VL-183. Roadmap: [`docs/roadmap/volume10-ai-fabric/`](./roadmap/volume10-ai-fabric/).

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Memory Fabric | **VL-245** — `/memory-fabric` |
| Memory Router | **Shipped** — `POST /route` |
| Memory Synchronization | **Shipped** — Runtime sync façade |
| Memory Replication | **Partial** — same-org plan only |
| Memory Federation | **Partial** — product-handoff catalog |
| Memory Distribution | **Shipped** — same-org plans + optional Event Fabric |
| Short / Long-term / Workspace Memory | **Shipped** — Runtime handoffs |
| REST / GraphQL / SDK / Monitoring / Docs | **Shipped** |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/memory-fabric` |
| REST catalog | `GET /v1/memory-fabric/products` |
| Routes / pipeline / versions / cache / federate | `GET|POST` under `/v1/memory-fabric/*` |
| Sync / list / search | `POST /sync`, `GET /memories`, `POST /search` |
| Replicate / Distribute | `POST /replicate`, `POST /distribute` |
| GraphQL | `memoryFabricCapabilities`, `memoryFabricRoutes` |
| SDK / CLI | `memoryFabricProducts()`, `lugemi memory-fabric-products` |

## Action safety

1. **Policy Fabric (VL-247)** — must hard-gate across fabric buses, not log-only.
2. Until then, **Policy Runtime** hard-gates Agent/Workflow/Plugin.

## Honesty

| Flag | Value |
| --- | --- |
| `customerFacingProduct` | false |
| `mem0Os` | false |
| `multiRegionReplicationOs` | false |
| `regeneratesMemoryRuntime` | false |
| `crossWorkspaceSameOrgOnly` | true |
| `fabricWidePolicyHardGateRequired` | true |

See ADR-0147.
