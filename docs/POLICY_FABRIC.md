# Lugemi Policy Fabric

**Status:** Shipped (VL-247 / library Phase 114)  
**Rule:** Policy Fabric is the **fabric-wide hard gate** over Policy Runtime — **not** log-only, not OPA/Cedar enterprise policy OS, not a GRC suite, and not a customer-facing product. Extends AI Fabric + Policy Runtime. Do **not** regenerate Volumes 1–9 or VL-222. Roadmap: [`docs/roadmap/volume10-ai-fabric/`](./roadmap/volume10-ai-fabric/).

Volume 10 README: Policy Fabric must **enforce** across buses, not only log violations.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Policy Fabric | **VL-247** — `/policy-fabric` |
| Policy Engine | **Shipped** — `POST /assert` hard gate (403 on deny) |
| Policy Synchronization / Distribution | **Shipped** — same-org plans (gated) |
| Policy Federation | **Partial** — product-handoff catalog |
| Security / Compliance / Billing / Org Policies | **Shipped/Partial** — Policy Runtime handoffs |
| REST / GraphQL / SDK / Monitoring / Docs | **Shipped** |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/policy-fabric` |
| REST catalog | `GET /v1/policy-fabric/products` |
| Routes / pipeline / versions / federate | `GET|POST` under `/v1/policy-fabric/*` |
| Evaluate / Assert | `POST /evaluate`, `POST /assert` |
| Sync / Distribute | `POST /sync`, `POST /distribute` (hard-gated) |
| GraphQL | `policyFabricCapabilities`, `policyFabricRoutes` |
| SDK / CLI | `policyFabricProducts()`, `lugemi policy-fabric-products` |
| Gate | `FabricPolicyGate` — wired into Agent/Memory/Policy Fabric distribute |

## Action safety

1. **Hard gate** — denies return **403**. Log-only is forbidden (`logOnlyMode: false`).
2. **FabricPolicyGate** blocks `FABRIC_GLOBAL_DENIES` and delegates to Policy Runtime `assertHardGate`.
3. Agent/Workflow/Plugin remain gated by Policy Runtime gates.

## Honesty

| Flag | Value |
| --- | --- |
| `hardGate` | true |
| `logOnlyMode` | false |
| `opaCedarOs` / `grcOs` | false |
| `regeneratesPolicyRuntime` | false |
| `wiredIntoFabricDistribute` | true |
| `fabricWidePolicyHardGateRequired` | true |

See ADR-0149.
