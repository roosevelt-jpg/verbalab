# ADR-0045: Own TTS path via rented HTTP endpoint

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-121

## Context

VL-120 shipped Voice Studio over OpenAI stock voices + ElevenLabs clones. Track 2 asks for an **own TTS path** without training a foundation model in-house.

## Decision

1. **Catalog:** African-focused voices with ids `own:*` (`sw-aisha`, `yo-tunde`, `am-hanna`, `en-kofi`) listed on `GET /v1/audio/voices` alongside OpenAI.
2. **Routing:** `GatewayService.synthesize` sends `own:*` to the own-TTS adapter; all other non-clone voices stay on OpenAI (default).
3. **Buy GPU host:** `OWN_TTS_URL` (+ optional `OWN_TTS_API_KEY`) POSTs `{ text, voice, language, format }` to a rented endpoint (Modal/vLLM/XTTS/compatible). Response = raw audio or `{ audioBase64 }`.
4. **No fake live GPU:** Without URL, synthesize returns `provider_not_configured`. Tests use `OWN_TTS_FIXTURE=1` / `FixtureOwnTtsAdapter` only.
5. **Studio:** Voice Studio groups “Own TTS (rented / African)” separately from stock and clones.

## Consequences

- OpenAI remains the safe default for `alloy` etc.
- Shipping real African own-TTS audio requires deploying an endpoint and setting `OWN_TTS_URL` — not empty folders.
- VL-122 may add streaming on top of this routing.
