# VerbaLab Emotion Intelligence

**Status:** Partial shipped (VL-154 / library Phase 20)  
**Rule:** Speech Cloud emotion product. Do not regenerate Language Intelligence emotion. Do not claim trained SER.

---

## Labels

happy · sad · angry · fear · neutral · stress · confidence · excitement · urgency

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Emotion Intelligence / Engine | **VL-154** — `GET /v1/emotion/engine` + `/emotion-intelligence` |
| Detect (9 labels) | **Shipped** — `POST /v1/emotion/detect` (text and/or audio→STT) |
| Realtime | **Partial** — `POST /v1/emotion/stream` SSE |
| Acoustic SER | **Deferred** — soft energy/ZCR proxies only |
| GraphQL / SDK / CLI / Dashboard | `emotionEngine`, `detectEmotion`, `verbalab emotion-engine` |
| Related | Language Cloud `POST /v1/language-intelligence/emotion` (VL-144) remains separate |

---

## Honesty

Not Affectiva / Hume / Azure Emotion API. Cue lexicon + optional soft audio proxies. See ADR-0073.
