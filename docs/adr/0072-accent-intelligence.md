# ADR-0072: Accent Intelligence (façade over VL-132 cues, not acoustic OS)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-153 (library “Phase 19 Accent Intelligence” mapped)

## Context

Library Phase 19 asks for accent/dialect detection, regional accent models, confidence, analytics, classification, engine, REST/SDK/dashboard/analytics/monitoring, and production deployment.

VL-132 already ships spoken accent profiles + text/audio detect (ADR-0053). VL-131 owns dialect detection in Language Cloud. Acoustic regional models remain deferred. Regenerating accents/dialects would violate extend-don’t-regenerate.

## Decision

1. Ship **Accent Intelligence** as an engine façade on the existing `accents` module: `GET /v1/accents/engine`, `GET /v1/accents/analytics`, `POST /v1/accents/classify`.
2. Keep `POST /v1/accents/detect` as the detection API; classify wraps detect with confidence bands + ranked candidates.
3. **Dialect detection** stays Language Cloud (`/v1/dialects/detect`) — catalog cross-link only.
4. **Regional accent models** remain **deferred** (not claimed shipped).
5. Surfaces: `/accent-intelligence` console, GraphQL `accentEngine` + `detectAccent`, SDK/CLI, docs, Speech Cloud catalog update.

## Consequences

- Speech Cloud Accent Intelligence is discoverable without inventing acoustics.
- Later acoustic vendors can swap behind the same detect/classify contract.
