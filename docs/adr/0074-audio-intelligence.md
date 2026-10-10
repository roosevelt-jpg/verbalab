# ADR-0074: Audio Intelligence (PCM heuristics + deferred AEC)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-155 (library “Phase 21 Audio Intelligence” mapped)

## Context

Library Phase 21 asks for noise detection/removal, echo cancellation, silence detection, enhancement, upscaling, background separation, voice isolation, plus engine/REST/SDK/realtime/monitoring/production.

True AEC needs a far-end reference or a vendor SDK. Neural denoise and stem separation are vendor/research products (Krisp, Demucs, Adobe Enhance). Lugemi already has Speech Cloud surfaces and PCM utilities from Speaker Intelligence.

## Decision

1. Ship **Audio Intelligence** under `/v1/audio-intelligence/*` with honest PCM energy heuristics.
2. **Analyze / silence:** noise floor, estimated SNR, silence regions.
3. **Enhance:** noise gate + mild high-pass + normalize — not ML denoise.
4. **Upscale:** linear sample-rate interpolation — not generative bandwidth extension.
5. **Isolate:** energy VAD attenuation — not multi-source separation.
6. **Echo cancellation:** deferred; status endpoint only.
7. **Realtime:** SSE analyze progress — not live AEC stream.
8. Surfaces: engine, analytics, GraphQL `audioEngine`, SDK/CLI, `/audio-intelligence`, OpenAPI, Speech Cloud catalog `partial`.

## Consequences

- Speech Cloud gains audio cleanup APIs without false vendor parity.
- AEC / neural denoise can later replace DSP behind the same routes.
