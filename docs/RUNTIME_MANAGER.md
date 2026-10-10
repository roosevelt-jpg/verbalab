# Runtime Manager (VL-336)

Library Phase 203 — part of Volume 19 VAIOS (Lugemi AI Operating System).

## Mission

Lugemi Runtime Manager is a **unifying orchestration façade** above AI Kernel (Volume 8),
AI Fabric (Volume 10), and Data Plane (Volume 18). It is not Linux, not Kubernetes,
and not a third parallel agent/workflow/memory implementation.

## Honesty

- `unifyingOrchestrationLayer=true`
- `duplicatesKernelOrFabric=false`
- `notLinux=true` / `notKubernetes=true` / `literalOsKernel=false`
- `enterpriseEngineeringSystemOs=false` (deferred past Volume 19)
- `unifyingOrchestrationLayer=true`

## Routes to (upstream)

- `ai-kernel` → `/v1/ai-kernel/products` (AI Kernel inventory)
- `agent-runtime` → `/v1/agent-runtime/engine` (Agent Runtime)
- `workflow-runtime` → `/v1/workflow-runtime/engine` (Workflow Runtime)
- `memory-runtime` → `/v1/memory-runtime/engine` (Memory Runtime)
- `policy-runtime` → `/v1/policy-runtime/engine` (Policy Runtime)
- `prompt-runtime` → `/v1/prompt-runtime/engine` (Prompt Runtime)
- `context-runtime` → `/v1/context-runtime/engine` (Context Runtime)
- `batch-runtime` → `/v1/batch-runtime/engine` (Batch Runtime)
- `streaming-runtime` → `/v1/streaming-runtime/engine` (Streaming Runtime)
- `data-plane-cloud` → `/v1/data-plane-cloud/products` (Data Plane runtimes)

## Surfaces

- Console: `/runtime-manager`
- API: `/v1/runtime-manager/engine`
- ADR: [`docs/adr/0238-runtime-manager.md`](./adr/0238-runtime-manager.md)

---

## Volume status

**Volume 19** VAIOS (VL-334–343). Production Audit evidence: [`docs/vaios-audit/`](./vaios-audit/).
