# ADR-0010: Glossary via protect-and-restore

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-050

## Context

Enterprise buyers need fixed terminology (brand names, legal phrases). Google Cloud Translation Advanced supports glossaries, but that requires GCS + glossary resources. Basic API key Translate (ADR-0002) does not.

## Decision

- Store per-workspace terms in `glossary_terms` (source/target lang, source/target term, caseSensitivity, wholeWord).
- On `POST /v1/translate`, protect matching source terms with opaque placeholders (`⟦VLn⟧`), call the MT provider, restore placeholders to **target** terms, then enforce a final source→target pass.
- CRUD: `GET/POST/PATCH/DELETE /v1/glossary/terms` (Clerk session).
- Translate response includes `glossaryApplied` (count of protected matches).

## Consequences

- Works with any MT provider without vendor glossary APIs.
- Placeholders must survive the provider; fixture tests prove the path. If a live provider mangles placeholders, switch that pair to HTML `translate="no"` or Advanced Glossary later.
