# ADR-0033: Marketplace creator payouts (Stripe Connect)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-092

## Context

VL-090/091 shipped free copy-on-install marketplace listings. Creators need revenue share without Lugemi holding cards. VL-031 already uses Stripe Checkout for Pro subscriptions.

## Decision

1. **Connect:** Express accounts on `organizations` (`stripe_connect_account_id`, `stripe_connect_charges_enabled`). Onboard via Account Links; sync on `account.updated`.
2. **Pricing:** `marketplace_listings.price_cents` (0 = free). Paid publish requires Connect when live marketplace payments are configured.
3. **Checkout:** Destination charges with `application_fee_amount` (`MARKETPLACE_PLATFORM_FEE_BPS`, default 20%). Webhook `checkout.session.completed` (payment + marketplace metadata) installs + writes `marketplace_sales` status `paid`.
4. **Fixture path:** When Stripe marketplace checkout is not configured, paid install immediately copies assets and records sale status `recorded` (same pattern as entitlement tests).
5. **Console:** `/marketplace` — Connect status, price on publish, Checkout redirect, sales list.

## Consequences

- Live payouts blocked until Stripe Connect + webhook env are set (same as VL-031).
- Tax, refunds UI, and multi-currency catalog remain out of scope.
