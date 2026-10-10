# ADR-0044: African Voice Studio UX (vendors only)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-120

## Context

Lugemi aims at an African ElevenLabs-like product surface. VL-042/VL-064 already ship stock TTS and consent-gated ElevenLabs Instant Voice Cloning. The `/audio` console was a thin operator panel, not a studio.

## Decision

1. **Studio UX, not models:** Reframe `/audio` as **Voice Studio** (AppShell label). No training, emotion engines, or clone marketplace.
2. **African presets:** Language chips `en` / `sw` / `yo` / `am` / `fr` with curated sample scripts; preview via existing `POST /v1/audio/speech`.
3. **Clone lifecycle in UI:** Multi-sample upload (≤5), status badges, Approve / Reject / Disable wired to existing `/v1/voice-clones*` APIs.
4. **Auth:** Prefer Clerk session for STT/TTS; optional `lg_live_` key fallback.
5. **Vendors unchanged:** OpenAI stock voices; ElevenLabs for clones (`clone:{id}` + watermark). Own TTS is VL-121.

## Consequences

- Product depth without faking a voice research lab.
- VL-121+ may add rented open-weight TTS beside OpenAI without rewriting the studio shell.
