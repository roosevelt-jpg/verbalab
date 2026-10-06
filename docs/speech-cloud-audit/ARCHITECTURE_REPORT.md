# Speech Cloud — Architecture Report (VL-160)

**Date:** 2026-09-07  
**Scope:** VL-150–159 Speech Cloud volume (+ supporting VL-041/042/061/064/120/121/132)

## Verdict

Speech Cloud is a **hub over Nest modular monolith audio/speech modules**, not a separate microservice mesh and not a speech research OS. REST is primary; GraphQL is a façade; CQRS applies to the Speech Cloud catalog slice (VL-150).

Clouds follow the **12-layer VerbaLab Cloud Blueprint** (ADR-0080).

## System shape

| Layer | Reality |
| --- | --- |
| Runtime | NestJS API (`apps/api`) + Next.js console (`apps/web`) |
| Data | Postgres on `:5433` locally; Redis for jobs/rate limits |
| Hub | `GET /v1/speech/products` + `/speech` console |
| Deploy | Fly.io default; optional AWS EKS `af-south-1` |
| Blueprint | ADR-0080 (Foundation → Production Audit) |

## Capability map (honest)

| Product | VL | Status note |
| --- | --- | --- |
| Speech Foundation | 150 | Hub/catalog/overview |
| Recognition Engine | 151 / 041 | Whisper STT + SSE segments — not live-mic WS |
| Speaker Intelligence | 152 | Local fingerprints + gap diarization — not NIST |
| Accent Intelligence | 153 / 132 | Cue façade — acoustic models deferred |
| Emotion Intelligence | 154 | Cue + soft audio proxies — not SER |
| Audio Intelligence | 155 | PCM heuristics — not Krisp/Demucs; AEC deferred |
| Pronunciation | 156 | Alignment heuristics — not ELSA |
| Wake Word | 157 | Transcript spotting — not Porcupine DNN |
| Call Intelligence | 158 | Heuristic call analytics — not Gong; Voice FAQ separate |
| Speech Analytics | 159 | Usage/audit aggregates — not BI/WER lab |
| TTS / clones / studio | 042 / 064 / 120 / 121 | Vendor + own TTS paths |
| Interpreter | 061 | STT→MT→TTS compose |

## Integration findings

- Catalogs discoverable; Speech Analytics + shared billing metering wired.
- GraphQL exposes speech product engines without regenerating REST.
- No TODO/FIXME/`implement later` markers in Speech Cloud source trees (audit scan).
- Language Cloud remains separate; Speech extends rather than regenerates it.

## Explicit non-claims

VerbaLab Speech Cloud is **not** a replacement for Deepgram + AssemblyAI + Twilio Voice Intelligence + Gong + commercial wake-word/pronunciation suites combined.
