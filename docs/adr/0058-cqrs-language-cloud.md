# ADR-0058: Bounded CQRS + ports/adapters (Language Cloud only)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-137 (Language Cloud queue #7)

## Context

Library Language Cloud asks for CQRS and hexagonal architecture. A full Nest rewrite into DDD aggregates/event sourcing would violate “extend, don’t regenerate” and duplicate every module. GraphQL (VL-136) already façades Language Cloud services.

## Decision

1. **Scope = Language Cloud application slice only** — not billing, jobs, voice, or the whole monolith.
2. **Ports** (`DialectPort`, `GrammarPort`, `StylePort`, `LanguageRegistryPort`, …) define application needs.
3. **Adapters** wrap existing Nest services (dialects, grammar, style, languages, accents, locales, country packs) — no service rewrites.
4. **CQRS** via `@nestjs/cqrs`: commands for mutations (`DetectDialect`, `CheckGrammar`, `RewriteStyle`); queries for registry reads.
5. **GraphQL resolver** talks to `CommandBus` / `QueryBus` only (hexagonal inbound adapter).
6. **REST controllers** for those products remain as-is (still call services directly) — dual inbound adapters are allowed during transition.
7. **Out of scope:** event sourcing, separate read DB, full hexagonal for every feature, Terraform/K8s.

## Consequences

- Architecture note `cqrs: true` means *bounded Language Cloud CQRS*, not platform-wide.
- Next deferred item: Terraform / Kubernetes (requires cloud-provider choice).
