# ADR-0123: AI Runtime Analytics (Inference aggregates, not BI/APM OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-212 (library “Phase 79 AI Runtime Analytics” mapped)

## Context

Library Phase 79 asks for runtime analytics covering latency, throughput, GPU/CPU, cache hits, requests, errors, cost, customers, models, streaming, plus dashboard/REST/SDK/monitoring/reports.

Sibling analytics already exist for Intelligence (VL-191), Knowledge (VL-202), Language/Speech/Voice. Inventing a BI dashboard OS or APM suite would duplicate and overshoot.

## Decision

1. Ship `/v1/ai-runtime-analytics/*` + `/ai-runtime-analytics` as an **aggregates-only** hub.
2. Read existing Inference Cloud ledgers (GPU, router, streaming, batch, cache, cost, serving) + `usage_events`.
3. Latency is best-effort from audit metadata + batch durations — not distributed tracing.
4. CPU is a Nest host/process snapshot — not cluster APM.
5. Cost surface is **report-only**; enforcement stays on VL-211.
6. Do **not** regenerate VL-191 / VL-202 / language analytics.
7. Flip Inference Cloud catalog `ai-runtime-analytics` to partial; deferred flag → false.

## Consequences

- Operators get one Inference Cloud runtime report without a new warehouse.
- True APM/BI/PDF scheduling remains out of scope until a deliberate product decision.
