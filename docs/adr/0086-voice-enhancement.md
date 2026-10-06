# ADR-0086: Voice Enhancement Platform (profiles over Audio Intelligence)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-175 (library “Phase 32 Voice Enhancement Platform” mapped)

## Context

Library Phase 32 asks for noise removal, echo cancellation, upscaling, restoration, mic/podcast/broadcast/meeting cleanup, enhancement engine, REST/realtime/SDK/monitoring/docs.

VerbaLab already ships Audio Intelligence PCM heuristics (VL-155). Claiming Krisp / Adobe Enhance / Demucs / live AEC would be dishonest. Full spectral ML denoise can be bought later behind the same API.

## Decision

1. Ship **Voice Enhancement** under `/v1/voice-enhancement/*` + console `/voice-enhancement`.  
2. **Extend** VL-155 DSP — do not regenerate Speech Cloud Audio Intelligence.  
3. **Profiles** compose enhance / isolate / upscale / soft-limit with honest parameter presets.  
4. **Echo cancellation** remains `deferred` (no AEC reference path).  
5. **Realtime** = SSE after full-buffer processing, not live AEC.  
6. Surfaces: engine, profiles, echo, enhance, upscale, enhance/stream, analytics, GraphQL/SDK/CLI, docs.

## Consequences

- Voice Cloud marks enhancement/restoration `partial`; mastering remains soft-limit only.  
- Vendor spectral ML can later replace profile DSP behind the same endpoints.  
- Legacy `/audio-intelligence` remains the analysis surface.
