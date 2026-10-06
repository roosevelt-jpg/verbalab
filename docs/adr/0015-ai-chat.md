# ADR-0015: AI Chat (gateway-backed)

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-060

## Context

Chat should help users discover the language platform without becoming a custom agent OS. It must reuse the AI gateway and existing auth.

## Decision

- `POST /v1/chat/completions` (OpenAI-shaped) via `GatewayService.chat` → `OpenAiChatAdapter` (`OPENAI_API_KEY`, model default `gpt-4o-mini` / `OPENAI_CHAT_MODEL`).
- Fixed VerbaLab language-intelligence system prompt; client `system` messages are ignored.
- Optional `translateReplyTo`: after completion, run `TranslateService` with `source=auto` and `skipReview`.
- Meter `usage_events` feature `chat` / unit `tokens` (no character quota gate yet).
- Console `/chat`; tests inject `setChatProviderForTests`.

## Consequences

- Live chat blocked without OpenAI key (same as STT/TTS).
- No conversation persistence, tools, or streaming in this phase.
