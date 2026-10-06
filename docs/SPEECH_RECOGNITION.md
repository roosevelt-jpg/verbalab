# VerbaLab Speech Recognition Engine

**Status:** Shipped (VL-151 / library Phase 17)  
**Rule:** Extend Whisper gateway + Speech Cloud hub. Do not regenerate AudioModule consumers or claim Deepgram/AssemblyAI parity.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Speech Recognition Engine | **VL-151** — `GET /v1/speech/engine` + `/speech-recognition` |
| Batch STT | **Shipped** — `POST /v1/speech/recognize` (+ legacy `/v1/audio/transcriptions`) |
| Streaming / realtime STT | **Partial** — `POST /v1/speech/stream` SSE segment delivery after Whisper `verbose_json`. Not live-mic WebSocket. |
| Multilingual + auto language detect | **Shipped** — language hint or omit for Whisper auto-detect |
| Custom vocabulary | **Shipped** — workspace phrases → Whisper `prompt` |
| Industry vocabulary | **Shipped** — medical / legal / financial / government packs |
| Subtitles | **Shipped** — SRT / WebVTT from timed segments |
| Punctuation / capitalization | **Shipped** — Whisper output + normalize |
| Timestamps / confidence | **Shipped** — segment start/end + avg_logprob proxy |
| GraphQL / SDK / CLI | `speechEngine`, `speechVocabularyPacks`, `recognizeSpeech()`, `verbalab speech-engine` |
| Monitoring | Shared observability + `speech.recognized` audit |
| Analytics | `GET /v1/speech/engine/analytics` (STT usage). Full Speech Analytics = **VL-159** `/v1/speech-analytics` |
| Production deployment | Shared Fly / Docker / optional EKS `af-south-1` |

---

## Honesty

- Primary engine: **OpenAI Whisper** via AI Gateway.
- Streaming is **segment SSE**, not bidirectional realtime ASR.
- Vocabulary is **soft prompt priming**, not a constrained decoder lexicon.
- Speech Recognition is **not** Deepgram + AssemblyAI + Google STT + Azure Speech combined.

See ADR-0070.
