# Workflow Operating System (VL-338)

Library Phase 205 — part of Volume 19 VAIOS (VerbaLab AI Operating System).

## Mission

VerbaLab Workflow Operating System is a **unifying orchestration façade** above AI Kernel (Volume 8),
AI Fabric (Volume 10), and Data Plane (Volume 18). It is not Linux, not Kubernetes,
and not a third parallel agent/workflow/memory implementation.

## Honesty

- `unifyingOrchestrationLayer=true`
- `duplicatesKernelOrFabric=false`
- `notLinux=true` / `notKubernetes=true` / `literalOsKernel=false`
- `enterpriseEngineeringSystemOs=false` (deferred past Volume 19)
- `unifyingOrchestrationLayer=true`

## Routes to (upstream)

- `workflow-runtime` → `/v1/workflow-runtime/engine` (Workflow Runtime)
- `workflow-marketplace` → `/v1/workflow-marketplace/engine` (Workflow Marketplace)
- `ai-kernel` → `/v1/ai-kernel/products` (AI Kernel workflow surface)

## Surfaces

- Console: `/workflow-operating-system`
- API: `/v1/workflow-operating-system/engine`
- ADR: [`docs/adr/0240-workflow-operating-system.md`](./adr/0240-workflow-operating-system.md)

---

## Volume status

**Volume 19** VAIOS (VL-334–343). Production Audit evidence: [`docs/vaios-audit/`](./vaios-audit/).
