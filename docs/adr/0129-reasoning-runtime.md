# ADR-0129: Reasoning Runtime (kernel over VL-186, not custom reasoner OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-218 (library “Phase 85 Reasoning Runtime” mapped)

## Context

Library Phase 85 asks for Reasoning Runtime with graphs/ToT/planning/reflection/tool+model selection/decision trees/self-eval/confidence/history/replay, plus REST/SDK/monitoring/docs.

VL-186 Reasoning Cloud already runs LLM-gateway strategies. Inventing a symbolic reasoner kernel or tool-executing agent OS would violate “extend, don’t regenerate” and Volume 8 action-safety (Agent Runtime must sandbox later).

## Decision

1. **Ship** `/v1/reasoning-runtime/*` as the AI Kernel reasoning surface (VL-218).
2. **Reuse** VL-186 `ReasoningCloudService.reason` for LLM strategies; AI Router for model selection; Decision Engine for decision-tree/confidence façades.
3. **Persist** history as VL-183 `MemoryRecord` rows tagged `metadata.runtime=reasoning-runtime` (+ `layer=kernel`).
4. **Forbid tool execution** here — selection only; Agent Runtime (VL-219) owns sandboxed actions.
5. **Heuristic** reflection/self-eval — not LLM-as-judge lab.
6. **Flip** AI Kernel catalog `reasoning-runtime` → `partial`; `deferred.reasoningRuntime` → false.

## Consequences

- Reasoning Runtime and Reasoning Cloud stay distinct consoles/APIs over one LLM strategy stack.
- Agent/Workflow/Plugin phases must not treat tool selection as execution authority.
