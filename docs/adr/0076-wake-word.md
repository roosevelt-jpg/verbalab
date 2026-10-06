# ADR-0076: Wake Word & Keyword Intelligence (transcript spotting)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-157 (library “Phase 23 Wake Word & Keyword Intelligence” mapped)

## Context

Library Phase 23 asks for wake word detection, keyword spotting, custom keywords, streaming/offline detection, enterprise triggers, plus engine/realtime/REST/SDK/monitoring/docs/production.

True always-on wake word engines (Picovoice Porcupine, Snowboy, Sensory) require specialized on-device DNNs and continuous audio pipelines. VerbaLab already has Whisper STT and Speech Cloud surfaces.

## Decision

1. Ship **Wake Word Engine** under `/v1/wake-word/*` with transcript/text phrase spotting.
2. Persist custom phrases in `wake_keywords` with kinds `wake_word` | `keyword` | `trigger`.
3. Include default wake phrases: hey verbalab / ok verbalab / verbalab.
4. **Streaming:** SSE after STT/text — not continuous mic DNN.
5. **Offline:** batch buffer spotting — not embedded on-device model packaging.
6. **Triggers:** match + audit only — not a workflow orchestration product.
7. Surfaces: engine, analytics, GraphQL, SDK/CLI, `/wake-word`, OpenAPI, Speech Cloud catalog `partial`.

## Consequences

- Speech Cloud gains wake/keyword APIs without false Porcupine parity.
- On-device DNN vendors can later replace spotting behind the same routes.
