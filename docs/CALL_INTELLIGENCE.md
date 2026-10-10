# Lugemi Call Intelligence

**Status:** Partial shipped (VL-158 / library Phase 24)  
**Rule:** Contact-center call ingest + heuristic analytics. Do not claim Gong/Chorus/Twilio Voice Intelligence. Do not regenerate Voice FAQ.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Call Intelligence Engine | **VL-158** — `GET /v1/call-intelligence/engine` + `/call-intelligence` |
| Call Recording | **Partial** — upload stored via local storage on ingest |
| Call Transcription | **Shipped** — Whisper STT or provided transcript |
| Call Summaries | **Partial** — extractive summary heuristics |
| Topic / Intent / Sentiment / Emotion | **Partial** — topic packs + Language/Emotion Intelligence signals |
| Compliance Detection | **Partial** — PCI/PII/profanity keyword heuristics — not certification |
| Sales Coaching / QA | **Partial** — rubric tips + scorecard heuristics |
| Reports | **Shipped** — `GET /v1/call-intelligence/report` |
| Realtime CCaaS | **Deferred** |
| GraphQL / SDK / CLI | `callIntelligenceEngine`, `ingestCall`, `lugemi call-engine` |
| Related | Voice FAQ remains `/voice` (VL-084) — not Call Intelligence |

---

## Honesty

Not Gong / Chorus / CallRail. Heuristic analysis on transcripts. See ADR-0077.
