# ADR-0007: OpenAI Whisper for speech-to-text

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-041

## Context

VL-041 needs vendor STT with usage metered in minutes. Roadmap options: Deepgram or OpenAI Whisper.

## Decision

- Use **OpenAI Whisper API** (`whisper-1`, `verbose_json` for duration).
- Env: `OPENAI_API_KEY` (required for live). Optional `OPENAI_WHISPER_MODEL`, `STT_TIMEOUT_MS`, `AUDIO_MAX_BYTES` (default 10 MiB).
- Route: `POST /v1/audio/transcriptions` (multipart `file`, optional `language`).
- Meter `usage_events` with `feature=stt`, `unitType=seconds`; API summary exposes minutes.
- Sync HTTP for MVP (files within size/timeout). Async jobs later if needed.
- Tests inject a fixture STT provider; never fake live success without a key.

## Consequences

- African-language accuracy depends on Whisper coverage; swap to Deepgram later via the same `SttProvider` interface if a contract requires it.
- Character billing quotas do not apply to STT yet (separate SKU metering only).
