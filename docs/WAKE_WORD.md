# Lugemi Wake Word Engine

**Status:** Partial shipped (VL-157 / library Phase 23)  
**Rule:** Transcript/text spotting for wake words, keywords, and triggers. Do not claim Picovoice Porcupine, Snowboy, or on-device always-on DNN.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Wake Word Platform / Engine | **VL-157** — `GET /v1/wake-word/engine` + `/wake-word` |
| Wake Word Detection | **Shipped** — `POST /v1/wake-word/detect` (text or audio→STT) |
| Keyword Spotting | **Shipped** — `POST /v1/wake-word/spot` |
| Custom Keywords | **Shipped** — `GET/POST/DELETE /v1/wake-word/keywords` (`wake_word` \| `keyword` \| `trigger`) |
| Enterprise Triggers | **Partial** — `POST /v1/wake-word/triggers` (hits + audit, not workflow OS) |
| Streaming Detection | **Partial** — `POST /v1/wake-word/detect/stream` SSE |
| Offline Detection | **Partial** — batch file/text buffer spotting — not embedded DNN |
| On-device wake DNN | **Deferred** |
| GraphQL / SDK / CLI | `wakeWordEngine`, `detectWakeWord`, `spotKeywords`, `lugemi wake-word-engine` |
| Monitoring | Audit `wake_word.*` + shared observability |
| Production | Shared Fly/Docker/K8s + Prisma `wake_keywords` |

---

## Default wake phrases

`hey lugemi` · `ok lugemi` · `lugemi`

---

## Honesty

Not Porcupine / Sensory / Alexa wake engines. Matching is on transcripts after STT (or plain text). See ADR-0076.
