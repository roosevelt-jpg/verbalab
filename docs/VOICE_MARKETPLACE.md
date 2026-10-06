# Lugemi Voice Marketplace

**Status:** Partial (VL-177 / library Phase 34)  
**Rule:** Voice SKU publish/license/ratings — **distinct** from localization Marketplace (VL-090). Celebrity SKUs without a rights chain are **forbidden**. Install is a license entitlement, not cross-tenant clone synthesis.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Marketplace | **VL-177** — `GET /v1/voice-marketplace/engine` + `/voice-marketplace` |
| Voice Publishing | **Shipped** — listings (own/stock/approved clone) |
| Voice Licensing / Selling | **Partial** — install entitlement + recorded paid sales |
| Subscriptions | **Partial** — `subscriptionInterval` metadata; recurring Stripe deferred |
| Ratings / Reviews | **Shipped** — 1–5 stars, one review per org |
| Voice Packs | **Shipped** — `kind=pack` |
| Celebrity Voices | **Deferred / forbidden** without rights chain |
| Enterprise Voices | **Partial** — approved clones + enterprise license |
| Language Packs | **Shipped** — curated `own:*` packs (sw/yo/am/en) |
| Analytics / Billing | **Partial** — publisher aggregates + Pro gate + recorded sales |
| GraphQL / SDK / CLI | `voiceMarketplaceEngine`, language packs |
| Production deployment | Shared Fly / Docker / optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/voice-marketplace` |
| Localization marketplace | `/marketplace` (unchanged) |
| Engine / Language packs | `GET /v1/voice-marketplace/engine` · `/language-packs` |
| Listings | `GET|POST /v1/voice-marketplace/listings` |
| Install / Reviews | `…/listings/:id/install` · `/reviews` |
| Analytics / Sales | `GET …/analytics` · `/sales` |

Voice Marketplace is **not** ElevenLabs Voice Library + celebrity marketplace combined.

See ADR-0088. Hub: [`VOICE_CLOUD.md`](./VOICE_CLOUD.md). Cloning trust: [`VOICE_CLONING.md`](./VOICE_CLONING.md).
