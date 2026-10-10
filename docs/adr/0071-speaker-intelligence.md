# ADR-0071: Speaker Intelligence (profiles + local fingerprints + gap diarization)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-152 (library “Phase 18 Speaker Intelligence” mapped)

## Context

Library Phase 18 asks for speaker identification, verification, diarization, profiles, voice fingerprints, history, realtime APIs, REST/GraphQL/SDK, monitoring, docs, and production deployment.

Lugemi has no NIST-grade biometric vendor and Whisper does not label speakers. Inventing a fake biometrics OS would violate honesty rules. VL-064 voice clones are TTS enrollment, not verification.

## Decision

1. Ship a **Speaker Intelligence** module (`/v1/speakers/*`) with workspace **profiles**, **history**, and an engine catalog.
2. **Fingerprints:** local energy/spectral envelope vectors (v1) stored on the profile — soft match only.
3. **Verify / identify:** cosine similarity with configurable thresholds; explicit “not anti-spoof / not NIST” notes.
4. **Diarization:** STT via Whisper → silence-gap turn clustering (`gap_diarization_v1`); SSE stream of turns. Mark **partial** — not neural diarization.
5. Surfaces: console `/speaker-intelligence`, GraphQL catalog + profile list/create, SDK/CLI, OpenAPI, SPEAKER_INTELLIGENCE.md.
6. Update Speech Cloud catalog row to `partial`; defer neural diarization / NIST biometrics.

## Consequences

- Customers get usable enrollment/match/diarize scaffolding with honest limits.
- Later vendor adapters (Deepgram/pyannote/etc.) can replace local fingerprint or gap diarization without regenerating the API surface.
