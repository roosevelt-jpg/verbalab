# ADR-0130: Agent Runtime (sandbox + hard permissions, not open tool execution)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-219 (library “Phase 86 Agent Runtime” mapped)

## Context

Library Phase 86 asks for Agent Runtime with single/multi-agent, collaboration, scheduling, memory, permissions, workflows, lifecycle, marketplace, plus REST/SDK/realtime/monitoring.

Volume 8 README requires scoped permissions and sandboxing — an agent that “calls the function and hopes” is unsafe once connected to real accounts/data. Policy Runtime (VL-222) must eventually hard-gate Agent/Workflow/Plugin.

## Decision

1. **Ship** `/v1/agent-runtime/*` with agent CRUD/lifecycle stored as kernel MemoryRecords.
2. **Hard allowlist** via `AgentPolicyGate` — missing permission or globally denied action → **403** (not log-only).
3. **Sandbox execution only** — plan/memory/context/tool-suggest/message/schedule; `openToolExecution: false`, `liveToolExecution: false`.
4. **Reuse** Memory Runtime (agent scope), Reasoning Runtime (sandbox plan), Context Runtime (assemble).
5. **Multi-agent** = sandbox transcript collaboration, not a distributed agent OS.
6. **Policy Runtime** not fully wired yet (`policyRuntimeWired: false`) but local hard gate is mandatory from day one.
7. **Flip** AI Kernel catalog `agent-runtime` → `partial`; `deferred.agentRuntime` → false.

## Consequences

- Agent Runtime is safe-by-default for demos and production wiring without open tool execution.
- VL-220/221 must reuse the same permission/sandbox pattern; VL-222 must become the shared hard gate Agent already calls conceptually.
