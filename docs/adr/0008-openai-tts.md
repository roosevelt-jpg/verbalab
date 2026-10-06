# ADR-0008: OpenAI TTS for text-to-speech

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-042

## Context

VL-042 needs vendor TTS with a voice catalog. Roadmap options: Azure TTS or ElevenLabs. STT (VL-041) already uses OpenAI.

## Decision

- Use **OpenAI Audio Speech** (`tts-1`) with the built-in voice set (alloy, echo, fable, onyx, nova, shimmer).
- Same credential as Whisper: `OPENAI_API_KEY`. Optional `OPENAI_TTS_MODEL`, `TTS_MAX_CHARS` (4096), `TTS_TIMEOUT_MS`.
- `GET /v1/audio/voices` — catalog (no auth).
- `POST /v1/audio/speech` — JSON `{ text, voice, language?, format? }` → raw audio bytes (`audio/mpeg` default).
- Meter `usage_events` with `feature=tts`, `unitType=characters`.
- Tests inject a fixture TTS provider.

## Consequences

- Multilingual African voices are limited to what OpenAI supports; swap to ElevenLabs/Azure later via `TtsProvider` if a contract needs it.
- Binary response (not JSON) for speech audio; errors still use the JSON error envelope when thrown before the body is sent.
