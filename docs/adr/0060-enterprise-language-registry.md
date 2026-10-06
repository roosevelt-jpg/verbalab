# ADR-0060: Enterprise Language Registry (Phase 7 / VL-139)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-139 (library Phase 7 Language Registry)

## Context

Library Phase 7 asks for an “Enterprise Language Registry” covering every language, dialect, writing system, alphabet, script, locale, pronunciation/grammar/phonetic/morphology rule, and language family — plus REST, SDK, admin, analytics, validation, monitoring, docs, and production deploy.

VL-020 already shipped a curated language seed. Language Cloud (VL-102, VL-131–135) added locales, dialects, accents, and country packs. Claiming Ethnologue / full CLDR / linguistics-engine parity would violate VerbaLab’s “no fake completeness” rule.

## Decision

1. Ship a **curated enterprise registry** that supports every *registered* dimension the phase names (languages, dialects, writing systems/scripts/alphabets, locales, rule catalogs, families).
2. Add tables: `language_families`, `writing_systems`, `linguistic_rules`; extend `languages.family_code`.
3. Expose aggregated REST under `/v1/registry/*`, enrich `GET /v1/languages/:code`, SDK helpers, console `/registry`, analytics + validate + health endpoints.
4. Linguistic rules are **catalog metadata**, not morphology/phonetics engines (grammar *check* remains VL-133).
5. Production path: Prisma migration + boot seed with the existing API deploy (Fly default; optional EKS).

## Consequences

- Coverage grows by seeding, not by pretending infinite languages exist.
- Clients can validate codes before calling MT/STT.
- Further CLDR dumps or community-edited linguistics graphs need a new ADR.
