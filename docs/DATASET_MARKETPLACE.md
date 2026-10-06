# Lugemi Dataset Marketplace

**Status:** Shipped (VL-252 / library Phase 119)  
**Rule:** Extends content-marketplace `dataset` kind + VL-101 DatasetAsset — **not** Label Studio, annotation OS, or Dataset Cloud. Real-money honesty: Stripe (or equivalent); `storesRawCardData: false`. Roadmap: [`docs/roadmap/volume11-ecosystem-cloud/`](./roadmap/volume11-ecosystem-cloud/).

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Public / Enterprise / Research | **Shipped** — `category` |
| Translation / Speech / OCR / Vision corpora | **Shipped** — categories; TM or DatasetAsset sources |
| Licensing | **Shipped** — TM copy-on-install or asset entitlement |
| Versioning / Reviews | **Shipped** |
| Revenue Sharing | **Partial** — 15% fee on `MarketplaceSale`; VL-258 deepens payouts |
| Label Studio / Dataset Cloud OS | **Forbidden** |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/dataset-marketplace` |
| REST engine | `GET /v1/dataset-marketplace/engine` |
| Listings | `GET/POST /v1/dataset-marketplace/listings` |
| Install | `POST /v1/dataset-marketplace/listings/:id/install` |
| Reviews / sales / analytics | under `/v1/dataset-marketplace/*` |
| GraphQL | `datasetMarketplaceEngine` |
| SDK | `datasetMarketplaceEngine()` |
| CLI | `lugemi dataset-marketplace-engine` |

## Honesty

| Flag | Value |
| --- | --- |
| `labelStudioOs` | false |
| `datasetCloudOs` | false |
| `storesRawCardData` | false |
| `stripeOrEquivalentRequired` | true |
| `fabricPolicyHardGateRequired` | true |
| `realMoneyRiskCategory` | true |

See ADR-0154. Content marketplace: VL-090–092. Dataset program: VL-101.
