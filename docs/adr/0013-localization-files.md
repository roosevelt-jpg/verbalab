# ADR-0013: Localization files (JSON/YAML)

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-053

## Context

Software teams ship i18n JSON/YAML. They need key-stable MT with ICU plural/variable passthrough, not a full TMS.

## Decision

- `POST /v1/localize` accepts JSON `{ format, source, target, content }`.
- `POST /v1/localize/file` accepts multipart `.json` / `.yaml` / `.yml`.
- Flatten string leaves, protect ICU (`{var}`, `{n, plural, ...}`) with placeholders, translate via existing translate pipeline (glossary + TM), restore ICU, reassemble tree.
- Cap: `LOCALIZE_MAX_STRINGS` (default 200), `LOCALIZE_MAX_BYTES` (default 512 KiB).
- Bulk mode uses `skipReview` on translate to avoid flooding quality reviews.
- Dependency: `yaml` package for parse/stringify.

## Consequences

- Nested ICU beyond one brace level may not fully protect — document and extend if needed.
- Not a Phrase/Lokalise competitor (no projects, screenshots, or workflow engine).
