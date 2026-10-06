# ADR-0085: Voice Studio (SSML lite + linear timeline over Neural TTS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-174 (library “Phase 31 Voice Studio” mapped)

## Context

Library Phase 31 asks for a professional Voice Studio: library, editing, pronunciation, profiles, projects, preview, timeline, SSML, comparison, testing, generate, dashboard, REST/GraphQL/SDK/monitoring/docs.

VerbaLab already has African Voice Studio UX (`/audio`, VL-120), Neural TTS (VL-171), and Pronunciation Intelligence assessment (VL-156). Building a nonlinear DAW or claiming vendor SSML passthrough would be dishonest — OpenAI TTS does not accept SSML markup.

## Decision

1. Ship **Voice Studio** under `/v1/voice-studio/*` + console `/voice-studio`.  
2. **Keep** `/audio` as the VL-120 African studio surface; link both ways.  
3. **SSML lite** compiles `break` / `prosody` / `phoneme` / `say-as` to a plain speak/pause plan — vendors never receive SSML markup.  
4. **Timeline** is an ordered clip list with optional `pauseMsAfter` metadata; silence is not inserted without a DAW/ffmpeg path (`nonlinearDaw: false`).  
5. **Pronunciation editor** is a workspace grapheme→alias lexicon applied before TTS — distinct from VL-156 assess/coach.  
6. **Profiles / projects** persist presets and linear timelines in Postgres.  
7. Surfaces: engine, library, ssml/compile, pronunciation, profiles, projects, preview, generate, test, compare, timeline/render, analytics, GraphQL/SDK/CLI, docs.

## Consequences

- Voice Cloud catalog points `voice-studio` at `/v1/voice-studio/engine`.  
- Deferred: nonlinear NLE, waveform editing, vendor SSML engines, true pause audio insertion.  
- Pronunciation Intelligence (VL-156) remains the assessment product.
