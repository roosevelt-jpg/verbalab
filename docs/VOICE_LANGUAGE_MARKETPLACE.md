# VerbaLab Voice & Language Marketplace

**Status:** Shipped (VL-257 / library Phase 124)  
**Rule:** Entitlement SKUs over VL-177 voice marketplace + Volume 1 language/dialect/glossary/locale packs — **not** ElevenLabs, voice CDN, or celebrity without rights. Real-money honesty: Stripe (or equivalent); `storesRawCardData: false`. Roadmap: [`docs/roadmap/volume11-ecosystem-cloud/`](./roadmap/volume11-ecosystem-cloud/).

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Voice Packs | **Shipped** — `packType=voice` over VL-177 packs |
| Language Packs | **Shipped** — `language.sw/yo/am/en` over VL-177 language packs |
| Dialect Packs | **Shipped** — metadata entitlement over dialect registry |
| Accent Packs | **Partial** — metadata entitlement; acoustic models deferred |
| Grammar Packs | **Partial** — metadata only; grammar OS deferred |
| Terminology Packs | **Shipped** — over vertical glossaries |
| Localization Packs | **Shipped** — over locales / country packs |
| Analytics / Monitoring / Docs | **Shipped** (analytics partial) |
| ElevenLabs / voice CDN OS | **Forbidden** — `elevenLabsOs: false`, `voiceCdnOs: false` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/voice-language-marketplace` |
| Prior voice marketplace | `/voice-marketplace` (VL-177, unchanged) |
| REST engine | `GET /v1/voice-language-marketplace/engine` |
| Listings | `GET/POST /v1/voice-language-marketplace/listings` |
| Install | `POST /v1/voice-language-marketplace/listings/:id/install` |
| Reviews / sales / analytics | under `/v1/voice-language-marketplace/*` |
| GraphQL | `voiceLanguageMarketplaceEngine` |
| SDK | `voiceLanguageMarketplaceEngine()` |
| CLI | `verbalab voice-language-marketplace-engine` |

## Honesty

| Flag | Value |
| --- | --- |
| `elevenLabsOs` / `voiceCdnOs` | false |
| `celebrityWithoutRights` | false |
| `crossTenantCloneSynthesis` | false |
| `regeneratesVoiceCloud` / `regeneratesVoiceMarketplace` | false |
| `storesRawCardData` | false |
| `stripeOrEquivalentRequired` | true |
| `fabricPolicyHardGateRequired` | true |
| `realMoneyRiskCategory` | true |
| `creatorPayoutMathVerifiedLive` | false |

See ADR-0159. Prior surface: [`VOICE_MARKETPLACE.md`](./VOICE_MARKETPLACE.md). Ecosystem: [`ECOSYSTEM_CLOUD.md`](./ECOSYSTEM_CLOUD.md).
