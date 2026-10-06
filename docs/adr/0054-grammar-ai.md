# ADR-0054: Grammar AI (rules + optional LLM)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-133 (Language Cloud queue #3)

## Context

Library Grammar Intelligence asks for a full grammar OS (engines, vertical writing packs, analytics). ROADMAP maps this to “LLM prompts + glossary until proven.” VerbaLab already has chat (VL-060). We need a first-class `POST /v1/grammar/check` without claiming Grammarly parity or a morphology engine.

## Decision

1. **`POST /v1/grammar/check`** — returns `corrected` text + structured `issues` (type, severity, message, suggestion).
2. **Always run deterministic English-leaning rules** (spacing, repeated words, common misspellings, basic capitalization) so the product works without an API key.
3. **Optional LLM pass** when `OPENAI_API_KEY` is set — merge/override with structured JSON issues; meter as chat tokens.
4. **Language hint** optional; otherwise gateway detect. Non-English without LLM → rules-only with honest note.
5. **Out of scope:** Medical/legal/government writing products, style packs (VL-134), custom grammar engines, GraphQL.

## Consequences

- Console `/grammar`; Language Cloud marks grammar shipped (bounded).
- Next queue item: Writing Style AI.
