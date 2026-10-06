# ADR-0148: Agent Fabric (router over Agent Runtime)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-246 (library “Phase 113 Agent Fabric” mapped)

## Context

Library Phase 113 asks for Agent Fabric supporting discovery, communication, collaboration, scheduling, federation, messaging, and marketplace integration — plus Agent Router, REST, SDK, realtime APIs, monitoring, docs.

Agent Runtime (VL-219) already provides sandboxed agents with permission allowlists, collaborate/schedule stubs, and Policy Runtime hard gates. Regenerating that stack would violate “extend, don’t regenerate.” Volume 10 README requires Agent Fabric to stay sandboxed + Policy-gated.

## Decision

1. **Schedule** Agent Fabric as executable **VL-246**.  
2. **Agent Fabric = router + discovery/collaborate/schedule façades** over Agent Runtime — `regeneratesAgentRuntime: false`.  
3. **Ship** capability catalog, routing table, pipelines, versions, discover/marketplace façades, same-org distribute, federation handoff catalog, SSE realtime ticks.  
4. **Optional Event Fabric** CloudEvents for distribute.  
5. **Honesty:** sandboxed; Policy Runtime hard-gate; not LangGraph/AutoGPT; no open/live tool execution.  
6. **Surfaces:** `/agent-fabric`, REST, GraphQL CQRS, SDK/CLI, docs + OpenAPI.  
7. Update prior fabric deferred flags: Agent Fabric → shipped.  
8. Do **not** regenerate Volumes 1–9 or Agent Runtime.

## Consequences

- Agent intents and pipelines are discoverable from one fabric hub.  
- Agent payloads stay in Agent Runtime; fabric records plans/events.  
- Policy Fabric (VL-247) must hard-gate fabric-wide next — not log-only.
