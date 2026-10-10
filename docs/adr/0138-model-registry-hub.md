# ADR-0138: Model Registry hub (over VL-110, not MLflow/mesh)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-237 (library “Phase 104 Model Registry” mapped)

## Context

Library Phase 104 asks for an enterprise model registry: model cards, versions, approvals, rollbacks, deployments, canary/shadow/blue-green — plus REST/SDK/dashboard/monitoring.

VL-110 already ships a bought-provider + fine-tune registry (ADR-0039) with public live matrix. Building MLflow or a traffic-mesh canary controller would regenerate that work and overclaim infrastructure.

## Decision

1. **Ship VL-237 as a governance hub** — `/model-registry` + engine/cards/versions/deployments/monitoring.
2. **Extend, don’t regenerate VL-110** — cards derive from `ModelsService`; live matrix remains `/v1/models/live`.
3. **Sandbox versions/approvals/rollbacks** — org-scoped plans; do not mutate cluster traffic.
4. **Deploy strategies (canary/shadow/blue-green)** — metadata on deploy plans with handoff to Model Serving; `trafficMeshOs: false`.
5. **Honesty:** `mlflowOs: false`, `automaticWeightDeploy: false`, `regeneratesVl110: false`.
6. **Architecture:** Nest modular monolith; CQRS GraphQL façade for capabilities.

## Consequences

- Operators get versioning/approval UX without a second registry database product.
- FMC Production Audit (VL-238) can verify MLOps track honesty next.
