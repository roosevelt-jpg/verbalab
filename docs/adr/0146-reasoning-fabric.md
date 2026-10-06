# ADR-0146: Reasoning Fabric (router over Reasoning Runtime)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-244 (library “Phase 111 Reasoning Fabric” mapped)

## Context

Library Phase 111 asks for Reasoning Fabric supporting distribution, replay, versioning, cache, federation, and pipelines — plus Reasoning Router, REST, GraphQL, SDK, monitoring, docs.

Reasoning Runtime (VL-218) already plans/reasons/reflects/evaluates and stores history for replay over Reasoning Cloud (VL-186). Regenerating that stack would violate “extend, don’t regenerate.”

## Decision

1. **Schedule** Reasoning Fabric as executable **VL-244**.  
2. **Reasoning Fabric = router + pipeline façade** over Reasoning Runtime — `regeneratesReasoningRuntime: false`.  
3. **Ship** capability catalog, routing table, pipelines, versions, history/replay façades, same-org distribute, federation handoff catalog, Intelligent Cache discovery.  
4. **Optional Event Fabric** CloudEvents for distribute.  
5. **Honesty:** not custom/symbolic reasoner OS; not tool-execution agent OS; not LLM-as-judge.  
6. **Surfaces:** `/reasoning-fabric`, REST, GraphQL CQRS, SDK/CLI, docs + OpenAPI.  
7. Update prior fabric deferred flags: Reasoning Fabric → shipped.  
8. Do **not** regenerate Volumes 1–9 or Reasoning Runtime / Reasoning Cloud.

## Consequences

- Reasoning intents and pipelines are discoverable from one fabric hub.  
- Run payloads stay in Reasoning Runtime MemoryRecords; fabric records plans/events.  
- Memory Fabric (VL-245) can specialize memory routing next.
