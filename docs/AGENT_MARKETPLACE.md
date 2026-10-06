# Lugemi Agent Marketplace

**Status:** Shipped (VL-254 / library Phase 121)  
**Rule:** Extends Agent Runtime (VL-219) + listings `kind=agent` — **not** LangGraph / AutoGPT OS. Third-party agents run only through Agent Runtime sandbox + AgentPolicyGate + Policy Fabric hard gate. Real-money honesty: Stripe (or equivalent); `storesRawCardData: false`. Roadmap: [`docs/roadmap/volume11-ecosystem-cloud/`](./roadmap/volume11-ecosystem-cloud/).

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Business / Healthcare / Government / Legal / Financial / Education / Voice / Sales / Support / Research | **Shipped** — `category` |
| Marketplace publish/install/run | **Shipped** — sandboxed |
| Monitoring / Analytics | **Shipped** / **Partial** |
| GraphQL / SDK / REST / Docs | **Shipped** |
| Live open tool execution | **Forbidden** |
| LangGraph / AutoGPT OS | **Forbidden** |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/agent-marketplace` |
| REST engine | `GET /v1/agent-marketplace/engine` |
| Listings | `GET/POST /v1/agent-marketplace/listings` |
| Install | `POST /v1/agent-marketplace/listings/:id/install` |
| Run | `POST /v1/agent-marketplace/listings/:id/run` |
| Reviews / sales / analytics | under `/v1/agent-marketplace/*` |
| GraphQL | `agentMarketplaceEngine` |
| SDK | `agentMarketplaceEngine()` |
| CLI | `lugemi agent-marketplace-engine` |

## Run path (must stay enforced)

1. FabricPolicyGate (`agent-marketplace` / `marketplace.invoke`)
2. Agent Runtime `run` (sandbox mode)
3. AgentPolicyGate hard allowlist + Policy Runtime hard gate
4. Denied actions (`shell.exec`, `external.execute`, …) → 403 / run `denied`

## Honesty

| Flag | Value |
| --- | --- |
| `sandboxRequired` | true |
| `liveToolExecution` | false |
| `agentPolicyHardGateRequired` | true |
| `fabricPolicyHardGateRequired` | true |
| `langGraphOs` | false |
| `autoGptOs` | false |
| `storesRawCardData` | false |
| `stripeOrEquivalentRequired` | true |

See ADR-0156. Agent Runtime: VL-219. Plugin Marketplace pattern: VL-250.
