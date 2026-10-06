# ADR-0110: Knowledge Memory (knowledge-layer over VL-183, not Mem0 OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-199 (library “Phase 66 Knowledge Memory” mapped)

## Context

Library Phase 66 asks for Knowledge Memory with persistent/org/workspace/user/conversation/AI memory, knowledge evolution/versioning, plus engine/REST/GraphQL/SDK/monitoring/docs.

Intelligence Memory Cloud (VL-183) already stores `memory_records` with GDPR export/erase. Knowledge Cloud catalog deferred a separate Knowledge Memory product as distinct from that hub. Regenerating a second memory table/OS would violate “extend, don’t regenerate.”

## Decision

1. **Ship** `/v1/knowledge-memory/*` as the Knowledge Cloud product surface.
2. **Reuse** VL-183 `MemoryRecord` rows tagged `metadata.layer=knowledge` (+ `kmScope`, optional `documentId`, `evolution[]`).
3. **Map** library scopes (user/ai/…) onto Memory Cloud scopes without inventing Mem0/Zep.
4. **Evolution / versioning** = revise + append bounded history; not a full VCS.
5. **GDPR** remains on Memory Cloud export/erase (same rows).
6. **Flip** Knowledge Cloud catalog `knowledge-memory` → `partial`; deferred flag → false.

## Consequences

- Knowledge Memory and Memory Cloud stay distinct consoles/APIs over one storage model.
- Vector semantic memory over memory rows stays deferred.
