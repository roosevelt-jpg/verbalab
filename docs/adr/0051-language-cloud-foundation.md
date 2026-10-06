# ADR-0051: Language Cloud Foundation (hub over M5 products, not a linguistics OS)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-130 (library “Phase 6 Language Cloud Foundation” mapped)

## Context

Library Phase 6 asks for Translate, Detection, Dialect/Accent Detection, Grammar/Style AI, Localization, TM, Glossary, Terminology, Analytics, Quality — plus CQRS, hexagonal, GraphQL, unlimited dialects, country packs, Terraform/K8s regen. VerbaLab already ships M5 language depth (VL-050–054), locales (VL-102), coverage (VL-100), and language-pair analytics (VL-085). Regenerating those modules or inventing a linguistics OS would violate “extend, don’t regenerate.”

## Decision

1. **Map, don’t clone:** Document library terms → modules in `docs/LANGUAGE_CLOUD.md`.
2. **Language Cloud = parent hub** for existing language surfaces — not a new microservice.
3. **Ship:** `/language` console + `GET /v1/language/products` + `GET /v1/language/overview`.
4. **Terminology = glossary** (+ vertical packs). No separate termbase product in this phase.
5. **Defer:** Dialect/accent detection, Grammar AI, Writing Style AI, GraphQL, CQRS/hexagonal rewrite, unlimited dialects/accents, country/regional pack SKUs, K8s/Terraform regeneration.
6. **Architecture stays:** Nest modular monolith + REST + existing SDK/CLI — ENGINEERING_OS, not a greenfield DDD rewrite.

## Consequences

- Every language product remains discoverable from one hub.
- Dialect work stays scheduled under VL-122 (speech depth) / vision backlog when vendors allow.
