# VerbaLab Pronunciation Intelligence

**Status:** Partial shipped (VL-156 / library Phase 22)  
**Rule:** Reference vs transcript assessment + fluency/phoneme/stress heuristics. Do not claim ELSA, SpeechAce, or forced-alignment phoneme ASR.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Pronunciation Intelligence / Engine | **VL-156** — `GET /v1/pronunciation/engine` + `/pronunciation-intelligence` |
| Pronunciation Assessment | **Shipped** — `POST /v1/pronunciation/assess` (text hypothesis or audio→STT) |
| Pronunciation Scoring | **Shipped** — `POST /v1/pronunciation/score` |
| Accent Coaching | **Partial** — `POST /v1/pronunciation/coach` tip packs (not acoustic accent models) |
| Phoneme Detection | **Partial** — `POST /v1/pronunciation/phonemes` dictionary + grapheme heuristics |
| Word Stress | **Partial** — syllable heuristics (EN first / SW penult) |
| Sentence Fluency | **Partial** — `POST /v1/pronunciation/fluency` speaking-rate + silence proxies |
| Language Learning | **Partial** — practice loop via assess/coach — not a full LMS |
| Forced alignment | **Deferred** |
| GraphQL / SDK / CLI | `pronunciationEngine`, `assessPronunciation`, `verbalab pronunciation-engine` |
| Analytics / Monitoring | Audit `pronunciation.*` + shared observability |
| Production | Shared Fly/Docker/K8s platform |

---

## Honesty

Not ELSA Speak / SpeechAce / Azure Pronunciation Assessment parity. Word alignment + PCM fluency proxies. See ADR-0075. Accent acoustic profiles remain Accent Intelligence (VL-153).
