# ADR-0111: Knowledge Intelligence (heuristic insight, not BI/Palantir OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-200 (library “Phase 67 Knowledge Intelligence” mapped)

## Context

Library Phase 67 asks for Knowledge Intelligence with discovery, linking, recommendations, validation, duplicate detection, evolution, confidence, plus engine/REST/GraphQL/SDK/analytics/monitoring/docs.

Knowledge Cloud already has EKB, Search, Ontology, Taxonomy, RAG, and Knowledge Memory. Intelligence Analytics (VL-191) aggregates Intelligence Cloud usage — regenerating it as Knowledge Intelligence would blur clouds.

## Decision

1. **Ship** `/v1/knowledge-intelligence/*` as a Knowledge Cloud product hub.
2. **Implement** heuristic discovery/link/recommend/validate/duplicates/confidence/evolution over existing Prisma knowledge surfaces.
3. **Defer** BI dashboard OS, Palantir-style knowledge OS, ML near-duplicate, calibrated confidence models.
4. **Keep distinct** from VL-191 Intelligence Analytics and from future VL-202 Knowledge Analytics pack.
5. **Flip** Knowledge Cloud catalog `knowledge-intelligence` → `partial`; deferred flag → false.

## Consequences

- Operators get workspace insight without a second analytics OS.
- Full Knowledge Analytics product remains Phase 69 / VL-202.
