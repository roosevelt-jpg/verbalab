# ADR-0070: Speech Recognition Engine (Whisper batch + segment SSE, not ASR OS)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-151 (library “Phase 17 Speech Recognition Engine” mapped)

## Context

Library Phase 17 asks for streaming + batch STT, realtime APIs, multilingual/auto-detect, custom/industry vocabulary (medical/legal/financial/government), subtitles, punctuation/capitalization, timestamps, confidence, plus REST/GraphQL/SDK/dashboard/monitoring/analytics and production deployment.

VerbaLab already ships file STT via OpenAI Whisper (`POST /v1/audio/transcriptions`, VL-041) and the Speech Cloud hub (VL-150). OpenAI Whisper has no first-party live-mic WebSocket. Inventing a speech-research OS or regenerating AudioModule would violate extend-don’t-regenerate.

## Decision

1. Ship **VerbaLab Speech Recognition Engine** as `speech-recognition` module under `/v1/speech/*` engine routes.
2. **Batch:** `POST /v1/speech/recognize` returns text, segments, timestamps, confidence, vocabulary flags; enrich Whisper adapter with `verbose_json` segments + optional `prompt`.
3. **Streaming/realtime:** `POST /v1/speech/stream` SSE emits `start` / `segment` / `done` after batch recognition — honest **partial** streaming, not live WebSocket.
4. **Vocabulary:** industry packs (static) + workspace custom phrases (Postgres) primed via Whisper prompt.
5. **Subtitles:** SRT/VTT from segments (`POST /v1/speech/subtitles`).
6. **Surfaces:** engine catalog, GraphQL `speechEngine` / `speechVocabularyPacks`, SDK/CLI, `/speech-recognition` dashboard, usage analytics endpoint.
7. **Defer:** live-mic WebSocket vendor sessions (buy/VL-122 depth), dedicated Speech Analytics product (Phase 25).

## Consequences

- Speech Cloud catalog marks streaming as `partial` with SSE API.
- Legacy `/v1/audio/transcriptions` remains; richer clients should prefer `/v1/speech/recognize`.
