# VerbaLab Creator Economy

**Status:** Shipped (VL-258 / library Phase 125) — tax/dispute remain **documented gaps**  
**Rule:** Extends VL-092 Stripe Connect Express + `MarketplaceSale` — **not** a payment-processor OS, tax engine, or card vault. Hand-check royalty math before live creators. Roadmap: [`docs/roadmap/volume11-ecosystem-cloud/`](./roadmap/volume11-ecosystem-cloud/).

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Revenue Sharing | **Shipped** — `splitRevenue` + hub 15% / content marketplace Connect fee (env, default 20%) |
| Subscriptions | **Partial** — Pro plan + listing `subscriptionInterval`; recurring Connect deferred |
| Licensing | **Partial** — entitlement installs aggregate |
| Royalties | **Shipped** — hand-check scenarios + preview API |
| Creator / Org / Partner Profiles | **Shipped / partial** — org + Connect readiness |
| Payouts | **Partial** — Stripe Connect Express (VL-092); live blocked without Stripe env |
| Invoices | **Partial** — invoice-style views over sales |
| Tax Reporting | **Deferred gap** — `taxHandlingComplete: false` |
| Creator Portal / REST / Analytics / Monitoring / Docs | **Shipped** (analytics partial) |

---

## Royalty math (hand-check)

```
applicationFeeCents = min(amount, floor(amount * feeBps / 10000))
publisherNetCents   = amount - applicationFeeCents
```

| Scenario | Amount | Fee bps | Fee | Net |
| --- | --- | --- | --- | --- |
| hub-1000-15pct | 1000 | 1500 | 150 | 850 |
| hub-500-15pct | 500 | 1500 | 75 | 425 |
| content-1000-20pct | 1000 | 2000 | 200 | 800 |
| floor-1-cent-15pct | 1 | 1500 | 0 | 1 |
| zero-15pct | 0 | 1500 | 0 | 0 |
| hub-999-15pct | 999 | 1500 | 149 | 850 |

**Fee schedules:** Volume 11 ecosystem hubs record **15%** (1500 bps). Content marketplace Checkout uses `MARKETPLACE_PLATFORM_FEE_BPS` (default **20%** via billing). Voice marketplace VL-177 still uses **10%** — not regenerated here.

`creatorPayoutMathHandCheckedInTests: true` · `creatorPayoutMathVerifiedLive: false` (ops sign-off before live creators).

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/creator-economy` |
| REST engine | `GET /v1/creator-economy/engine` |
| Royalty scenarios / preview | `GET …/royalty/scenarios` · `POST …/royalty/preview` |
| Sales / invoices | `GET …/sales` · `/invoices` |
| Profiles | `GET …/profiles/{creator,organization,partner}` |
| Tax / disputes (honesty) | `GET …/tax` · `/disputes` |
| Connect (prior) | `GET /v1/marketplace/connect/status` |
| GraphQL | `creatorEconomyEngine` |
| SDK / CLI | `creatorEconomyEngine()` · `verbalab creator-economy-engine` |

## Honesty

| Flag | Value |
| --- | --- |
| `paymentProcessorOs` / `taxEngineOs` | false |
| `storesRawCardData` | false |
| `stripeOrEquivalentRequired` | true |
| `taxHandlingComplete` | false |
| `disputeChargebackComplete` | false |
| `refundsUiComplete` | false |
| `creatorPayoutMathVerifiedLive` | false |
| `creatorPayoutMathHandCheckedInTests` | true |
| `liveConnectBlockedWithoutStripeEnv` | true |

See ADR-0160. Prior: [`ADR-0033`](./adr/0033-marketplace-creator-payouts.md). Ecosystem: [`ECOSYSTEM_CLOUD.md`](./ECOSYSTEM_CLOUD.md).
