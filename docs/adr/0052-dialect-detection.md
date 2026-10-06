# ADR-0052: Dialect detection (curated registry + cue scoring)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-131 (first deferred Language Cloud item)

## Context

Language Cloud deferred dialect detection. Buyers need dialect labels for African languages without claiming “unlimited dialects” or a linguistics OS. Full speech-accent models belong with VL-122 streaming later.

## Decision

1. **Curated `dialects` table** seeded for priority languages (sw, yo, am, ar, en, ha, zu, af, …) — not unlimited.
2. **Detect pipeline:** resolve language (hint or gateway detect) → score dialect **cue terms** → optional OpenAI assist when cues are weak and `OPENAI_API_KEY` is set.
3. **APIs:** `GET /v1/dialects`, `POST /v1/dialects/detect` (API key or Clerk).
4. **Honest confidence:** low scores return `dialect: null` with candidates; never invent a dialect outside the registry.
5. **Accent detection remains next** (separate phase) — text cues ≠ accent.

## Consequences

- Console `/dialects` and Language Cloud mark dialect product as shipped (bounded).
- Next deferred item in queue: Accent Detection.
