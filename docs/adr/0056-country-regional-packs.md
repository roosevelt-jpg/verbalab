# ADR-0056: Country / regional locale packs

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-135 (Language Cloud queue #5)

## Context

Language Cloud deferred “country / regional packs” as separate SKUs. VL-102 already ships **language**-keyed `locale_packs` (en/fr/sw/yo/am). Buyers still need country-level bundles (currency, BCP-47 tags, linked languages/dialects) without regenerating locale packs or inventing a CLDR dump / commerce SKU engine.

## Decision

1. **New `country_packs` table** keyed by ISO 3166-1 alpha-2 — full ISO / UN-scale catalog (~195+), Africa-first ordering; curated cultural notes remain priority for African packs.
2. **Compose, don’t replace:** each pack lists `primaryLanguages`, `bcp47Tags`, optional dialect/accent codes, and country-specific notes; `GET /v1/country-packs/:code` optionally embeds linked VL-102 locale packs.
3. **APIs:** `GET /v1/country-packs`, `GET /v1/countries` (alias + `?picker=1`), `GET /v1/country-packs/:code`, filter `?region=`.
4. **Not a billing SKU catalog** — documentation/localization guidance packs only.
5. **Out of scope:** GraphQL, auto-CLDR sync, paid country SKUs, regenerating `locale_packs`.

## Consequences

- Console `/countries`; Language Cloud marks country packs shipped worldwide as a list; locale composition remains curated (not CLDR dialect completeness).
- Next queue: GraphQL (ask before large rewrite).
