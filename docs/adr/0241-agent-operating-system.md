# ADR-0241: Agent Operating System (VL-339)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-339 (library Phase 206)

## Context

Volume 19 builds VAIOS as the highest-level AI orchestration environment. Risk: reimplementing
agent execution, workflow engines, memory stores, or plugin sandboxes already shipped in
Volume 8 (AI Kernel) and Volume 10 (AI Fabric), inventing a literal Linux/Kubernetes OS,
or inventing the Enterprise Engineering System (Volume 20+).

## Decision

1. Ship `agent-operating-system` as a Nest hub with catalog + service + controller + CQRS + GraphQL + OpenAPI + SDK/CLI + web console.
2. Keep honesty flags explicit (`unifyingOrchestrationLayer=true`; `duplicatesKernelOrFabric=false`; `notLinux=true`; `notKubernetes=true`; `literalOsKernel=false`; `enterpriseEngineeringSystemOs=false`).
3. Route to existing Kernel / Fabric / Data Plane modules — do not copy-paste execution engines.
4. Reject third parallel OS invention and Enterprise Engineering System in this volume.

## Consequences

- Agent Operating System is discoverable under VAIOS Foundation.
- Operators can inspect routing catalogs with explicit unifying-layer honesty.
