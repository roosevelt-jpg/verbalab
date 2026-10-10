# ADR-0136: Model Training Platform (orchestration over VL-111, not frontier lab)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-235 (library “Phase 102 Model Training Platform” mapped)

## Context

Library Phase 102 asks for an enterprise training platform: distributed training, LoRA/QLoRA, RLHF, DPO, instruction tuning, synthetic data, checkpointing, versioning, GPU scheduling, experiment tracking — plus dashboard/REST/SDK/monitoring.

VL-111 already ships rented-GPU / manual training jobs (ADR-0040). Volume 9 README forbids claiming trained competitive foundation models. Building a fake distributed RLHF cluster would violate honesty.

## Decision

1. **Ship VL-235 as a training orchestration hub** — `/model-training-platform` + engine/methods/experiments/monitoring.
2. **Launchable methods:** LoRA + instruction tuning only — hand off to `POST /v1/training-jobs` (do not regenerate VL-111).
3. **Defer:** distributed training, QLoRA, RLHF, DPO, synthetic data pipelines.
4. **Experiment tracking:** org-scoped sandbox plans with checkpoint metadata — not W&B/MLflow OS.
5. **GPU scheduling:** surface VL-111 launcher status (manual/Modal/Vertex/fixture).
6. **Architecture:** Nest modular monolith; CQRS GraphQL façade for methods; `hexagonalRewrite: false`.
7. Keep `trainsCompetitiveFoundationWeights: false` and ADR-0041/0135 honesty constraints.

## Consequences

- Operators get a discoverable MLOps surface without fake GPU success or fake weights.
- Evaluation Platform (VL-236) and Model Registry (VL-237) remain next on the Volume 9 MLOps track.
- Named-model scaffolds (Atlas…Translate) stay lower priority per Volume 9 README.
