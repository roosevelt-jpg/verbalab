# ADR-0050: AI Gateway Cloud Foundation (thin gateway, not an Inference Cloud)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-129 (library “Phase 5 AI Gateway Cloud Foundation” mapped)
- Closes: Volume 1 Part A (foundations)

## Context

Library Phase 5 asks for OpenAI, Claude, Gemini, DeepSeek, Qwen, Llama, Mistral, Whisper, deferred speech, OpenRouter, custom models, routing, fallback, caching, cost/latency optimization, streaming, and health. Lugemi already has a thin `GatewayService` (VL-021) with Google MT/detect/OCR, OpenAI chat/STT/TTS/embeddings, own TTS, fine-tune routing, and a model registry (VL-110). Rebuilding an OpenRouter/Inference mesh would violate VL-021 out-of-scope and regenerate prior work.

## Decision

1. **Map, don’t clone:** Document library terms → modules in `docs/AI_GATEWAY_CLOUD.md`.
2. **Shipped providers stay primary:** Google + OpenAI + own TTS + vendor voice clone clones + finetune routes.
3. **Optional chat fallback:** OpenAI-compatible OpenRouter adapter when `OPENROUTER_API_KEY` is set — one cheap/fast buy path, not a multi-LLM product.
4. **Gateway hub:** `/gateway` + `GET /v1/gateway/overview` + `GET /v1/gateway/providers` composing configured flags, live registry, fallbacks, and deferred catalog.
5. **Defer:** deferred chat/speech adapters first-class adapters, response caching, streaming-for-all, cost-optimizer product, regenerating the gateway.

## Consequences

- Volume 1A ends with an honest AI facade every later vertical already uses.
- New LLM vendors are added as adapters behind the gateway when a contract demands them — not as parallel SDKs in controllers.
