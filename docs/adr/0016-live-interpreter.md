# ADR-0016: Live interpreter (compose STT → MT → TTS)

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-061

## Context

A high-demo product needs speech in one language and speech out in another. The clouds already exist (Whisper, Google MT, OpenAI TTS). Do not invent a new model stack.

## Decision

- `POST /v1/interpret` multipart: `file` + `target` + `voice` (+ optional `source`, `language`, `format`).
- Sequential compose via `AudioService.transcribe` → `TranslateService.translate` (`skipReview`) → `AudioService.speak`.
- Return JSON with `sourceText`, `targetText`, providers, and `audioBase64` (UI needs texts + playback).
- Skip MT when resolved source equals target; still run TTS.
- Metering stays inside the composed services (no double-count).
- No streaming / multi-turn sessions in this phase.

## Consequences

- Live path needs both `OPENAI_API_KEY` and MT credentials.
- Large replies are JSON+base64 — fine for demos; revisit binary multipart if payloads grow.
