# Voice Cloud — Performance Report (VL-179)

**Date:** 2026-10-03  
**Scope:** Bounded evidence only — not a load-test certification.

## What we measured

| Check | Method | Result |
| --- | --- | --- |
| Catalog load smoke | 24 sequential GETs across public voice catalogs | Completes &lt; 30s in audit test |
| Bounded stress smoke | 12 rapid sequential GETs to `/v1/voice-cloud/products` | All 200 in &lt; 15s (parallel bursts ECONNRESET under Nest/supertest here) |
| Streaming SSE smoke | `POST /v1/tts/stream` with API key (fixture TTS) | `text/event-stream` + `event: done` |
| Voice Analytics latency | `GET /v1/voice-analytics/latency` | Partial — only when audits carry latencyMs |
| Shared observability | `x-request-id` JSON logs | Shipped (VL-070) |

## What we did **not** claim

- No k6/Locust multi-region soak or stress certificate.
- No published p95 SLA for OpenAI/ElevenLabs TTS (depends on vendor).
- No vendor token-streaming realtime certification (chunk SSE after full synthesis).
- No cluster-wide voice latency product (in-process metrics remain per instance).

## Recommendations (ops)

1. Keep Redis + non-inline jobs in production (`JOBS_INLINE` unset).
2. Size API instances for TTS concurrency; watch vendor rate limits.
3. Use `/v1/voice-analytics/monitoring` + Fly/EKS metrics together.
