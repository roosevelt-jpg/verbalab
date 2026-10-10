# ADR-0155: Prompt Marketplace (extends prompt kind, not prompt mesh OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-253 (library “Phase 120 Prompt Marketplace” mapped)

## Context

Library Phase 120 asks for a Prompt Marketplace covering packs/templates/libraries, testing, reviews, analytics, licensing, versioning, REST/SDK/dashboard/monitoring/docs.

Volume 11 requires real-money honesty. Content marketplace already ships `kind=prompt` from managed prompts (VL-091). Prompt Fabric (VL-243) and Prompt Runtime already execute prompts. Inventing a prompt mesh / auto-prompt research OS would violate “extend, don’t regenerate.”

## Decision

1. **Ship VL-253** as `/prompt-marketplace` over `MarketplaceListing` `kind=prompt` with hub marker `snapshot.hub=prompt-marketplace`.  
2. **Publish** active workspace managed prompts (`chat` / `rag` / `voice_faq`) as packs.  
3. **Install** creates new `PromptVersion` rows and activates them in the buyer workspace.  
4. **Test** is a dry-run validation of snapshot keys/bodies (no writes).  
5. **Categories** encode packs/templates/libraries.  
6. **Revenue sharing** records `MarketplaceSale` with 15% platform fee.  
7. **FabricPolicyGate** on `prompt-marketplace` bus.  
8. Honesty: `promptMeshOs: false`, `autoPromptResearchOs: false`, `storesRawCardData: false`, `stripeOrEquivalentRequired: true`.

## Consequences

- Ecosystem catalog marks Prompt Marketplace shipped.  
- Legacy VL-091 listings without hub marker remain on content marketplace only.  
- Agent Marketplace (VL-254) can mirror this hub pattern with sandbox + Policy enforcement next.
