# ADR-0088: Voice Marketplace (distinct from localization Marketplace)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-177 (library “Phase 34 Voice Marketplace” mapped)

## Context

Library Phase 34 asks for voice publishing, licensing, selling, subscriptions, ratings, reviews, packs, celebrity/enterprise/language packs, marketplace engine, REST/GraphQL/SDK/analytics/billing/docs.

Lugemi already has localization Marketplace (VL-090–092) for glossary/prompt/dataset SKUs. Mixing voice SKUs into that catalog would confuse products. Celebrity voices without a rights chain are explicitly out of scope.

## Decision

1. Ship **Voice Marketplace** under `/v1/voice-marketplace/*` + console `/voice-marketplace`.  
2. **Separate tables** (`voice_listings*`) — do not add `kind=voice` to localization marketplace.  
3. **Clone publish** requires approved clone + consent + ownership + `rightsAttested`.  
4. **Reject** `celebrityClaim=true`.  
5. **Install** = workspace license entitlement + optional recorded sale — **not** cross-tenant clone synthesis.  
6. Language packs = curated `own:*` catalogs; packs bundle listing ids.  
7. Ratings/reviews aggregated on listings. Subscriptions = metadata for now.

## Consequences

- Voice Cloud marks marketplace `partial`.  
- Localization `/marketplace` unchanged.  
- Legal review still required before celebrity or broad commercial clone resale.
