# ADR-0077: Call Intelligence (heuristic contact-center analytics)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-158 (library “Phase 24 Call Intelligence” mapped)

## Context

Library Phase 24 asks for enterprise call intelligence: recording, transcription, summaries, topics, intent, sentiment, emotion, compliance, sales coaching, QA, plus engine/REST/GraphQL/SDK/dashboard/monitoring/reports/production.

Commercial products (Gong, Chorus, Twilio Voice Intelligence) combine dialers, realtime agent assist, and proprietary models. Lugemi already has Whisper STT, Language Intelligence signals, Emotion Intelligence cues, and Voice FAQ (Twilio bilingual agent) — which must remain a separate product.

## Decision

1. Ship **Call Intelligence** under `/v1/call-intelligence/*` with persisted `call_records`.
2. **Ingest:** transcript text and/or audio upload (local storage recording key).
3. **Transcribe:** Whisper when audio lacks transcript; meter STT usage.
4. **Analyze:** extractive summary, topic packs, reuse Language/Emotion signal helpers, compliance keyword flags, coaching tips, QA scorecard.
5. **Reports/analytics:** workspace aggregates + audit actions.
6. **Realtime CCaaS / dialer streaming:** deferred.
7. Do **not** regenerate or subsume Voice FAQ (`/voice`).
8. Surfaces: GraphQL, SDK/CLI, `/call-intelligence`, OpenAPI, Speech Cloud catalog `partial`.

## Consequences

- Speech Cloud gains contact-center analytics without Gong parity claims.
- Vendor CCaaS integrations can later replace heuristics behind the same call APIs.
