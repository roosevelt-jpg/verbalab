# ADR-0193: MLOps & LLMOps Cloud Production Audit (VL-291)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-291 (library Phase 158 Production Audit)

## Context

Library Phase 158 asks for an MLOps Production Audit — hardening/review, not new features. Volume 14 covers VL-281–290 (foundation through AI Operations Dashboard). Risks: inventing Kubeflow/SageMaker/Vertex/W&B/MLflow/LangSmith/Ray OS, auto-promoting retrained models, hiding AgentOps policy violations in logs, or inventing Trust Cloud beyond scope.

## Decision

1. **Treat VL-291 as a review gate / checklist**, not a feature phase. Evidence pack under `docs/mlops-llmops-cloud-audit/`.
2. **Gate with vitest** (`mlops-llmops-cloud-audit.spec.ts`): no TODO/FIXME markers; all Volume 14 products shipped; Continuous Learning promote gates; AgentOps policy visibility; auth smoke on overview; GraphQL engines queryable.
3. **Reject inventing** Trust Cloud, Kubeflow/SageMaker/Vertex/W&B/MLflow/LangSmith/Ray OS, or auto-promote in this volume.
4. **Mark Volume 14 closed** in PROGRESS.md, CLOUD_BLUEPRINT.md, and MLOPS_LLMOPS_CLOUD.md.
5. Trust Cloud recommendations → Volume 15+ when scheduled.

## Consequences

- Volume 14 (VL-281–291) closes with honest ops-layer coverage and safety flags.
- Continuous Learning promote remains human-gated with drift + continuous-eval required checks.
- Trust Cloud remains deferred.
