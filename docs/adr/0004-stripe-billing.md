# ADR-0004: Stripe for billing entitlements

- **Status:** Accepted
- **Date:** 2026-09-06
- **Phase:** VL-031

## Context

Lugemi needs a free tier plus one paid plan with character quotas. Storing cards ourselves is out of scope.

## Decision

Use **Stripe Checkout + Customer Portal + webhooks**. Local entitlement fields on `organizations`: `plan`, `characterQuota`, `stripeCustomerId`, `stripeSubscriptionId`, `billingStatus`. Translate enforces quota before calling the MT provider (`402 quota_exceeded`).

## Consequences

Live checkout/portal require Stripe env vars. Tests cover free defaults, quota enforcement, and entitlement application without calling Stripe. Never store card data.
