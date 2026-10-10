# ADR-0158: Connector Marketplace (entitlement SKUs, not iPaaS OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-256 (library “Phase 123 Connector Marketplace” mapped)

## Context

Library Phase 123 asks for a Connector Marketplace covering CRM/ERP/HR/finance/healthcare/government/cloud/identity/email/telephony/payments, security, analytics, and monetization.

Volume 11 requires real-money honesty (Stripe-or-equivalent; no raw cards). Inventing Zapier/iPaaS, opening live arbitrary outbound, or regenerating the Slack connector (ADR-0026) would violate “extend, don’t regenerate.”

## Decision

1. **Ship VL-256** as `/connector-marketplace` over `MarketplaceListing` `kind=connector` with hub marker `snapshot.hub=connector-marketplace`.  
2. **Catalog keys** encode Slack (shipped) plus generic category SKUs (partial metadata entitlements).  
3. **Install** grants workspace connector entitlement — not live outbound execution.  
4. **Revenue sharing** records `MarketplaceSale` with 15% platform fee; Creator Economy (VL-258) deepens payout math.  
5. **FabricPolicyGate** on publish/install via `connector-marketplace` bus.  
6. Honesty: `liveConnectorExecution: false`, `ipaasOs: false`, `zapierOs: false`, `storesRawCardData: false`, `stripeOrEquivalentRequired: true`, `sandboxRequired: true`.

## Consequences

- Ecosystem catalog marks Connector Marketplace shipped.  
- Slack continues via existing `/v1/connectors/slack` paths after entitlement.  
- Voice & Language Marketplace (VL-257) can mirror the hub pattern next without inventing a voice CDN OS.
