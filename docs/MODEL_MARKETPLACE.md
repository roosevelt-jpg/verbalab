# Lugemi Model Marketplace

**Status:** Shipped (VL-251 / library Phase 118)  
**Rule:** License SKUs over Model Registry / VL-110 — **not** public model-hub, weight CDN, or traffic-mesh deploy OS. Real-money honesty: Stripe (or equivalent); `storesRawCardData: false`. Roadmap: [`docs/roadmap/volume11-ecosystem-cloud/`](./roadmap/volume11-ecosystem-cloud/).

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Foundation / Fine-tuned / Private / Enterprise / Community / Commercial | **Shipped** — `category` on listings |
| Versioning | **Shipped** — `modelVersion` on snapshot + update |
| Licensing | **Shipped** — install grants workspace entitlement |
| Revenue Sharing | **Partial** — 15% platform fee on `MarketplaceSale`; VL-258 deepens payouts |
| GraphQL / SDK / Analytics / Monitoring / Docs | **Shipped** |
| Weight hosting / public model-hub OS | **Forbidden** — `weightHostingOs: false`, `huggingFaceOs: false` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/model-marketplace` |
| REST engine | `GET /v1/model-marketplace/engine` |
| Listings | `GET/POST /v1/model-marketplace/listings` |
| Install | `POST /v1/model-marketplace/listings/:id/install` |
| Reviews | `GET/POST /v1/model-marketplace/listings/:id/reviews` |
| Sales / analytics | `GET /v1/model-marketplace/sales`, `/analytics` |
| GraphQL | `modelMarketplaceEngine` |
| SDK | `modelMarketplaceEngine()` |
| CLI | `lugemi model-marketplace-engine` |

## Honesty

| Flag | Value |
| --- | --- |
| `huggingFaceOs` | false |
| `weightHostingOs` | false |
| `storesRawCardData` | false |
| `stripeOrEquivalentRequired` | true |
| `fabricPolicyHardGateRequired` | true |
| `realMoneyRiskCategory` | true |
| `creatorPayoutMathVerifiedLive` | false |

See ADR-0153. Registry: [`MODEL_REGISTRY.md`](./MODEL_REGISTRY.md). Ecosystem: [`ECOSYSTEM_CLOUD.md`](./ECOSYSTEM_CLOUD.md).
