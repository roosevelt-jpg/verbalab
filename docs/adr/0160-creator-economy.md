# ADR-0160: Creator Economy (royalty math + honesty over VL-092 Connect)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-258 (library “Phase 125 Creator Economy” mapped)

## Context

Library Phase 125 asks for revenue sharing, subscriptions, licensing, royalties, creator/org/partner profiles, payouts, invoices, tax reporting, creator portal, REST, billing, analytics, monitoring, and docs.

Volume 11 requires real-money honesty: Stripe-or-equivalent; no raw cards; hand-check payout math; explicit tax/dispute gaps. Inventing a payment-processor OS or claiming tax-complete coverage would be dishonest.

VL-092 already ships Stripe Connect Express, destination Checkout with application fees, and `MarketplaceSale` receipts (ADR-0033). Volume 11 hubs record 15% fees; content marketplace billing defaults to 20% via `MARKETPLACE_PLATFORM_FEE_BPS`.

## Decision

1. **Ship VL-258** as `/creator-economy` discovery + royalty hub extending VL-092 — do not regenerate billing or marketplace Checkout.  
2. **Pure `splitRevenue`** with documented hand-check scenarios (tested).  
3. **Fee honesty:** ecosystem hubs 15% (1500 bps); content marketplace uses `billing.platformFeeBps()`; VL-177 voice marketplace 10% noted, not rewritten.  
4. **Profiles / invoices / sales aggregates** over org + Connect + `MarketplaceSale`.  
5. **Tax and disputes** exposed as deferred honesty endpoints (`taxHandlingComplete: false`, `disputeChargebackComplete: false`).  
6. **FabricPolicyGate** on royalty preview via `creator-economy` bus.  
7. Honesty: `paymentProcessorOs: false`, `storesRawCardData: false`, `stripeOrEquivalentRequired: true`, `creatorPayoutMathVerifiedLive: false`, `creatorPayoutMathHandCheckedInTests: true`.

## Consequences

- Ecosystem catalog marks Creator Economy shipped (with tax/dispute gaps still false).  
- Live Connect payouts remain blocked without Stripe env (unchanged from VL-092).  
- Production Audit (VL-259) can harden Volume 11 without adding marketplace features.
