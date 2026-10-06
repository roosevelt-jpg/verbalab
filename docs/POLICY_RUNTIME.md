# Lugemi Policy Runtime

**Status:** Partial shipped (VL-222 / library Phase 89)  
**Rule:** Policy Runtime is a **hard gate** wired into Agent / Workflow / Plugin Runtimes. Denied actions return **403** — not log/flag-only decoration. Not an OPA/Cedar enterprise GRC OS.

Part of the internal [AI Kernel](./AI_KERNEL.md) (Volume 8). Roadmap: [`docs/roadmap/volume8-ai-kernel/`](./roadmap/volume8-ai-kernel/).

---

## Safety (README Volume 8)

1. `AgentPolicyGate` / `WorkflowPolicyGate` / `PluginPolicyGate` call `PolicyRuntimeService.assertHardGate` before every action.
2. Global denies (`shell.exec`, `external.execute`, `billing.charge`, …) always hard-block.
3. Org deny policies hard-block matching runtime+action pairs.
4. `logOnly: false` — a policy engine nobody blocks with is decoration; this one blocks.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Security / AI / Org policies | **Shipped** — deny rules + global denies |
| Compliance / Billing / Regional / Routing / Governance | **Partial** — kind labels + deny rules; not GRC OS |
| Policy Engine | **Shipped** — hard allow/deny evaluate |
| Wired into Agent/Workflow/Plugin | **Shipped** — assertHardGate in gates |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/policy-runtime` |
| REST engine | `GET /v1/policy-runtime/engine` |
| Policies | `GET\|POST /v1/policy-runtime/policies` |
| Evaluate | `POST /v1/policy-runtime/evaluate` |
| GraphQL | `policyRuntimeEngine` |
| SDK | `policyRuntimeEngine()`, `policyRuntimeEvaluate()`, `policyRuntimeCreate()` |
| CLI | `lugemi policy-runtime-engine` |

See ADR-0133.
