# Foundation Model Cloud — Architecture Report (VL-238)

**Date:** 2026-10-03  
**Scope:** VL-224, VL-235–237 (MLOps track); VL-225–234 deferred scaffolds

## Verdict

Foundation Model Cloud is a **hub + MLOps orchestration layer over Nest modular monolith modules**, not a frontier training cluster and not an OpenAI-replacement OS. REST is primary; GraphQL façades expose catalogs; CQRS applies to catalog slices.

## System shape

| Layer | Reality |
| --- | --- |
| Runtime | NestJS API (`apps/api`) + Next.js console (`apps/web`) |
| Data | Existing `fine_tune_jobs`, `model_registry`, eval snapshots + sandbox maps |
| Hub | `GET /v1/foundation-model-cloud/products` + `/foundation-model-cloud` |
| Training | `/model-training-platform` → VL-111 `/v1/training-jobs` |
| Evaluation | `/model-evaluation-platform` → VL-100 `/v1/eval/run` |
| Registry | `/model-registry` → VL-110 `/v1/models` |
| Deploy | Fly.io default; optional AWS EKS `af-south-1` |
| Blueprint | ADR-0080; Volume 9 MLOps track |

## Capability map (honest)

| Product | VL | Status note |
| --- | --- | --- |
| Foundation hub | 224 | Catalog + honesty |
| Atlas…Translate | 225–234 | Deferred scaffolds (no weights) |
| Training Platform | 235 | Partial — over VL-111 |
| Evaluation Platform | 236 | Partial — over VL-100 |
| Model Registry | 237 | Partial — over VL-110 |
| Production Audit | 238 | This gate |

## Integration findings

- FMC catalog lists Training/Eval/Registry as `partial` with console/API links.
- Training launch hands off to VL-111 (no regenerated job table).
- Evaluation translation hands off to VL-100; sandbox suites do not claim SOTA.
- Registry cards derive from VL-110; canary/shadow/blue-green are plan metadata only.
- Sibling Volumes 1–8 are **not** regenerated.

## Rejected architecture claims

- Trained competitive foundation weights / OpenAI replacement OS  
- Distributed RLHF/DPO/synthetic-data lab  
- Global LMSYS/MMLU leaderboard OS  
- MLflow / traffic-mesh canary OS  
- **AI Fabric invented in this audit** (Volume 10 recommendation only)
