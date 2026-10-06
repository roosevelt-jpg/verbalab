# ADR-0002: Google Cloud Translation as first MT provider

- **Status:** Accepted
- **Date:** 2026-09-06
- **Phase:** VL-022

## Context

Phase 1 needs one real machine-translation provider. DeepL has weaker African-language coverage. Azure and Google both fit; we pick one to avoid dual adapters in the first slice.

## Decision

Use **Google Cloud Translation API (v2, API key)** as the sole Phase 1 MT adapter behind the gateway.

## Consequences

- Env: `GOOGLE_TRANSLATE_API_KEY`
- Live calls only when the key is set; tests use fixtures / recorded responses
- DeepL or Azure can be added later as a second adapter, not a rewrite
