# Speech Cloud — Performance Report (VL-160)

**Date:** 2026-09-07  
**Scope:** Bounded evidence only — not a load-test certification.

## What we measured

| Check | Method | Result |
| --- | --- | --- |
| Catalog load smoke | 24 sequential GETs across public speech catalogs | Completes &lt; 30s in audit test |
| Bounded stress smoke | 12 parallel GETs to `/v1/speech/products` | All 200 in audit test |
| SSE realtime smoke | Emotion + wake-word SSE with API key | `text/event-stream` + `event: done` |
| Speech Analytics latency | `GET /v1/speech-analytics/latency` | Audio-duration percentiles (honest partial) |
| Shared observability | `x-request-id` JSON logs | Shipped (VL-070) |

## What we did **not** claim

- No k6/Locust multi-region soak or stress certificate.
- No published p95 SLA for Whisper/TTS (depends on OpenAI/vendor).
- No live-mic WebSocket realtime certification (deferred).
- No cluster-wide speech latency product (in-process metrics remain per instance).

## Recommendations (ops)

1. Keep Redis + non-inline jobs in production (`JOBS_INLINE` unset).
2. Size API instances for Whisper upload concurrency; watch vendor rate limits.
3. Use `/v1/speech-analytics/monitoring` + Fly/EKS metrics together.
