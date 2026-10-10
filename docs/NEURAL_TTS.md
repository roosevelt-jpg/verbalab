# Lugemi Neural Text-to-Speech

**Status:** Shipped (VL-171 / library Phase 28)  
**Rule:** Extend OpenAI TTS + own rented voices + clone speech. Do not regenerate AudioModule consumers or claim vendor voice clone/Polly/Azure Speech parity.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Neural Voice Engine | **VL-171** — `GET /v1/tts/engine` + `/neural-tts` |
| Batch TTS | **Shipped** — `POST /v1/tts/synthesize` (+ legacy `/v1/audio/speech`) |
| Streaming / realtime TTS | **Partial** — `POST /v1/tts/stream` SSE chunk delivery after full synthesis. Not vendor token streaming. |
| Natural / male / female voices | **Shipped** — enriched `GET /v1/tts/voices` with filters |
| Children voices | **Deferred** — no vendor child catalog today |
| Multiple languages | **Shipped** — language hint + multilingual / own:* voices |
| Dialects / regional accents | **Partial** — catalog tags; not acoustic control |
| Voice personalities | **Partial** — catalog labels; emotion synthesis = Phase 30 |
| Enterprise voices | **Partial** — `clone:{id}` + workspace voices endpoint |
| GraphQL / SDK / CLI | `neuralTtsEngine`, `neuralTtsVoices`, `lugemi neural-tts-engine` |
| Monitoring | Shared observability + `tts.synthesized` / `tts.streamed` audit |
| Analytics | `GET /v1/tts/engine/analytics` (TTS usage). Voice Analytics = Phase 35 |
| Production deployment | Shared Fly / Docker / optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/neural-tts` |
| Engine catalog | `GET /v1/tts/engine` |
| Voices | `GET /v1/tts/voices` |
| Workspace voices (+ clones) | `GET /v1/tts/voices/workspace` |
| Batch synthesize | `POST /v1/tts/synthesize` |
| Stream (chunk SSE) | `POST /v1/tts/stream` |
| Analytics | `GET /v1/tts/engine/analytics` |
| GraphQL | `neuralTtsEngine`, `neuralTtsVoices` |
| Docs | this file + ADR-0082 |

---

## Honesty

- Primary engine: **OpenAI TTS** via AI Gateway; **own:\*** via rented endpoint; **clone:\*** via vendor voice clone with consent/watermark.
- Streaming is **chunk SSE after synthesis**, not low-latency streaming TTS.
- Dialect/accent/personality fields are **catalog metadata**, not synthesis controls.
- Neural TTS is **not** vendor voice clone + Amazon Polly + Azure Neural TTS + Google WaveNet combined.

See ADR-0082. Hub: [`VOICE_CLOUD.md`](./VOICE_CLOUD.md).
