# Plugin Operating System (VL-342)

Library Phase 209 — part of Volume 19 VAIOS (Lugemi AI Operating System).

## Mission

Lugemi Plugin Operating System is a **unifying orchestration façade** above AI Kernel (Volume 8),
AI Fabric (Volume 10), and Data Plane (Volume 18). It is not Linux, not Kubernetes,
and not a third parallel agent/workflow/memory implementation.

## Honesty

- `unifyingOrchestrationLayer=true`
- `duplicatesKernelOrFabric=false`
- `notLinux=true` / `notKubernetes=true` / `literalOsKernel=false`
- `enterpriseEngineeringSystemOs=false` (deferred past Volume 19)
- `unifyingOrchestrationLayer=true`

## Routes to (upstream)

- `plugin-runtime` → `/v1/plugin-runtime/engine` (Plugin Runtime)
- `plugin-marketplace` → `/v1/plugin-marketplace/engine` (Plugin Marketplace)
- `ai-kernel` → `/v1/ai-kernel/products` (AI Kernel plugin surface)
- `policy-runtime` → `/v1/policy-runtime/engine` (Policy Runtime gates)

## Surfaces

- Console: `/plugin-operating-system`
- API: `/v1/plugin-operating-system/engine`
- ADR: [`docs/adr/0244-plugin-operating-system.md`](./adr/0244-plugin-operating-system.md)

---

## Volume status

**Volume 19** VAIOS (VL-334–343). Production Audit evidence: [`docs/vaios-audit/`](./vaios-audit/).
