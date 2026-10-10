# ADR-0042: Voice cloning via ElevenLabs (consent + review)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-064

## Context

Roadmap wants optional vendor voice cloning. Training cloning models in-house is out of scope and legally sensitive. OpenAI TTS (ADR-0008) covers stock voices only.

## Decision

1. **Buy ElevenLabs** Instant Voice Cloning (`ELEVENLABS_API_KEY`). No in-house clone training.
2. **Consent gate:** create requires `consentAttested=true` + non-empty `consentNotes`; samples stored under `voices/{org}/…`.
3. **Abuse review:** new clones start `pending_review`; owner/admin must approve (calls ElevenLabs / fixture) or reject before use.
4. **Watermark:** approved clones always `watermarkRequired`; speech returns `X-Lugemi-Watermark: required`.
5. **API:** Clerk ` /v1/voice-clones`; speak with `voice=clone:{id}` on `POST /v1/audio/speech` (TranslateAuth). Pro + owner/admin for create/review.
6. **CI:** `VOICE_CLONE_FIXTURE=1` or test fixture adapter — no fake live ElevenLabs success without a key.

## Consequences

- Legal review remains an org process; the product enforces attestation + human review hooks.
- Missing `ELEVENLABS_API_KEY` → approve fails with `provider_not_configured` (unless fixture).
- Stock OpenAI TTS unchanged for non-clone voices.
