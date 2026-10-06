# ADR-0159: Voice & Language Marketplace (pack entitlements over VL-177 + Volume 1)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-257 (library “Phase 124 Voice & Language Marketplace” mapped)

## Context

Library Phase 124 asks for Voice / Language / Dialect / Accent / Grammar / Terminology / Localization packs with marketplace, REST, SDK, analytics, monitoring, and docs.

Volume 11 requires real-money honesty (Stripe-or-equivalent; no raw cards). Regenerating Voice Cloud, replacing VL-177 voice marketplace, inventing a third-party voice CDN OS, or allowing celebrity without rights would violate “extend, don’t regenerate.”

## Decision

1. **Ship VL-257** as `/voice-language-marketplace` over `MarketplaceListing` `kind=voice_language` with hub marker `snapshot.hub=voice-language-marketplace`.  
2. **Pack catalog** encodes voice/language/dialect/accent/grammar/terminology/localization SKUs that extend VL-177 + Volume 1 APIs.  
3. **Install** grants workspace pack entitlement — not voice CDN hosting or cross-tenant clone synthesis.  
4. **Reject** `celebrityClaim=true` (same bar as VL-177).  
5. **Revenue sharing** records `MarketplaceSale` with 15% platform fee; Creator Economy (VL-258) deepens payout math.  
6. **FabricPolicyGate** on publish/install via `voice-language-marketplace` bus.  
7. Honesty: `thirdPartyVoiceOs: false`, `voiceCdnOs: false`, `celebrityWithoutRights: false`, `crossTenantCloneSynthesis: false`, `storesRawCardData: false`, `stripeOrEquivalentRequired: true`.

## Consequences

- Ecosystem catalog marks Voice & Language Marketplace shipped.  
- `/voice-marketplace` (VL-177) remains the voice SKU surface; this hub licenses pack entitlements across voice + language.  
- Creator Economy (VL-258) can deepen payout math next without inventing a payment-processor OS.
