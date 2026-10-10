# ADR-0126: Memory Runtime (kernel layer over VL-183, not Mem0 OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-215 (library “Phase 82 Memory Runtime” mapped)

## Context

Library Phase 82 asks for Memory Runtime with short/long/semantic/workspace/org/conversation/agent memory, compression, versioning, sync, eviction, encryption, replication, snapshots, plus REST/GraphQL/SDK/monitoring/docs.

VL-183 Memory Cloud already stores `memory_records` with GDPR export/erase. VL-199 Knowledge Memory tags `metadata.layer=knowledge`. Regenerating a third memory store or inventing Mem0/replication OS would violate “extend, don’t regenerate.”

## Decision

1. **Ship** `/v1/memory-runtime/*` as the AI Kernel memory surface (VL-215).
2. **Reuse** VL-183 `MemoryRecord` rows tagged `metadata.layer=kernel` (+ optional `encrypted`, `snapshot`, `runtime`).
3. **Ceilings** — hard `maxEntriesPerWorkspace` + short-term TTL; eviction enforces under ceiling (`402` when exceeded).
4. **Semantic / sync / encrypt / snapshots** — honest partial: text search, sync stamp, base64 encrypt tag, sandbox snapshot rows.
5. **Defer** multi-region replication OS; Agent Runtime sandbox remains VL-219.
6. **Do not** regenerate Memory Cloud or Knowledge Memory hubs.
7. **Flip** AI Kernel catalog `memory-runtime` → `partial`; `deferred.memoryRuntime` → false.

## Consequences

- Kernel, Knowledge, and Intelligence Memory Cloud stay distinct consoles/APIs over one storage model.
- Later Agent Runtime (VL-219) should write agent-scoped kernel memory with scoped permissions.
