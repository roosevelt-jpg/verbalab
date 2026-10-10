# ADR-0133: Policy Runtime as hard gate for Agent/Workflow/Plugin

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-222 (library “Phase 89 Policy Runtime” mapped)

## Context

Library Phase 89 asks for Policy Runtime covering security/compliance/org/AI/billing/regional/routing/governance policies plus engine/REST/GraphQL/SDK/monitoring/docs.

Volume 8 README is explicit: Policy Runtime must be a **hard gate** wired into Agent/Workflow/Plugin — requests get blocked — not logging/flagging after the fact.

## Decision

1. **Ship** `/v1/policy-runtime/*` with evaluate + org deny policies stored as kernel MemoryRecords.
2. **Hard gate** via `PolicyRuntimeService.assertHardGate` — deny → **403** (`policy_runtime_denied`).
3. **Wire** into `AgentPolicyGate` / `WorkflowPolicyGate` / `PluginPolicyGate` (awaited on every action).
4. **Global denies** always apply (even if mode=disabled for mutations).
5. **Honesty:** `hardGate: true`, `logOnly: false`, `opaOs: false`, `cedarOs: false`.
6. **Flip** AI Kernel catalog `policy-runtime` → `partial`; `deferred.policyRuntime` → false; runtime catalogs `policyRuntimeWired` → true.

## Consequences

- Agent/Workflow/Plugin cannot bypass Policy Runtime for allowed-list actions that org policies deny.
- Production Audit (VL-223) should verify end-to-end hard-gate behavior; no new feature sprawl.
