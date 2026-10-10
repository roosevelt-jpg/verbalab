# AI Scheduler (VL-335)

Library Phase 202 — part of Volume 19 VAIOS (Lugemi AI Operating System).

## Mission

Lugemi AI Scheduler is a **unifying orchestration façade** above AI Kernel (Volume 8),
AI Fabric (Volume 10), and Data Plane (Volume 18). It is not Linux, not Kubernetes,
and not a third parallel agent/workflow/memory implementation.

## Honesty

- `unifyingOrchestrationLayer=true`
- `duplicatesKernelOrFabric=false`
- `notLinux=true` / `notKubernetes=true` / `literalOsKernel=false`
- `enterpriseEngineeringSystemOs=false` (deferred past Volume 19)
- `unifyingOrchestrationLayer=true`

## Routes to (upstream)

- `global-scheduler` → `/v1/global-scheduler/engine` (Global Scheduler)
- `gpu-runtime` → `/v1/gpu-runtime/engine` (GPU Runtime)
- `gpu-platform` → `/v1/gpu-platform/engine` (GPU Platform)
- `workflow-runtime` → `/v1/workflow-runtime/engine` (Workflow Runtime queues)
- `agent-runtime` → `/v1/agent-runtime/engine` (Agent Runtime queues)

## Surfaces

- Console: `/ai-scheduler`
- API: `/v1/ai-scheduler/engine`
- ADR: [`docs/adr/0237-ai-scheduler.md`](./adr/0237-ai-scheduler.md)

---

## Volume status

**Volume 19** VAIOS (VL-334–343). Production Audit evidence: [`docs/vaios-audit/`](./vaios-audit/).
