# ADR-0145: Prompt Fabric (router over Prompt Runtime)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-243 (library “Phase 110 Prompt Fabric” mapped)

## Context

Library Phase 110 asks for Prompt Fabric supporting routing, versioning, synchronization, distribution, validation, and prompt policies — plus Prompt Platform, REST, SDK, dashboard, monitoring, docs.

Prompt Runtime (VL-216) already executes/routes/validates versioned prompts over VL-086 / VL-188. Regenerating that stack would violate “extend, don’t regenerate.”

## Decision

1. **Schedule** Prompt Fabric as executable **VL-243**.  
2. **Prompt Fabric = router + plan façade** over Prompt Runtime — `regeneratesPromptRuntime: false`.  
3. **Ship** capability catalog, routing table, `POST /route` (optional Prompt Runtime feature map), authenticated versions/validate, same-org distribute/sync, policies discovery via Policy Runtime.  
4. **Optional Event Fabric** CloudEvents for distribute/sync.  
5. **Honesty:** not prompt mesh / research lab / LLM-as-judge; Policy Fabric still required for fabric-wide hard gate.  
6. **Surfaces:** `/prompt-fabric` dashboard, REST, GraphQL CQRS, SDK/CLI, docs + OpenAPI.  
7. Update prior fabric deferred flags: Prompt Fabric → shipped.  
8. Do **not** regenerate Volumes 1–9 or Prompt Runtime / Prompt Intelligence.

## Consequences

- Prompt intents are discoverable and plannable from one fabric hub.  
- Prompt bodies stay in Prompt Runtime / VL-086; fabric records plans/cursors/events.  
- Reasoning Fabric (VL-244) can specialize reasoning routing next.
