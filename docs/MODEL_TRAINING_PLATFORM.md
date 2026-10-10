# Lugemi Model Training Platform

**Status:** Partial (VL-235 / library Phase 102)  
**Rule:** Orchestration and experiment plans over existing rented-GPU jobs (**VL-111**). Does **not** train competitive foundation weights, invent distributed GPU clusters, or ship RLHF/DPO labs. Roadmap: [`docs/roadmap/volume9-foundation-model-cloud/`](./roadmap/volume9-foundation-model-cloud/).

Volume 9 README: Cursor can write real MLOps tooling; it cannot train Atlas-class models without data/compute/research org.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Model Training Platform | **VL-235** — `/model-training-platform` + experiment plans |
| Distributed Training | **Deferred** — no multi-node fabric |
| LoRA | **Partial** — handoff to `POST /v1/training-jobs` |
| QLoRA | **Deferred** |
| RLHF / DPO | **Deferred** |
| Instruction Tuning | **Partial** — same VL-111 path |
| Synthetic Data | **Deferred** |
| Checkpointing | **Partial** — sandbox metadata on experiment plans |
| Model Versioning | **Partial** — links VL-110; FMC registry is VL-237 |
| GPU Scheduling | **Partial** — VL-111 launchers (manual/Modal/Vertex) |
| Experiment Tracking | **Partial** — org-scoped sandbox plans (not W&B/MLflow OS) |
| DDD / CQRS / Hexagonal | Bounded catalog CQRS slice — `hexagonalRewrite: false` |
| Terraform / Kubernetes | Shared platform — Fly default; optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/model-training-platform` |
| REST engine | `GET /v1/model-training-platform/engine` |
| REST methods | `GET /v1/model-training-platform/methods` |
| REST overview | `GET /v1/model-training-platform/overview` |
| Experiments | `GET/POST /v1/model-training-platform/experiments` |
| Launch handoff | `POST /v1/model-training-platform/experiments/:id/launch` |
| Checkpoint | `POST /v1/model-training-platform/experiments/:id/checkpoint` |
| Monitoring | `GET /v1/model-training-platform/monitoring` |
| GraphQL | `modelTrainingMethods` |
| SDK | `modelTrainingPlatformEngine()` |
| CLI | `lugemi model-training-platform-engine` |
| Underlying jobs | `/v1/training-jobs` (VL-111, ADR-0040) |

## Honesty

| Flag | Value |
| --- | --- |
| `trainsCompetitiveFoundationWeights` | false |
| `distributedTrainingOs` | false |
| `rlhfLabOs` | false |
| `wandbMlflowOs` | false |
| `regeneratesVl111` | false |
| `extendsTrainingJobs` | true |

See ADR-0136.
