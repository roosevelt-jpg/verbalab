# Voice Cloud — Architecture Report (VL-179)

**Date:** 2026-10-03  
**Scope:** VL-170–178 Voice Cloud volume (+ supporting VL-042/064/120/121)

## Verdict

Voice Cloud is a **hub over Nest modular monolith audio/voice modules**, not a separate microservice mesh and not a voice research OS. REST is primary; GraphQL is a façade; CQRS applies to the Voice Cloud catalog slice (VL-170).

Clouds follow the **12-layer VerbaLab Cloud Blueprint** (ADR-0080).

## System shape

| Layer | Reality |
| --- | --- |
| Runtime | NestJS API (`apps/api`) + Next.js console (`apps/web`) |
| Data | Postgres on `:5433` locally; Redis for jobs/rate limits |
| Hub | `GET /v1/voice-cloud/products` + `/voice-cloud` console |
| Deploy | Fly.io default; optional AWS EKS `af-south-1` |
| Blueprint | ADR-0080 (Foundation → Production Audit) |

## Capability map (honest)

| Product | VL | Status note |
| --- | --- | --- |
| Voice Foundation | 170 | Hub/catalog/overview |
| Neural TTS | 171 / 042 / 121 | Batch + chunk SSE — not vendor token streaming; children deferred |
| Voice Cloning | 172 / 064 | Consent + review + watermark; pro = stricter enrollment |
| Emotion Voice | 173 | Soft prosody profiles — not trained expressive TTS |
| Voice Studio | 174 / 120 | SSML lite / lexicon / timeline — not a DAW |
| Voice Enhancement | 175 / 155 | Heuristic profiles — AEC / spectral ML deferred |
| Voice Biometrics | 176 / 152 | Encrypted templates + heuristic anti-spoof — not NIST/PAD |
| Voice Marketplace | 177 | Listings/install/reviews — ≠ localization marketplace; celebrity blocked |
| Voice Analytics | 178 | Usage/revenue/quality proxies — not BI dashboard |
| Voice FAQ agent | 084 | Twilio FAQ — listed for navigation honesty |

## Integration findings

- Catalogs discoverable; Voice Marketplace + Voice Analytics + shared TTS billing metering wired.
- GraphQL exposes voice product engines without regenerating REST.
- No TODO/FIXME/`implement later` markers in Voice Cloud source trees (audit scan).
- Speech Cloud and Language Cloud remain separate; Voice extends rather than regenerates them.
- Clone consent/watermark path retained across marketplace publish.

## Explicit non-claims

VerbaLab Voice Cloud is **not** a replacement for ElevenLabs + Resemble + Krisp + Soundraw + NIST biometrics + commercial DAW suites combined.
