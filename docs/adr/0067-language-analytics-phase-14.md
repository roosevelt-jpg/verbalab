# ADR-0067: Language Analytics Phase 14 (VL-146)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-146 (library Phase 14 Language Analytics)

## Context

Library Phase 14 asks for a Language Analytics Platform covering translation/language/country/dialect usage, translation accuracy, quality scores, latency, costs, and enterprise reports — plus analytics engine, dashboards, REST, GraphQL, SDK, monitoring, docs, tests, and production deploy.

VL-085 already ships `GET /v1/analytics/overview`. Claiming a BI cloud, geo analytics, or human MT evaluation product would violate honesty rules.

## Decision

1. Publish `GET /v1/analytics` capability catalog.
2. Add dedicated endpoints for translation, languages, countries (inferred), dialects (audit), quality/accuracy proxy, latency, costs, monitoring, and enterprise report bundle.
3. Keep overview as the primary rollup; enterprise report composes the specialized views.
4. Ship GraphQL/SDK and enhance `/analytics` dashboard.
5. Production path remains the existing API deploy (Fly / optional EKS) — no new analytics warehouse.

## Consequences

- Phase 14 surfaces are covered without inventing an analytics company.
- True geo analytics, scheduled BI exports, and human eval accuracy need a new ADR.
