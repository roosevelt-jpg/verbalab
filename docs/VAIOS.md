# VAIOS — Lugemi AI Operating System (VL-334)

Library Phase 201 — part of Volume 19 VAIOS.

## Mission

VAIOS is the highest-level **unifying orchestration layer** for Lugemi. It catalogs and
routes across AI Kernel (Volume 8), AI Fabric (Volume 10), and Data Plane Cloud (Volume 18).
It is **not** Linux, **not** Kubernetes, and **not** a third parallel agent/workflow/memory OS.

## Honesty

- `unifyingOrchestrationLayer=true`
- `duplicatesKernelOrFabric=false`
- `notLinux=true` / `notKubernetes=true` / `literalOsKernel=false`
- `enterpriseEngineeringSystemOs=false` (deferred past Volume 19)

## Products

| Hub | VL | Role |
| --- | --- | --- |
| vaios | 334 | Foundation catalog + Kernel/Fabric/Data Plane inventory |
| ai-scheduler | 335 | Scheduling unification |
| runtime-manager | 336 | Runtime lifecycle catalog |
| resource-manager | 337 | Resource allocation + GPU FinOps honesty |
| workflow-operating-system | 338 | Workflow OS façade |
| agent-operating-system | 339 | Agent OS façade |
| ai-memory-operating-system | 340 | Memory OS façade |
| knowledge-operating-system | 341 | Knowledge OS façade |
| plugin-operating-system | 342 | Plugin OS façade |

## Surfaces

- Console: `/vaios`
- API: `/v1/vaios/products` (also `/engine`, `/routing`, `/monitoring`, `/overview`)
- ADR: [`docs/adr/0236-vaios.md`](./adr/0236-vaios.md)

---

## Volume status

**Volume 19 closed** (VL-334–343). Production Audit evidence: [`docs/vaios-audit/`](./vaios-audit/).
Enterprise Engineering System deferred past Volume 19.
