# ADR-0017: Embeddings API (gateway primitive)

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-063

## Context

RAG (VL-062) needs a shared embedding path. Ad-hoc embeds inside RAG would fork providers and metering.

## Decision

- Gateway `EmbeddingProvider` + `OpenAiEmbeddingsAdapter` (`OPENAI_API_KEY`, default model `text-embedding-3-small` / `OPENAI_EMBEDDINGS_MODEL`).
- Public `POST /v1/embeddings` (OpenAI-shaped): `input` string | string[], optional `model`.
- Meter `usage_events` feature `embeddings` / unit `tokens`.
- Export `EmbeddingsService` for RAG to call (no second HTTP hop required).
- Caps: `EMBEDDINGS_MAX_INPUTS` (64), `EMBEDDINGS_MAX_CHARS` (8000).

## Consequences

- Live embeds blocked without OpenAI key.
- Vector storage / pgvector is VL-062, not this phase.
