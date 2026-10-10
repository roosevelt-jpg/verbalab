# Lugemi Workflow Runtime

**Status:** Partial shipped (VL-220 / library Phase 87)  
**Rule:** Workflows require **scoped permissions** and **sandboxing**. Missing permissions and globally denied actions are **hard-blocked**. Not live distributed-workflow OS. Extends product `/workflows` — does not regenerate it.

Part of the internal [AI Kernel](./AI_KERNEL.md) (Volume 8). Roadmap: [`docs/roadmap/volume8-ai-kernel/`](./roadmap/volume8-ai-kernel/).

---

## Safety (README Volume 8)

1. Every step passes `WorkflowPolicyGate` (local hard allowlist) before execution.
2. Globally denied: `external.execute`, `billing.charge`, `shell.exec`, `workflow.execute_live`, …
3. Allowed steps run as **simulated sandbox steps** — `liveStepExecution: false`.
4. Policy Runtime (VL-222) is wired (`policyRuntimeWired: true`) — org/global denies hard-block via `WorkflowPolicyGate`.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Workflow Execution | **Shipped** — sandbox sequential/parallel runs |
| Workflow Scheduling | **Partial** — record `runAt` (not cron fleet) |
| Retries | **Partial** — bounded sandbox retries |
| Human Approval | **Partial** — approval stub + `approved:true` on run |
| Rollback | **Partial** — run status marker (not distributed saga) |
| Parallel / Sequential | **Partial / Shipped** — in-process only |
| Distributed Execution | **Deferred** — not distributed-workflow parity |
| Versioning / Replay | **Shipped** — kernel MemoryRecords |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/workflow-runtime` |
| REST engine | `GET /v1/workflow-runtime/engine` |
| Workflows | `GET\|POST /v1/workflow-runtime/workflows` |
| Run / approve / schedule / rollback / replay | `POST /v1/workflow-runtime/*` |
| Product workflows (existing) | `/workflows` + `/v1/workflows` |
| GraphQL | `workflowRuntimeEngine` |
| SDK | `workflowRuntimeEngine()`, `workflowRuntimeCreate()`, `workflowRuntimeRun()` |
| CLI | `lugemi workflow-runtime-engine` |

## Grantable permissions

`reason.plan`, `memory.put`, `memory.search`, `context.assemble`, `workflow.approve`, `workflow.rollback`, `workflow.notify`, `workflow.schedule`

See ADR-0131.
