# Resource Manager (VL-337)

Library Phase 204 — part of Volume 19 VAIOS (Lugemi AI Operating System).

## Mission

Lugemi Resource Manager is a **unifying orchestration façade** above AI Kernel (Volume 8),
AI Fabric (Volume 10), and Data Plane (Volume 18). It is not Linux, not Kubernetes,
and not a third parallel agent/workflow/memory implementation.

## Honesty

- `unifyingOrchestrationLayer=true`
- `duplicatesKernelOrFabric=false`
- `notLinux=true` / `notKubernetes=true` / `literalOsKernel=false`
- `enterpriseEngineeringSystemOs=false` (deferred past Volume 19)
- `unifyingOrchestrationLayer=true`

## Routes to (upstream)

- `gpu-platform` → `/v1/gpu-platform/engine` (GPU Platform)
- `gpu-runtime` → `/v1/gpu-runtime/engine` (GPU Runtime)
- `ai-kernel` → `/v1/ai-kernel/products` (AI Kernel resource surfaces)

## Surfaces

- Console: `/resource-manager`
- API: `/v1/resource-manager/engine`
- ADR: [`docs/adr/0239-resource-manager.md`](./adr/0239-resource-manager.md)

---

## Volume status

**Volume 19** VAIOS (VL-334–343). Production Audit evidence: [`docs/vaios-audit/`](./vaios-audit/).
