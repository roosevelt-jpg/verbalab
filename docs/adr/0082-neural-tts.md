# ADR-0082: Neural Text-to-Speech engine (product façade over vendor TTS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-171 (library “Phase 28 Neural Text-to-Speech” mapped)

## Context

Library Phase 28 asks for streaming/batch TTS, natural/male/female/children voices, multilingual/dialect/accent/personality/enterprise voices, plus REST/GraphQL/realtime/SDK/dashboard/monitoring/docs — “production deployment.”

VerbaLab already ships `POST /v1/audio/speech`, `GET /v1/audio/voices`, own TTS (VL-121), and clone speech (VL-064). Inventing a second synthesis stack or claiming child-voice / true streaming parity would violate honesty rules.

## Decision

1. **Neural TTS = product engine hub** under `/v1/tts/*` that wraps `AudioService.speak` / gateway voices.
2. **Ship:** engine catalog, enriched voice list + filters, batch `synthesize`, analytics, `/neural-tts` console, GraphQL/SDK/CLI, OpenAPI.
3. **Partial streaming:** `POST /v1/tts/stream` synthesizes fully then emits SSE base64 chunks — document as chunk SSE, not vendor streaming.
4. **Defer:** dedicated children voices; acoustic dialect/accent/emotion controls (emotion = Phase 30).
5. **Enterprise voices:** approved clones via authenticated `GET /v1/tts/voices/workspace`; consent/watermark unchanged (ADR-0042).
6. **Legacy paths remain:** `/v1/audio/speech` and `/v1/audio/voices` stay supported.

## Consequences

- Voice Cloud catalog points at `/v1/tts/engine` and `/neural-tts`.
- Later emotion/studio phases extend this engine instead of forking synthesis.
