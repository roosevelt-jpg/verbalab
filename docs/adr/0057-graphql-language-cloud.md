# ADR-0057: Bounded GraphQL façade (Language Cloud)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-136 (Language Cloud queue #6)

## Context

Library Language Cloud asks for GraphQL alongside REST. A full GraphQL rewrite of every module would duplicate surface area and violate “extend, don’t regenerate.” CQRS/hexagonal remains deferred.

## Decision

1. **Add NestJS Apollo GraphQL** at `POST /graphql` (Apollo Sandbox in non-production).
2. **Façade only:** resolvers call existing services (languages, dialects, accents, locales, country packs, style, grammar, language products).
3. **Public queries** for registries; **auth mutations** (`detectDialect`, `checkGrammar`, `rewriteStyle`) via existing TranslateAuth + rate limit (GraphQL-aware request extraction).
4. **Do not** expose jobs, billing, voice, or admin through GraphQL in this phase.
5. **Do not** introduce CQRS, schema stitching, or federation.

## Consequences

- REST remains the primary public API; GraphQL is opt-in for Language Cloud reads/writes listed above.
- Next queue: CQRS / hexagonal (still ask before rewrite).
