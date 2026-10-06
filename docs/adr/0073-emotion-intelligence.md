# ADR-0073: Emotion Intelligence (Speech Cloud cues + soft audio proxies)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-154 (library “Phase 20 Emotion Intelligence” mapped)

## Context

Library Phase 20 asks for emotion detection across happy/sad/angry/fear/neutral/stress/confidence/excitement/urgency plus realtime APIs, REST/GraphQL/SDK/dashboard/monitoring/docs/production deployment.

Language Intelligence (VL-144) already ships text emotion buckets (`joy`/`sadness`/…). A Speech Cloud product should not regenerate that module. Trained speech emotion recognition (SER) is research/vendor territory.

## Decision

1. Ship **Emotion Intelligence** under `/v1/emotion/*` with Speech Cloud label set (happy/sad/angry/fear/neutral/stress/confidence/excitement/urgency).
2. **Detect:** text cues; optional audio → Whisper STT + soft RMS/ZCR proxies (honest `audioAdjusted`).
3. **Realtime:** SSE `POST /v1/emotion/stream` — not continuous SER WebSocket.
4. Keep Language Intelligence emotion endpoints unchanged; catalog cross-link only.
5. Surfaces: engine, analytics, GraphQL, SDK/CLI, `/emotion-intelligence`, docs, Speech Cloud catalog `partial`.

## Consequences

- Speech Cloud gains an emotion product without claiming SER lab parity.
- Vendor SER can later replace cue/proxy scoring behind the same API.
