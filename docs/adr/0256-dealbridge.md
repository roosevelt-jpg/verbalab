# ADR-0256 — Lugemi DealBridge

## Status

Accepted (2026-10-10)

## Context

Merchants and buyers negotiate across languages and routinely mismatch quantity, currency, delivery, and payment terms. Lugemi already provides ASR, translation, TTS, fidelity checks, and tenancy. DealBridge is a flagship commercial workflow that composes those services into a dual-party confirmation receipt — not a claim of legal enforceability or guaranteed comprehension.

## Decision

1. Implement DealBridge as a Nest feature module (`apps/api/src/dealbridge`) with Prisma-backed domain entities and a Next.js console area (`/dealbridge`, `/admin/dealbridge`).
2. Keep business state authoritative on the server with an explicit state machine, immutable term snapshots + review presentations, and race-safe receipt issuance inside a transaction.
3. Separate extraction / explain-back verification from explicit user confirmation. “Yes” alone never completes an understanding check.
4. Sign receipts with HMAC (`DEALBRIDGE_RECEIPT_SIGNING_KEY`); when unset, use a labeled local-dev fixture key. Signature proves integrity of the issued record only.
5. Gate entitlement with plan feature `dealBridge` (Pro+), overridable via `featureOverrides.dealBridge`, `DEALBRIDGE_OPEN=1`, or kill-switched with `DEALBRIDGE_DISABLED=1`.
6. Label demo/fixture sessions permanently (`isDemo` / `isFixture`); exclude them from pilot merchant funnels.
7. Reuse AudioService + TranslateService adapters; allow explicitly labeled fixture ASR/MT/TTS only when `DEALBRIDGE_ALLOW_FIXTURE_*=1` or `NODE_ENV=test`.

## Consequences

- Dual-party invites can bind buyers across tenant boundaries while metering against the hosting merchant organization.
- Continuous interpretation, WhatsApp, logistics, payment custody, and marketplace expansion remain out of scope.
- Pilot metrics that require human adjudication (critical error escape, paid conversion attribution) stay null until reviewed — never fabricated.
