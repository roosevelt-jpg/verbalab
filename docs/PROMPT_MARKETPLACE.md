# Lugemi Prompt Marketplace

**Status:** Shipped (VL-253 / library Phase 120)  
**Rule:** Extends content-marketplace `prompt` kind + Prompt Fabric / Prompt Runtime — **not** a prompt mesh OS or auto-prompt research lab. Real-money honesty: Stripe (or equivalent); `storesRawCardData: false`. Roadmap: [`docs/roadmap/volume11-ecosystem-cloud/`](./roadmap/volume11-ecosystem-cloud/).

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Prompt Packs / Templates / Libraries | **Shipped** — `category` |
| Prompt Testing | **Shipped** — dry-run `POST .../test` |
| Reviews / Analytics | **Shipped** |
| Licensing / Versioning | **Shipped** — install copies PromptVersion rows |
| Revenue Sharing | **Partial** — 15% fee on `MarketplaceSale`; VL-258 deepens payouts |
| Prompt mesh / auto-prompt research OS | **Forbidden** |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/prompt-marketplace` |
| REST engine | `GET /v1/prompt-marketplace/engine` |
| Listings | `GET/POST /v1/prompt-marketplace/listings` |
| Test | `POST /v1/prompt-marketplace/listings/:id/test` |
| Install | `POST /v1/prompt-marketplace/listings/:id/install` |
| Reviews / sales / analytics | under `/v1/prompt-marketplace/*` |
| GraphQL | `promptMarketplaceEngine` |
| SDK | `promptMarketplaceEngine()` |
| CLI | `lugemi prompt-marketplace-engine` |

## Honesty

| Flag | Value |
| --- | --- |
| `promptMeshOs` | false |
| `autoPromptResearchOs` | false |
| `storesRawCardData` | false |
| `stripeOrEquivalentRequired` | true |
| `fabricPolicyHardGateRequired` | true |
| `realMoneyRiskCategory` | true |

See ADR-0155. Content marketplace: VL-090–092. Prompt Fabric: VL-243.
