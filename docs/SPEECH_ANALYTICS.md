# Lugemi Speech Analytics

**Status:** Partial shipped (VL-159 / library Phase 25)  
**Rule:** Org speech usage/quality analytics over metering + audits. Do not claim BI cloud or NIST WER lab. Do not regenerate Language Analytics (`/v1/analytics`).

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Speech Analytics / Dashboard | **VL-159** — `GET /v1/speech-analytics/engine` + `/speech-analytics` |
| Speech Usage | **Shipped** — `GET /v1/speech-analytics/usage` (STT/TTS) |
| Recognition Accuracy | **Partial** — confidence + call QA / pronunciation proxies — not golden WER |
| Languages | **Shipped** — STT + call language tags |
| Dialects | **Shipped** — dialect/accent detect audits |
| Latency | **Partial** — STT audio-duration percentiles — not HTTP p95 |
| Errors | **Partial** — failed jobs + speech error audits when present |
| Cost | **Shipped** — estimated STT/TTS USD |
| Customers | **Partial** — API key prefixes with speech activity |
| Industries | **Partial** — industry vocabulary pack usage |
| Reports / Monitoring | **Shipped** — `report`, `monitoring` |
| WER Evaluation Lab | **Deferred** |
| GraphQL / SDK / CLI | `speechAnalyticsEngine`, `speechAnalyticsOverview`, `lugemi speech-analytics` |
| Related | Language Analytics remains `/analytics` (VL-146); `/usage` still meters STT/TTS |

---

## Honesty

Not Amplitude/Looker for speech. Accuracy proxies only. See ADR-0078.
