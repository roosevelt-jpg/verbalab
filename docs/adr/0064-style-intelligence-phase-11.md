# ADR-0064: Style Intelligence Phase 11 (VL-143)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-143 (library Phase 11 Style Intelligence)

## Context

Library Phase 11 asks for Writing Style Intelligence covering formal/professional/academic/legal/medical/business/marketing/technical/government/casual tones, tone detection, tone transformation, style transfer — plus engine, REST, GraphQL, SDK, monitoring, analytics, docs, and production deploy.

VL-134 already ships bounded rewrite profiles; VL-142 added domain tone profiles with disclaimers. Claiming author style cloning or certified vertical writing products would violate Lugemi honesty rules (ADR-0054/0055/0063).

## Decision

1. Publish `GET /v1/style/intelligence` capability catalog.
2. Extend profiles with `formal`, `business`, `marketing`, `technical` (marketing/medical/legal/government remain tone-only with disclaimers).
3. Add `POST /v1/style/detect` (heuristic cue scoring), `/transform` (target tone rewrite), `/transfer` (detect then rewrite).
4. Ship `GET /v1/style/analytics`, GraphQL/SDK/dashboard `/style-intelligence`.
5. Production path remains the existing API deploy (Fly / optional EKS).

## Consequences

- Phase 11 “Generate” surfaces are covered without inventing a style OS.
- True author-style models or specialty writing products need a new ADR and compliance program.
