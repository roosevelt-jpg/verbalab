# Lugemi Relay — operations runbook

## Surface

- API: `/v1/relay/*`
- Web: `/relay`, `/relay/bookings/[id]`, `/relay/offers`, `/relay/ops`
- SDK: TypeScript `client.relay`
- Entitlement: plan feature `relay` (Pro+), org `featureOverrides.relay`, `RELAY_OPEN`, `RELAY_DISABLED`

## Environment

| Variable | Purpose |
| --- | --- |
| `RELAY_DISABLED=1` | Kill switch — blocks new API use |
| `RELAY_OPEN=1` | Bypass plan entitlement (local/demo) |
| `RELAY_ALLOW_TEST_ACTORS=1` | Allow `X-Relay-Actor-Id` without Clerk |
| `RELAY_ALLOW_DEMO_INTERPRETERS=1` | Seed labeled `demo_staffed` interpreters + open slots |
| `RELAY_OFFER_TTL_MS` | Offer / slot-hold TTL (default 900000) |
| `RELAY_SETUP_BUFFER_MINUTES` | Overlap buffer minutes (default 5) |
| `RELAY_MEDIA_SIGNING_KEY` | Optional join-token HMAC key |
| `RELAY_PAYMENT_PROCESSOR_URL` | Reserved — processor stays disabled until authorized |

## Adapter stack

1. Coverage/slots from org-scoped `RelayInterpreterProfile` + `RelayAvailabilitySlot`
2. Deterministic match → atomic slot hold + expiring offer + pinned quote (GHS minor units)
3. Interpreter accept (or demo_staffed actor) → requester quote accept → booking
4. Manual invoice `mark-paid` (idempotent) before join
5. Explicit context grants; source corrections mark grants stale
6. Browser join tokens bound to booking/role/expiry; interpreters cannot confirm business terms
7. Usage ledger from server intervals; extensions require explicit approval beyond quote ceiling
8. Feedback, human-operated disputes, ops overview

## Common errors

| Code | Meaning |
| --- | --- |
| `feature_disabled` | Plan lacks `relay`, override false, or kill switch |
| `actor_required` | Missing Clerk user / actor header |
| `domain_disabled` | Medical/legal/emergency requested |
| `unsupported_corridor` | Unknown corridor id |
| `offer_expired` / `offer_conflict` | Offer timing or double-accept |
| `slot_unavailable` / `slot_conflict` | Hold lost or overlapping slot |
| `booking_not_ready` | Join before payment confirmed |
| `overrun_ceiling` | Duration exceeds quote + approved extensions |
| `revision_conflict` | Stale booking revision on extension |
| `interpreter_suspended` | Suspended interpreter blocked from accept/join |

## Rollback

1. Set `RELAY_DISABLED=1` and redeploy API (stops new bookings).
2. Optionally set `featureOverrides.relay=false` on affected orgs.
3. Keep support for confirmed obligations — do not hide existing bookings from requesters.
4. Web routes remain but API returns 403 for new mutations.

## Honesty / launch prerequisites

- Demo interpreters are labeled `demo_staffed` — not a hired continent-wide pool.
- Telephone bridging, card capture, escrow and interpreter payouts stay disabled.
- Instant / 24×7 coverage is not claimed without staffed evidence.
- Recruitment, native skill review and payment processor permission remain human launch steps.
