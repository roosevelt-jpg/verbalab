# Lugemi Connector Marketplace

**Status:** Shipped (VL-256 / library Phase 123)  
**Rule:** Entitlement SKUs over the built-in connector catalog + Slack (ADR-0026) — **not** iPaaS, MuleSoft, or iPaaS OS. Real-money honesty: Stripe (or equivalent); `storesRawCardData: false`. Install never opens live arbitrary outbound. Roadmap: [`docs/roadmap/volume11-ecosystem-cloud/`](./roadmap/volume11-ecosystem-cloud/).

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| CRM / ERP / HR / Finance / Healthcare / Government / Cloud / Identity / Email / Telephony / Payments | **Shipped** — `category` + catalog keys |
| Connector Security | **Shipped** — FabricPolicyGate on publish/install; `liveConnectorExecution: false` |
| Connector Analytics | **Partial** — listing/install/review aggregates |
| Connector Monetization | **Partial** — 15% platform fee on `MarketplaceSale`; VL-258 deepens payouts |
| GraphQL / SDK / Monitoring / Docs | **Shipped** |
| iPaaS / iPaaS / live arbitrary outbound | **Forbidden** — `ipaasOs: false`, `liveConnectorExecution: false` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/connector-marketplace` |
| REST engine | `GET /v1/connector-marketplace/engine` |
| Listings | `GET/POST /v1/connector-marketplace/listings` |
| Install | `POST /v1/connector-marketplace/listings/:id/install` |
| Reviews | `GET/POST /v1/connector-marketplace/listings/:id/reviews` |
| Sales / analytics | `GET /v1/connector-marketplace/sales`, `/analytics` |
| GraphQL | `connectorMarketplaceEngine` |
| SDK | `connectorMarketplaceEngine()` |
| CLI | `lugemi connector-marketplace-engine` |

## Honesty

| Flag | Value |
| --- | --- |
| `liveConnectorExecution` | false |
| `ipaasOs` / `zapierOs` / `mulesoftOs` | false |
| `storesRawCardData` | false |
| `stripeOrEquivalentRequired` | true |
| `fabricPolicyHardGateRequired` | true |
| `sandboxRequired` | true |
| `realMoneyRiskCategory` | true |
| `creatorPayoutMathVerifiedLive` | false |

See ADR-0158. Slack connector: ADR-0026. Ecosystem: [`ECOSYSTEM_CLOUD.md`](./ECOSYSTEM_CLOUD.md).
