# ADR-0084: Emotion Voice Engine (synthesis profiles over Neural TTS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-173 (library “Phase 30 Emotion Voice Engine” mapped)

## Context

Library Phase 30 asks for emotion-conditioned synthesis (happy/sad/angry/fear/excited/professional/calm/urgent/empathetic + medical/legal/sales/customer support) with REST/GraphQL/SDK/monitoring/docs.

Lugemi already has Neural TTS (VL-171) and Speech Emotion *detection* (VL-154). OpenAI TTS has no first-class emotion controls. Training an expressive TTS model is out of scope. Confusing detection with synthesis would violate product boundaries.

## Decision

1. Ship **Emotion Voice** under `/v1/emotion-voice/*` as a synthesis façade.  
2. **Profiles** map library labels → preferred voice + soft prosody transform + optional ElevenLabs style settings for `clone:{id}`.  
3. **Never** inject spoken stage directions into the text payload.  
4. **Honest statuses:** synthesis capabilities are `partial`; `trainedExpressiveModel: false`.  
5. Keep VL-154 Emotion Intelligence unchanged; cross-link only.  
6. Surfaces: engine, profiles, synthesize, stream, analytics, console, GraphQL/SDK/CLI, docs.

## Consequences

- Voice Cloud catalog marks emotion-voice `partial`.  
- Vendor expressive TTS can later replace soft prosody behind the same API.  
- Medical/legal profiles are domain *registers*, not clinical/legal advice products.
