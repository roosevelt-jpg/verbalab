# ADR-0066: Enterprise Translation Memory Phase 13 (VL-145)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-145 (library Phase 13 Translation Memory)

## Context

Library Phase 13 asks for Enterprise Translation Memory covering enterprise/workspace/project/shared memory, glossaries, terminology, translation history, similarity search, versioning — plus memory engine, vector search, REST, GraphQL, SDK, dashboard, monitoring, docs, tests, and production deploy.

VL-051 already ships workspace exact TM with translate bypass. Claiming Phrase/MemoQ/Trados parity or a full CAT tool would violate Lugemi honesty rules.

## Decision

1. Extend `TranslationMemoryEntry` with `scope`, `projectKey`, `version`, and optional pgvector `embedding`.
2. Add `TranslationMemoryVersion` snapshots when segment text changes.
3. Expand exact lookup to fall back to org `enterprise`/`shared` (and project when keyed).
4. Ship lexical similarity search always; optional vector re-rank when OpenAI embeddings are configured.
5. Publish `GET /v1/tm` catalog, search/history/terminology/analytics APIs, GraphQL/SDK, and enhance `/tm` dashboard.
6. Glossaries/terminology remain VL-050/103; TM exposes a terminology façade only.
7. Production path remains the existing API deploy (Fly / optional EKS) after migration.

## Consequences

- Phase 13 surfaces are covered without inventing a TMS company.
- True fuzzy CAT matching, multi-file projects, and vendor TMX sync need a new ADR.
