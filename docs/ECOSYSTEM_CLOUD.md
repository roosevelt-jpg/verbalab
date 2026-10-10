# Lugemi Ecosystem Cloud

**Status:** Volume closed (VL-249–259 / library Phases 116–126) — audit pack under [`docs/ecosystem-cloud-audit/`](./ecosystem-cloud-audit/)  
**Rule:** Ecosystem Cloud is the **marketplace + monetization hub** over existing VL-090+ content marketplace and voice marketplace — **not** a payment-processor OS, card vault, or regenerate of Volumes 1–10. Roadmap: [`docs/roadmap/volume11-ecosystem-cloud/`](./roadmap/volume11-ecosystem-cloud/).

Volume 11 README: this is a **real-money** volume (payments, licensing, royalty payouts). Use an established processor (Stripe, etc.); never store raw card data. Plugin/Agent marketplaces must enforce Volume 8 sandboxes + Policy hard-gate before third-party code runs. Creator Economy payout math must be hand-checked before live creators.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Ecosystem Foundation | **VL-249** — `/ecosystem-cloud` + product catalog / routing |
| Plugin Marketplace | **Shipped** — VL-250 — [`PLUGIN_MARKETPLACE.md`](./PLUGIN_MARKETPLACE.md); sandbox + Policy required |
| Model Marketplace | **Shipped** — VL-251 — [`MODEL_MARKETPLACE.md`](./MODEL_MARKETPLACE.md) |
| Dataset Marketplace | **Shipped** — VL-252 — [`DATASET_MARKETPLACE.md`](./DATASET_MARKETPLACE.md) |
| Prompt Marketplace | **Shipped** — VL-253 — [`PROMPT_MARKETPLACE.md`](./PROMPT_MARKETPLACE.md) |
| Agent Marketplace | **Shipped** — VL-254 — [`AGENT_MARKETPLACE.md`](./AGENT_MARKETPLACE.md); sandbox + Policy required |
| Workflow Marketplace | **Shipped** — VL-255 — [`WORKFLOW_MARKETPLACE.md`](./WORKFLOW_MARKETPLACE.md); sandbox + Policy required |
| Connector Marketplace | **Shipped** — VL-256 — [`CONNECTOR_MARKETPLACE.md`](./CONNECTOR_MARKETPLACE.md); entitlement SKUs, not iPaaS |
| Voice & Language Marketplace | **Shipped** — VL-257 — [`VOICE_LANGUAGE_MARKETPLACE.md`](./VOICE_LANGUAGE_MARKETPLACE.md); extends VL-177 + Volume 1 packs |
| Creator Economy | **Shipped** — VL-258 — [`CREATOR_ECONOMY.md`](./CREATOR_ECONOMY.md); tax/dispute remain documented gaps |
| Content Marketplace (prior) | **Shipped** — VL-090–092 `/marketplace` |
| Voice Marketplace (prior) | **Shipped** — VL-177 `/voice-marketplace` |
| Production Audit | **Shipped** — VL-259 — [`docs/ecosystem-cloud-audit/`](./ecosystem-cloud-audit/) |
| DDD / CQRS / Hexagonal | Bounded catalog CQRS slice — `hexagonalRewrite: false` |
| Terraform / Kubernetes | Shared platform — Fly default; optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/ecosystem-cloud` |
| REST catalog | `GET /v1/ecosystem-cloud/products` (public) |
| REST engine | `GET /v1/ecosystem-cloud/engine` |
| REST routing | `GET /v1/ecosystem-cloud/routing` |
| REST overview | `GET /v1/ecosystem-cloud/overview` (Clerk session) |
| Monitoring | `GET /v1/ecosystem-cloud/monitoring` |
| GraphQL | `ecosystemProducts` |
| SDK | `ecosystemCloudProducts()` |
| CLI | `lugemi ecosystem-cloud-products` |

## Action safety (README)

1. **Payments** — Stripe (or equivalent) only; `storesRawCardData: false`.
2. **Plugin / Agent marketplaces** — Volume 8 Plugin/Agent Runtime sandbox + Policy Fabric hard-gate before third-party code executes for other users.
3. **Creator Economy** — hand-check payout math; tax/dispute/1099 coverage must be explicit gaps until documented.

## Honesty

| Flag | Value |
| --- | --- |
| `paymentProcessorOs` | false |
| `storesRawCardData` | false |
| `stripeOrEquivalentRequired` | true |
| `regeneratesVolumes1to10` | false |
| `regeneratesMarketplaceVl090` | false |
| `pluginAgentSandboxRequired` | true |
| `taxHandlingComplete` | false |
| `disputeChargebackComplete` | false |
| `realMoneyRiskCategory` | true |

See ADR-0151. Existing marketplaces: [`VOICE_MARKETPLACE.md`](./VOICE_MARKETPLACE.md), VL-090–092 ADRs 0031–0033.
