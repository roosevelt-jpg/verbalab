# Speech Cloud — Production Readiness Report (VL-160)

**Date:** 2026-09-07  
**Gate:** Speech Cloud Production Audit

## Executive verdict

**Speech Cloud is production-ready as a bounded Lugemi product volume** (deploy via Fly or optional EKS), with known honesty limits documented in ADR-0069–0079.

It is a **speech intelligence hub** (recognition + adjacent intelligence products + analytics) that can support contact-center, language-learning, compliance, analytics, and multilingual voice **workflows within those limits**.

It is **not** Deepgram + AssemblyAI + Twilio Voice Intelligence + Nuance + Amazon Transcribe + Gong + ELSA + Porcupine combined.

## Checklist

| Item | Status |
| --- | --- |
| No TODO / FIXME / implement-later in Speech Cloud source trees | Pass (audit scan) |
| No silent placeholder stubs for Speech hubs | Pass |
| Vendor STT/TTS adapters real with env gating | Pass — live paths Blocked without `OPENAI_API_KEY` / TTS keys (honest) |
| Test fixtures used only in tests | Pass |
| Hub + product catalogs integrated | Pass |
| Billing metering for STT/TTS | Pass (shared `usage_events`) |
| Speech Analytics integrated | Pass (`/v1/speech-analytics`) |
| Monitoring (request IDs + audits + speech monitoring snapshot) | Pass |
| Tenant auth on sensitive routes | Pass (401/403/503 without auth) |
| Migrations ship with API | Pass |
| Deploy docs exist | Pass (`infra/DEPLOY.md`, `infra/AWS_EKS.md`) |
| Competitor / “exceed commercial speech OS” marketing | **Rejected** |
| Invented k6/axe platforms | **Rejected** — bounded smokes only |
| Empty Voice/Vision clouds created | **Rejected** — ADR-0080 blueprint only |

## Deferred (documented, not hidden)

Live-mic WebSocket · neural diarization / NIST biometrics · trained SER · echo AEC · forced-alignment phonemes · on-device wake DNN · realtime CCaaS dialer · WER evaluation lab

## Remaining ops dependencies

- `DATABASE_URL`, `REDIS_URL`, Clerk, `OPENAI_API_KEY` (Whisper/TTS), optional ElevenLabs, Stripe as applicable
- Fly token or EKS cluster for production traffic

## Volume close

Speech Cloud executable phases **VL-150–160** are Done. Future speech depth requires new ROADMAP IDs. Cloud blueprint for next volumes: ADR-0080.
