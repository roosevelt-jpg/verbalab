# ADR-0063: Grammar Intelligence Phase 10 (VL-142)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-142 (library Phase 10 Grammar Intelligence)

## Context

Library Phase 10 asks for Grammar Intelligence covering grammar/spell/sentence correction, writing/style suggestions, and professional/academic/medical/legal/government writing — plus engine, REST, SDK, dashboard, analytics, monitoring, docs, tests, and production deploy.

VL-133 (grammar check) and VL-134 (style rewrite) already ship bounded products. Claiming Grammarly parity or certified vertical writing OS products would violate VerbaLab honesty rules (ADR-0054/0055).

## Decision

1. Publish `GET /v1/grammar/intelligence` capability catalog.
2. Add `POST /v1/grammar/spell`, `/correct`, `/suggest` on the existing rules+LLM pipeline.
3. Extend style profiles with `medical`, `legal`, `government` as **tone-only** profiles with mandatory disclaimers — not clinical/legal/gov certification.
4. Ship `GET /v1/grammar/analytics` from audit events; GraphQL/SDK/dashboard `/grammar-intelligence`.
5. Production path remains the existing API deploy (Fly / optional EKS).

## Consequences

- Phase 10 “Generate” surfaces are covered without inventing a writing OS.
- True specialty writing products need a new ADR and compliance program.
