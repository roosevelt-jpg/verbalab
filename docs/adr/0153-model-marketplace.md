# ADR-0153: Model Marketplace (license SKUs over registry, not HF OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-251 (library “Phase 118 Model Marketplace” mapped)

## Context

Library Phase 118 asks for an enterprise Model Marketplace covering foundation/fine-tuned/private/enterprise/community/commercial models, versioning, licensing, revenue sharing, REST/GraphQL/SDK/analytics/monitoring/docs.

Volume 11 requires real-money honesty (Stripe-or-equivalent; no raw cards). Inventing a Hugging Face hub, weight CDN, or regenerating Model Registry / VL-110 would violate “extend, don’t regenerate.”

## Decision

1. **Ship VL-251** as `/model-marketplace` over Model Registry cards + `MarketplaceListing` `kind=model`.  
2. **Categories** encode foundation/finetuned/private/enterprise/community/commercial.  
3. **Install** grants workspace license entitlement — not weight download.  
4. **Revenue sharing** records `MarketplaceSale` with 15% platform fee; Creator Economy (VL-258) deepens payout math.  
5. **FabricPolicyGate** on publish/install via `model-marketplace` bus.  
6. Honesty: `huggingFaceOs: false`, `weightHostingOs: false`, `storesRawCardData: false`, `stripeOrEquivalentRequired: true`.

## Consequences

- Ecosystem catalog marks Model Marketplace shipped.  
- Inference continues via existing gateway/model-serving paths after entitlement.  
- Dataset/Prompt marketplaces can reuse this listing pattern next.
