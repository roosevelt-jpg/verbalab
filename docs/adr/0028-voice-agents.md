# ADR-0028: Voice agents — Twilio bilingual FAQ demo

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-084

## Context

High-ARPU voice agents are a scope graveyard. VL-061 already proved STT→…→TTS. We need one sellable demo (inbound/outbound) without an agent platform.

## Decision

1. **Twilio only** (not Telnyx). Signed webhooks → TwiML `<Record>` loop; recording downloaded → STT → FAQ LLM (`GatewayService.chat` with dedicated system prompt) → TTS → `<Play>` via short-lived `/v1/voice/audio/:id`.
2. **Simulate path** `POST /v1/voice/simulate` (API key or Clerk) for console/CI with fixture providers — no live Twilio required.
3. **Demo tenant** for call metering: `VOICE_DEMO_ORG_ID` + `VOICE_DEMO_WORKSPACE_ID`. Live Twilio needs `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_WEBHOOK_BASE_URL`, plus `OPENAI_API_KEY` for STT/LLM/TTS.
4. **Out of scope:** agent OS, IVR builder, media streams, multi-number routing, Telnyx.

## Consequences

- Without Twilio keys, webhooks/outbound return `provider_not_configured` (503); CI uses signature fixtures + simulate.
- FAQ knowledge is a hardcoded prompt, not RAG (VL-062 remains separate).
