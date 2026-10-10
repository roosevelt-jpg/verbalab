# ADR-0078: Speech Analytics (usage + audit aggregates)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-159 (library “Phase 25 Speech Analytics” mapped)

## Context

Library Phase 25 asks for speech analytics tracking usage, recognition accuracy, languages, dialects, latency, errors, cost, customers, industries — plus dashboard/REST/GraphQL/SDK/reports/monitoring/production.

Language Analytics (VL-146) already covers translation-centric analytics. A Speech Analytics product should aggregate speech metering and Speech Cloud audits without regenerating `/v1/analytics` or claiming a BI/WER evaluation lab.

## Decision

1. Ship **Speech Analytics** under `/v1/speech-analytics/*`.
2. **Usage/cost:** from `usage_events` feature `stt`/`tts` + shared estimated rates.
3. **Languages/dialects/industries/customers:** from speech-related audit metadata and call records.
4. **Accuracy:** Whisper confidence (when audited), call QA, pronunciation scores — not golden-set WER.
5. **Latency:** audio duration percentiles from STT audits — not full request latency pipeline.
6. **Errors:** failed jobs + speech audit actions containing error/fail.
7. **WER lab / BI export schedules:** deferred.
8. Keep Language Analytics and `/usage` unchanged; cross-link only.
9. Surfaces: GraphQL, SDK/CLI, `/speech-analytics`, OpenAPI, Speech Cloud catalog `partial`.

## Consequences

- Speech Cloud gains a dedicated analytics product without BI/WER false parity.
- Future WER harness or request-latency tables can extend the same routes.
