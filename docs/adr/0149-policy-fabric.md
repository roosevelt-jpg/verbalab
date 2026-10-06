# ADR-0149: Policy Fabric (fabric-wide hard gate)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-247 (library “Phase 114 Policy Fabric” mapped)

## Context

Library Phase 114 asks for Policy Fabric supporting synchronization, distribution, federation, and security/compliance/billing/organization policies — plus Policy Engine, REST, SDK, monitoring, docs.

Volume 10 README requires Policy Fabric to be an **enforced gate across fabric buses**, not log-only. Policy Runtime (VL-222) already hard-gates Agent/Workflow/Plugin. Regenerating that stack would violate “extend, don’t regenerate.”

## Decision

1. **Schedule** Policy Fabric as executable **VL-247**.  
2. **Policy Fabric = router + fabric-wide hard gate** over Policy Runtime — `regeneratesPolicyRuntime: false`.  
3. **Ship** `FabricPolicyGate` that returns **403** on deny (fabric global denies + Policy Runtime assert).  
4. **Wire** the gate into Agent Fabric, Memory Fabric, and Policy Fabric distribute/sync paths.  
5. **Ship** capability catalog, routing table, pipelines, evaluate/assert façades, same-org sync/distribute, federation catalog.  
6. **Honesty:** not OPA/Cedar OS; not GRC OS; `logOnlyMode: false`.  
7. **Surfaces:** `/policy-fabric`, REST, GraphQL CQRS, SDK/CLI, docs + OpenAPI.  
8. Update prior fabric deferred flags: Policy Fabric → shipped.  
9. Do **not** regenerate Volumes 1–9 or Policy Runtime.

## Consequences

- Fabric distribute/sync planes can be hard-blocked.  
- Policy rows stay in Policy Runtime; fabric records plans/events.  
- AI Fabric Production Audit (VL-248) can review the full fabric stack next.
