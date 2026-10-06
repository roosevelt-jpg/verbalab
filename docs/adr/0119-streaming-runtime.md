# ADR-0119: Streaming Runtime (SSE hub, not WebSocket/gRPC OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-208 (library “Phase 75 Streaming Runtime” mapped)

## Context

Library Phase 75 asks for Streaming Runtime covering speech/voice/translation/LLM/video streaming, realtime APIs, WebSockets, SSE, and gRPC, plus engine/SDK/REST/monitoring/docs and production deployment.

VerbaLab already ships SSE on translate, speech recognition, neural TTS, and several Voice/Speech intelligence products. Inventing a WebSocket mesh, gRPC streaming plane, or video OS would violate extend-don’t-regenerate.

## Decision

1. Ship `/v1/streaming-runtime/*` + `/streaming-runtime` as an SSE **catalog + sandbox chunk** hub.
2. Link existing speech/voice/translation SSE; do not regenerate those controllers.
3. Provide sandbox `POST /v1/streaming-runtime/stream` that token-chunks text for `llm`/`translation`, and redirects speech/voice kinds to existing APIs.
4. Track org/workspace `StreamingSession` rows with chunk counts.
5. Defer WebSockets, gRPC, video streaming, and full OpenAI token-stream adapter OS.
6. Flip Inference Cloud catalog `streaming-runtime` to expose engine/console; deferred product flag → false.

## Consequences

- Developers discover all stream surfaces from one hub and can exercise sandbox LLM chunk SSE without a realtime OS.
- Product streams remain source of truth for speech/voice/translate.
- Bidirectional realtime and gRPC remain explicitly out of scope.
