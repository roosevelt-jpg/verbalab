# ADR-0055: Writing Style AI (bounded profiles + optional LLM)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-134 (Language Cloud queue #4)

## Context

Library Style Intelligence asks for formal/professional/academic/legal/medical/marketing tone detection and style transfer as a product suite. ROADMAP treats Grammar/Style as “LLM prompts until proven.” Grammar AI (VL-133) already ships check/correct. Style needs a first-class rewrite API without inventing vertical writing OS products.

## Decision

1. **Curated profiles only:** `professional`, `casual`, `concise`, `academic`, `plain` — not legal/medical/gov SKUs.
2. **`GET /v1/style/profiles`** + **`POST /v1/style/rewrite`** (`text`, `profile`, optional `language`).
3. **Deterministic transforms first** (contractions, fillers, formality swaps) so the API works without an LLM key.
4. **Optional LLM rewrite** when `OPENAI_API_KEY` is set — preserve meaning; meter as chat tokens.
5. **No tone-detection product** beyond returning the requested profile + notes. Style transfer across arbitrary authors is out of scope.

## Consequences

- Console `/style`; Language Cloud marks style shipped (bounded).
- Next queue item: Country / regional locale packs.
