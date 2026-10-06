# ADR-0065: Language Intelligence Phase 12 (VL-144)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-144 (library Phase 12 Language Intelligence)

## Context

Library Phase 12 asks for a Language Intelligence Platform covering language/dialect/accent detection, intent, sentiment, emotion, readability, complexity, translation/speech confidence — plus realtime APIs, REST, GraphQL, SDK, dashboard, monitoring, docs, tests, and production deploy.

Lugemi already ships detect (VL-054), dialects (VL-131), accents (VL-132), and heuristic translation quality. Claiming a full NLP research OS, voice-emotion product, or trained NLU suite would violate honesty rules and the vision-backlog stance (ROADMAP: Grammar/Style/Language Intelligence → LLM prompts until proven).

## Decision

1. Publish `GET /v1/language-intelligence` capability catalog linking existing detect/dialect/accent APIs.
2. Add heuristic intent/sentiment/emotion/readability/complexity endpoints under `/v1/language-intelligence/*`.
3. Expose translation confidence via the existing quality-estimate heuristic; speech confidence via transcript heuristics (+ optional client STT score).
4. Ship SSE `analyze/stream` for progressive signals; GraphQL/SDK/dashboard `/language-intelligence`; analytics from audit events.
5. Production path remains the existing API deploy (Fly / optional EKS).

## Consequences

- Phase 12 “Generate” surfaces are covered without inventing an NLP company.
- True intent/sentiment/emotion models or acoustic confidence need a new ADR and vendor/model program.
