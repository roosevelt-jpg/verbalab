# ADR-0143: Context Fabric (router over Context Runtime)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-241 (library “Phase 108 Context Fabric” mapped)

## Context

Library Phase 108 asks for Context Fabric supporting user/workspace/conversation/agent/language/project/knowledge/model context, plus Context Router, REST, realtime APIs, SDK, monitoring, docs.

Context Runtime (VL-217) already assembles these blocks over Context Engine (VL-185). Regenerating that stack would violate “extend, don’t regenerate.”

## Decision

1. **Schedule** Context Fabric as executable **VL-241**.  
2. **Context Fabric = router + propagate façade** over Context Runtime — `regeneratesContextRuntime: false`.  
3. **Ship** capability catalog, routing table, `POST /route`, authenticated `POST /propagate` (assemble + optional Event Fabric CloudEvent).  
4. **Realtime:** SSE status ticks at `GET /stream` — `websocketOs: false`.  
5. **Agent context:** partial discovery to Agent Runtime until Agent Fabric (VL-246).  
6. **Surfaces:** `/context-fabric`, REST, GraphQL CQRS façades, SDK/CLI, docs + OpenAPI.  
7. **Honesty:** no infinite context window; Policy Fabric hard-gate still required later.  
8. Update AI Fabric catalog: Context Fabric bus → **shipped**.  
9. Do **not** regenerate Volumes 1–9 / Context Runtime / Context Engine.

## Consequences

- Cross-cloud context kinds are discoverable and plannable from one fabric hub.  
- Assembly stays in Context Runtime; Event Fabric carries optional propagation events.  
- Knowledge Fabric (VL-242) can specialize knowledge routing next.
