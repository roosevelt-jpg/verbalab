# Lugemi Emotion Intelligence

**Status:** Partial shipped (VL-154 / library Phase 20)  
**Rule:** Speech Cloud emotion product. Do not regenerate Language Intelligence emotion. Do not claim trained SER.

---

## Labels

**Emotional state:** happy · sad · angry · fear · neutral · stress · confidence · excitement · urgency  

**Sentiment:** positive · neutral · negative · mixed  

**Tone:** formal · casual · urgent · empathetic · assertive · hesitant · neutral  

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Emotion Intelligence / Engine | `GET /v1/emotion/engine` + `/emotion-intelligence` |
| Detect (9 labels) | **Shipped** — `POST /v1/emotion/detect` (text and/or audio→STT) returns `emotionalState`, `sentiment`, `tone` |
| Sentiment / tone | **Shipped** — same detect path (lexicon heuristics) |
| Realtime | **Partial** — `POST /v1/emotion/stream` SSE (scores + sentiment + tone) |
| Acoustic SER | **Deferred** — soft energy/ZCR proxies only |
| Agent voice tone | Emotion Voice profiles + `/voice` native accent picker (`emotion` on `POST /v1/voice/simulate`) |
| GraphQL / SDK / CLI / Dashboard | `emotionEngine`, `detectEmotion`, `lugemi emotion-engine` |
| Related | Language Cloud `POST /v1/language-intelligence/emotion` remains separate |

---

## Honesty

Not a commercial Affective Computing lab and not NIST-certified emotion science. Cue lexicon + optional soft audio proxies. Confidence scores are heuristic, not calibrated model probabilities. See ADR-0073.
