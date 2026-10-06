# Agent Operating System (VL-339)

Library Phase 206 — part of Volume 19 VAIOS (VerbaLab AI Operating System).

## Mission

VerbaLab Agent Operating System is a **unifying orchestration façade** above AI Kernel (Volume 8),
AI Fabric (Volume 10), and Data Plane (Volume 18). It is not Linux, not Kubernetes,
and not a third parallel agent/workflow/memory implementation.

## Honesty

- `unifyingOrchestrationLayer=true`
- `duplicatesKernelOrFabric=false`
- `notLinux=true` / `notKubernetes=true` / `literalOsKernel=false`
- `enterpriseEngineeringSystemOs=false` (deferred past Volume 19)
- `unifyingOrchestrationLayer=true`

## Routes to (upstream)

- `agent-runtime` → `/v1/agent-runtime/engine` (Agent Runtime)
- `agent-fabric` → `/v1/agent-fabric/products` (Agent Fabric)
- `agent-marketplace` → `/v1/agent-marketplace/engine` (Agent Marketplace)
- `ai-kernel` → `/v1/ai-kernel/products` (AI Kernel agent surface)
- `ai-fabric` → `/v1/ai-fabric/products` (AI Fabric)

## Surfaces

- Console: `/agent-operating-system`
- API: `/v1/agent-operating-system/engine`
- ADR: [`docs/adr/0241-agent-operating-system.md`](./adr/0241-agent-operating-system.md)

---

## Volume status

**Volume 19** VAIOS (VL-334–343). Production Audit evidence: [`docs/vaios-audit/`](./vaios-audit/).
