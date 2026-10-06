# ADR-0147: Memory Fabric (router over Memory Runtime)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-245 (library “Phase 112 Memory Fabric” mapped)

## Context

Library Phase 112 asks for Memory Fabric supporting synchronization, replication, federation, distribution, and short/long-term/workspace memory — plus Memory Router, REST, SDK, monitoring, docs.

Memory Runtime (VL-215) already provides kernel-layer put/list/search/sync/snapshots over Memory Cloud (VL-183). Regenerating that stack would violate “extend, don’t regenerate.”

## Decision

1. **Schedule** Memory Fabric as executable **VL-245**.  
2. **Memory Fabric = router + sync/distribute façade** over Memory Runtime — `regeneratesMemoryRuntime: false`.  
3. **Ship** capability catalog, routing table, pipelines, versions, sync/list/search façades, same-org distribute/replicate plans, federation handoff catalog, Intelligent Cache discovery.  
4. **Optional Event Fabric** CloudEvents for distribute.  
5. **Honesty:** not Mem0 OS; not multi-region replication OS; not infinite personalization.  
6. **Surfaces:** `/memory-fabric`, REST, GraphQL CQRS, SDK/CLI, docs + OpenAPI.  
7. Update prior fabric deferred flags: Memory Fabric → shipped.  
8. Do **not** regenerate Volumes 1–9 or Memory Runtime / Memory Cloud.

## Consequences

- Memory intents and pipelines are discoverable from one fabric hub.  
- MemoryRecords stay in Memory Runtime / Memory Cloud; fabric records plans/events.  
- Agent Fabric (VL-246) can specialize agent routing next — must stay sandboxed + Policy-gated.
