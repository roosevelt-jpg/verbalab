# Lugemi Workflow Marketplace

**Status:** Shipped (VL-255 / library Phase 122)  
**Rule:** Extends Workflow Runtime (VL-220) + listings `kind=workflow` — **not** Zapier / Temporal / Airflow OS. Third-party workflows run only through Workflow Runtime sandbox + WorkflowPolicyGate + Policy Fabric hard gate. Real-money honesty: Stripe (or equivalent); `storesRawCardData: false`. Roadmap: [`docs/roadmap/volume11-ecosystem-cloud/`](./roadmap/volume11-ecosystem-cloud/).

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Automation / Workflow Templates | **Shipped** — `category` |
| Industry / Business Packs | **Shipped** |
| AI Chains / Approval / Scheduling | **Shipped** — sandboxed stubs |
| Marketplace REST / SDK / Dashboard / Monitoring / Docs | **Shipped** |
| Live open step execution | **Forbidden** |
| Zapier / Temporal / Airflow OS | **Forbidden** |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/workflow-marketplace` |
| REST engine | `GET /v1/workflow-marketplace/engine` |
| Listings | `GET/POST /v1/workflow-marketplace/listings` |
| Install | `POST /v1/workflow-marketplace/listings/:id/install` |
| Run | `POST /v1/workflow-marketplace/listings/:id/run` |
| Reviews / sales / analytics | under `/v1/workflow-marketplace/*` |
| GraphQL | `workflowMarketplaceEngine` |
| SDK | `workflowMarketplaceEngine()` |
| CLI | `lugemi workflow-marketplace-engine` |

## Run path (must stay enforced)

1. FabricPolicyGate (`workflow-marketplace` / `marketplace.invoke`)
2. Workflow Runtime `run` (sandbox mode) — or Policy probe for denied actions
3. WorkflowPolicyGate hard allowlist + Policy Runtime hard gate
4. Denied actions (`shell.exec`, `workflow.execute_live`, …) → 403 / run `denied`

## Honesty

| Flag | Value |
| --- | --- |
| `sandboxRequired` | true |
| `liveStepExecution` | false |
| `workflowPolicyHardGateRequired` | true |
| `fabricPolicyHardGateRequired` | true |
| `zapierOs` | false |
| `temporalOs` | false |
| `airflowOs` | false |
| `storesRawCardData` | false |
| `stripeOrEquivalentRequired` | true |

See ADR-0157. Workflow Runtime: VL-220. Agent Marketplace pattern: VL-254.
