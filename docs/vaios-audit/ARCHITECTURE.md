# VAIOS — Architecture Validation

## Role

VAIOS is the unifying orchestration layer above:

| Upstream | Volume | Role |
| --- | --- | --- |
| AI Kernel | 8 | Agent/Workflow/Plugin/Memory/Policy runtimes |
| AI Fabric | 10 | Cross-cloud buses |
| Data Plane Cloud | 18 | Thin execution runtimes |

## Pattern

Each VAIOS hub is a thin Nest façade:

1. Catalog of orchestration capabilities + `routesTo` upstream modules.
2. Service injects existing Kernel/Fabric/Data Plane Nest modules and exposes `route`/`execute`.
3. CQRS application slice + GraphQL + OpenAPI + SDK/CLI + web console.
4. Honesty: `unifyingOrchestrationLayer=true`, `duplicatesKernelOrFabric=false`, `notLinux`/`notKubernetes`.

## Upstream map

| Hub | Upstream |
| --- | --- |
| ai-scheduler | global-scheduler, gpu-runtime, gpu-platform, workflow-runtime, agent-runtime |
| runtime-manager | ai-kernel + agent/workflow/memory/policy/prompt/context/batch/streaming + data-plane-cloud |
| resource-manager | gpu-platform, gpu-runtime, ai-kernel |
| workflow-operating-system | workflow-runtime, workflow-marketplace, ai-kernel |
| agent-operating-system | agent-runtime, agent-fabric, agent-marketplace, ai-kernel, ai-fabric |
| ai-memory-operating-system | memory-runtime, memory-fabric, knowledge-memory, ai-kernel |
| knowledge-operating-system | knowledge-runtime, knowledge-fabric, knowledge-cloud, african-knowledge-graph |
| plugin-operating-system | plugin-runtime, plugin-marketplace, ai-kernel, policy-runtime |
