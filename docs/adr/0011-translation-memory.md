# ADR-0011: Exact-match translation memory

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-051

## Context

Repeated enterprise segments should reuse approved translations and skip vendor MT (cost + consistency).

## Decision

- Store approved segments in `translation_memory_entries` keyed by workspace + language pair + SHA-256 of normalized source (`NFC`, trim, collapse whitespace).
- On `POST /v1/translate`, lookup exact approved hit **before** glossary/MT/quota. On hit: return `provider: "tm"`, `tmHit: true`, no vendor call, no character quota consumption (usage still logged with provider `tm`).
- CRUD: `GET/POST/DELETE /v1/tm/entries` (Clerk). POST upserts approved segments.
- Fuzzy match (`pg_trgm`) deferred until exact-match volume justifies it.

## Consequences

- Whitespace normalization means "Hello  world" matches "Hello world".
- Glossary is skipped on TM hit (approved TM is the final segment).
