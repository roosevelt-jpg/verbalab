# Lugemi Voice Enhancement Platform

**Status:** Partial (VL-175 / library Phase 32)  
**Rule:** Cleanup/restoration/mastering façade over Audio Intelligence PCM heuristics (VL-155). **Not** Krisp, Adobe Enhance, Demucs, or live AEC.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Enhancement Engine | **VL-175** — `GET /v1/voice-enhancement/engine` + `/voice-enhancement` |
| Noise Removal | **Partial** — profile `noise_removal` |
| Echo Cancellation | **Deferred** — `GET /v1/voice-enhancement/echo` |
| Audio Upscaling | **Partial** — linear resample |
| Voice Restoration | **Partial** — profile `voice_restoration` (not archival ML) |
| Microphone / Podcast / Meeting Cleanup | **Partial** — named profiles |
| Broadcast Audio | **Partial** — enhance + soft limit (not LUFS mastering) |
| Realtime | **Partial** — `POST …/enhance/stream` SSE |
| GraphQL / SDK / CLI | `voiceEnhancementEngine`, `voiceEnhancementProfiles` |
| Monitoring | Audit `voice_enhancement.*` |
| Production deployment | Shared Fly / Docker / optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/voice-enhancement` |
| Legacy analyze | `/audio-intelligence` (VL-155) |
| Engine / Profiles | `GET /v1/voice-enhancement/engine` · `/profiles` |
| Enhance / Upscale | `POST …/enhance` · `/upscale` |
| Stream | `POST …/enhance/stream` |
| Docs | this file + ADR-0086 |

Voice Enhancement is **not** Krisp / Adobe Enhance / Demucs, and is **not** a spectral ML denoise lab.

See ADR-0086. Hub: [`VOICE_CLOUD.md`](./VOICE_CLOUD.md). Parent DSP: [`AUDIO_INTELLIGENCE.md`](./AUDIO_INTELLIGENCE.md).
