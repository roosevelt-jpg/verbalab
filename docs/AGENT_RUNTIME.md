# VerbaLab Agent Runtime

**Status:** Partial shipped (VL-219 / library Phase 86)  
**Rule:** Agents require **scoped permissions** and **sandboxing**. Missing permissions and globally denied actions are **hard-blocked** (403). Not open tool execution against real accounts/data. Not LangGraph/AutoGPT OS.

Part of the internal [AI Kernel](./AI_KERNEL.md) (Volume 8). Roadmap: [`docs/roadmap/volume8-ai-kernel/`](./roadmap/volume8-ai-kernel/).

---

## Safety (README Volume 8)

1. Every action passes `AgentPolicyGate` (local hard allowlist) before execution.
2. Globally denied: `external.execute`, `billing.charge`, `admin.impersonate`, `plugin.invoke`, `shell.exec`, …
3. Allowed actions run as **simulated sandbox steps** (plan/memory/context/tool-suggest) — `liveToolExecution: false`.
4. Policy Runtime (VL-222) is wired (`policyRuntimeWired: true`) — org/global denies hard-block via `AgentPolicyGate`.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Single Agents | **Shipped** — create/lifecycle/run |
| Multi-Agent / Collaboration | **Partial** — sandbox transcript exchange |
| Agent Scheduling | **Partial** — record `runAt` (not cron fleet) |
| Agent Memory | **Shipped** — Memory Runtime `scope=agent` |
| Agent Permissions | **Shipped** — hard allowlist gate |
| Agent Workflows | **Partial** — sandbox step plans; dedicated Workflow Runtime VL-220 |
| Agent Lifecycle | **Shipped** — draft/active/paused/archived |
| Marketplace Integration | **Partial** — listing counts when kind=agent exists |
| Realtime APIs | **Deferred** |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/agent-runtime` |
| REST engine | `GET /v1/agent-runtime/engine` |
| Agents | `GET\|POST /v1/agent-runtime/agents` |
| Run | `POST /v1/agent-runtime/run` |
| Collaborate / schedule / memory | `POST /v1/agent-runtime/collaborate\|schedule\|memory` |
| GraphQL | `agentRuntimeEngine` |
| SDK | `agentRuntimeEngine()`, `agentRuntimeCreate()`, `agentRuntimeRun()` |
| CLI | `verbalab agent-runtime-engine` |

## Grantable permissions

`reason.plan`, `reason.reason`, `memory.put`, `memory.search`, `context.assemble`, `tools.suggest`, `agent.message`, `agent.schedule`

See ADR-0130.
