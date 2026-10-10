# Lugemi AccessLine

Native-language telephone service for logistics **delivery-status** enquiries. Callers use an ordinary business number; no smartphone app is required.

## Scope (MVP)

- One logistics pilot corridor (Kenya — Swahili / English)
- Read-only order status (no payments, refunds, address changes, voice biometrics)
- Registered-customer OTP authentication before private order disclosure
- Allowlisted human handoff or support case when staff unavailable
- Turn-based speech/DTMF (not marketed as real-time interpretation)

## Honesty

| Mode | Behavior |
| --- | --- |
| **Simulator** | Full dialogue E2E via `/v1/accessline/simulate/*`. Labeled. No carrier, no external OTP SMS. |
| **Twilio** | Signature-verified webhooks at `/v1/accessline/twilio/*`. Requires `TWILIO_*`. Live number purchase and customer calls need separate authorization. |

Caller ID, spoken name, and order reference **never** bypass authentication.

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /v1/accessline/catalog` | Product catalog + telephony honesty |
| `GET /v1/accessline/capabilities` | Workflow + deferred features |
| `POST /v1/accessline/lines` | Create business line (simulated by default) |
| `POST /v1/accessline/simulate/start` | Start simulator call |
| `POST /v1/accessline/simulate/:id/dtmf` | DTMF (language, OTP, order ref) |
| `POST /v1/accessline/simulate/:id/speech` | Intent / reference speech |
| `POST /v1/accessline/simulate/:id/hangup` | End call; reject stale turns |
| `GET /v1/accessline/calls/:id/summary` | Authorized summary (no OTPs) |
| `POST /v1/accessline/twilio/inbound` | Twilio inbound (signature required) |

Auth: Clerk session or `lg_test_` / `lg_live_` API key + `X-AccessLine-Actor-Id`.

## Mobile / TypeScript SDKs (v0.4.0)

```kotlin
val al = client.accessLine
val line = al.createLine(name = "Pilot", inboundNumber = "sim:+254700000001")
val call = al.simulateStart(line.getString("id"))
al.simulateDtmf(call.getString("id"), "1")
```

```swift
let al = client.accessLine
let line = try await al.createLine(name: "Pilot", inboundNumber: "sim:+254700000001")
```

```ts
const al = client.accessLine;
await al.simulateStart({ lineId });
```

## Console

`/accessline` — create simulated lines and drive the call journey.

## Runbook (pilot)

1. **Provider outage** — `ACCESSLINE_DISABLED=1` or fall back to human IVR; catalog shows telephony mode.
2. **Stale logistics** — answers include freshness; null ETA stays null.
3. **Auth failure / lockout** — allowlisted handoff or case reference (not a bearer credential).
4. **Hangup** — increments turn generation; late jobs cannot restart the call.
5. **Rollback** — disable feature flag / env kill-switch; keep simulated path for QA.

## Blockers for live carrier pilot

- Authorized Twilio account + purchased DID mapped to a business line (`integrationMode: twilio`)
- Jurisdiction recording/disclosure review
- Native speaker evaluation on telephone-bandwidth audio
- External OTP channel to registered contacts only (not implemented — simulator only today)

See build guide: AccessLine Cursor build guide v1.0.
