# ADR-0053: Accent detection (spoken-profile registry + STT-assisted cues)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-132 (Language Cloud queue #2)

## Context

Dialect detection (VL-131) labels written variety via lexical cues. Buyers also ask for “accent detection.” A production acoustic accent-ID model is a speech-research product (vision backlog / VL-122 streaming depth). VerbaLab must not claim phonetics ASR accent ID we do not run.

## Decision

1. **Curated `accents` table** — spoken accent *profiles* for priority African + related varieties (not unlimited).
2. **Detect pipeline:** optional audio → gateway STT (metered) → resolve language → score registry cue terms → optional LLM assist among candidates when `OPENAI_API_KEY` is set.
3. **APIs:** `GET /v1/accents`, `GET /v1/accents/:code`, `POST /v1/accents/detect` (JSON text and/or multipart `file`).
4. **Honesty:** responses note this is transcript-assisted profile labeling, not a dedicated acoustic accent classifier. Low confidence → `accent: null` + candidates. Never invent codes outside the registry.
5. **Dialect remains separate** — optional `relatedDialectCode` link only.

## Consequences

- Console `/accents`; Language Cloud marks accent product shipped (bounded).
- Next queue item: Grammar AI.
- Full streaming / vendor accent ID stays with VL-122 / buy path.
