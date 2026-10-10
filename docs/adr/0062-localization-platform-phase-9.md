# ADR-0062: Localization Platform Phase 9 (VL-141)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-141 (library Phase 9 Localization Platform)

## Context

Library Phase 9 asks for an Enterprise Localization Platform covering applications, websites, mobile/desktop/games, documents/media, pluralization, gender, currency, timezone, dates, RTL, and L10n QA — plus engine, dashboard, REST, GraphQL, SDK, analytics, monitoring, docs, and production deploy.

VL-053 (JSON/YAML localize) and VL-102 (locale packs) already cover the software-string wedge. Claiming Phrase/Lokalise or app-store pipelines would be dishonest.

## Decision

1. Publish `GET /v1/localization` capability catalog with honest deferred surfaces.
2. Productize ICU with `POST /v1/icu/validate` and `POST /v1/icu/format` (Intl.PluralRules).
3. Add string catalog inventory and `POST /v1/localize/qa` (key/ICU/placeholder checks).
4. Add RTL layout metadata and timezone-aware `POST /v1/locales/format`.
5. GraphQL + SDK/CLI + `/localization` dashboard; document production via existing API deploy.

## Consequences

- Phase 9 “Generate” surfaces are covered for software strings.
- Website/mobile/game TMS needs a new ADR if ever pursued.
