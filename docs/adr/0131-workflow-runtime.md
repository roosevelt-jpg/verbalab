# ADR-0131: Workflow Runtime (sandbox + hard permissions over /v1/workflows)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-220 (library “Phase 87 Workflow Runtime” mapped)

## Context

Library Phase 87 asks for Workflow Runtime with execution, scheduling, retries, human approval, rollback, parallel/sequential/distributed execution, versioning, replay, plus REST/GraphQL/SDK/monitoring/docs.

Volume 8 README requires scoped permissions and sandboxing for Workflow Runtime. Existing `/v1/workflows` already runs transcribe/translate/notify jobs — inventing Temporal/Airflow would violate “extend, don’t regenerate.”

## Decision

1. **Ship** `/v1/workflow-runtime/*` as the AI Kernel workflow surface (VL-220).
2. **Hard allowlist** via `WorkflowPolicyGate` — missing permission or globally denied action → deny.
3. **Sandbox execution only** — plan/memory/context/approve/notify/schedule; `liveStepExecution: false`.
4. **Extend** product workflows (`/workflows`, `/v1/workflows`) via links and honesty flags — do not replace them.
5. **Distributed execution deferred** (`temporalOs: false`, `airflowOs: false`).
6. **Policy Runtime** not fully wired yet (`policyRuntimeWired: false`) but local hard gate is mandatory from day one.
7. **Flip** AI Kernel catalog `workflow-runtime` → `partial`; `deferred.workflowRuntime` → false.

## Consequences

- Workflow Runtime is safe-by-default for demos without open live step execution.
- VL-221 Plugin Runtime must reuse the same permission/sandbox pattern; VL-222 becomes the shared hard gate.
