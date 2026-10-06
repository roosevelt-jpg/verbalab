# VerbaLab Emotion Voice Engine

**Status:** Partial (VL-173 / library Phase 30)  
**Rule:** Emotion-conditioned *synthesis* façade over Neural TTS. Do not confuse with Speech Emotion Intelligence *detection* (VL-154). Do not claim trained expressive TTS / Hume / Azure Neural Emotion parity.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Emotion Voice Engine | **VL-173** — `GET /v1/emotion-voice/engine` + `/emotion-voice` |
| Happy / Sad / Angry / Fear / Excited | **Partial** — profiles with soft prosody + preferred voices |
| Professional / Calm / Urgent / Empathetic | **Partial** — same mechanism |
| Medical / Legal / Sales / Customer Support | **Partial** — domain registers (not advice products) |
| Voice Synthesis | **Partial** — `POST /v1/emotion-voice/synthesize` over `AudioService.speak` |
| Realtime | **Partial** — chunk SSE `POST /v1/emotion-voice/stream` |
| GraphQL / SDK / CLI | `emotionVoiceEngine`, `emotionVoiceProfiles` |
| Monitoring | Audit `emotion_voice.*` + shared TTS metering |
| Production deployment | Shared Fly / Docker / optional EKS `af-south-1` |

---

## How it works (honesty)

1. **Profile catalog** — emotion + domain IDs with preferred stock/own voices.  
2. **Soft prosody** — punctuation/pacing cues only (never audible stage directions).  
3. **Clone path** — when `voice=clone:{id}`, optional ElevenLabs `voice_settings` (stability/style).  
4. **OpenAI stock** — no native emotion API; voice pick + soft prosody only.

Speech emotion *detection* remains [`EMOTION_INTELLIGENCE.md`](./EMOTION_INTELLIGENCE.md) (VL-154).

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/emotion-voice` |
| Engine | `GET /v1/emotion-voice/engine` |
| Profiles | `GET /v1/emotion-voice/profiles` |
| Synthesize | `POST /v1/emotion-voice/synthesize` |
| Stream | `POST /v1/emotion-voice/stream` |
| Analytics | `GET /v1/emotion-voice/engine/analytics` |
| Docs | this file + ADR-0084 |

Emotion Voice is **not** a trained expressive TTS lab.

See ADR-0084. Hub: [`VOICE_CLOUD.md`](./VOICE_CLOUD.md).
