# Lugemi Knowledge Fabric

**Status:** Shipped (VL-242 / library Phase 109)  
**Rule:** Knowledge Fabric is the **internal** knowledge router over Knowledge Cloud — **not** Confluence/SharePoint, Neo4j federation, Elastic, or a customer-facing product. Extends AI Fabric + Knowledge Cloud. Do **not** regenerate Volumes 1–9 or VL-193–202 / VL-062. Roadmap: [`docs/roadmap/volume10-ai-fabric/`](./roadmap/volume10-ai-fabric/).

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Knowledge Fabric | **VL-242** — `/knowledge-fabric` |
| Knowledge Router / Routing | **Shipped** — `POST /route`, `GET /routes` |
| Knowledge Distribution | **Shipped** — same-org plans + optional Event Fabric |
| Knowledge Synchronization | **Shipped** — same-org workspace sync cursors |
| Knowledge Federation | **Partial** — product-handoff catalog, not cross-tenant mesh |
| Cross Workspace Knowledge | **Shipped** — same organization peers only |
| Enterprise Search Integration | **Shipped** — discovery handoff to VL-195 |
| REST / SDK / Monitoring / Docs | **Shipped** |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console (internal) | `/knowledge-fabric` |
| REST catalog | `GET /v1/knowledge-fabric/products` |
| Routes / router | `GET /routes`, `POST /route` |
| Distribute / sync / federate | `POST /distribute`, `/sync`, `/federate` |
| Monitoring / overview | `GET /monitoring`, `/overview` |
| GraphQL | `knowledgeFabricCapabilities`, `knowledgeFabricRoutes` |
| SDK / CLI | `knowledgeFabricProducts()`, `lugemi knowledge-fabric-products` |

## Action safety

1. **Policy Fabric (VL-247)** — must hard-gate across fabric buses, not log-only.
2. Cross-workspace ops are **same-organization only** (`crossOrgDataPlane: false`).

## Honesty

| Flag | Value |
| --- | --- |
| `customerFacingProduct` | false |
| `confluenceSharepointOs` | false |
| `neo4jFederationOs` | false |
| `regeneratesKnowledgeCloud` | false |
| `crossWorkspaceSameOrgOnly` | true |
| `fabricWidePolicyHardGateRequired` | true |

See ADR-0144.
