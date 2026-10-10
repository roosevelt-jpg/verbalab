# Lugemi Voice Analytics

**Status:** Partial shipped (VL-178 / library Phase 35)  
**Rule:** Org voice usage/quality/revenue aggregates over metering + voice audits + marketplace sales. Do not claim BI cloud. Do not regenerate Speech Analytics (`/v1/speech-analytics`).

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Voice Analytics / Dashboard | **VL-178** — `GET /v1/voice-analytics/engine` + `/voice-analytics` |
| Voice Usage | **Shipped** — `GET /v1/voice-analytics/usage` (TTS + voice audits) |
| Languages | **Shipped** — synthesis language tags / voice id prefixes |
| Voices | **Shipped** — voice id frequency + clone inventory |
| Customers | **Partial** — API key prefixes with voice activity |
| Revenue | **Shipped** — Voice Marketplace publisher sales |
| Latency | **Partial** — latencyMs/durationMs when audits carry them |
| Quality | **Partial** — watermark rate, biometric confidence, marketplace ratings |
| Streaming | **Partial** — `tts.streamed` / `emotion_voice.streamed` counts |
| Downloads | **Partial** — audio delivery bytes proxy |
| Marketplace | **Shipped** — listing/install/review/sale slice |
| Reports / Monitoring | **Shipped** — `report`, `monitoring` |
| BI Dashboard Product | **Deferred** |
| GraphQL / SDK / CLI | `voiceAnalyticsEngine`, `voiceAnalyticsOverview`, `lugemi voice-analytics` |
| Related | Speech Analytics remains `/speech-analytics` (VL-159); Language Analytics `/analytics` |

---

## Honesty

Not Amplitude/Looker for voice. Latency/quality are proxies. See ADR-0089.
