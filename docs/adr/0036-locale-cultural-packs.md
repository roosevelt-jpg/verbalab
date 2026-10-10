# ADR-0036: Locale and cultural packs

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-102

## Context

Government and media buyers need date/number/currency conventions, honorifics, and known untranslatable entities. Phase 129 in the library describes a full “cultural intelligence platform” — out of scope. Language registry (VL-020) holds codes only; glossary (VL-050) is workspace terminology.

## Decision

1. **Table:** `locale_packs` keyed by `language.code` with BCP-47, date/number/currency notes, honorifics JSON, `do_not_translate` string[], cultural notes.
2. **Seeds:** `en`, `fr`, `sw`, `yo`, `am` curated packs (upsert on boot after languages seed).
3. **API:** Public `GET /v1/locales`, `GET /v1/locales/:code`, `GET /v1/locales/:code/examples` (Intl samples).
4. **Translate:** Source-language do-not-translate entities use glossary protect/restore (source ≡ target).
5. **Helpers:** Thin `Intl` wrappers only — not ICU MessageFormat productization.
6. **Console:** `/locales` read-only browser.

## Consequences

- Not a CLDR/ICU platform; packs are editorial and expandable.
- Workspace glossaries still win for customer-specific terms.
- Festivals/taboos/etiquette engines remain out of scope.
