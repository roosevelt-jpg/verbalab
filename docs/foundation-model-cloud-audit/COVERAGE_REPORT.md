# Foundation Model Cloud — Coverage Report (VL-238)

**Date:** 2026-10-03

## Test coverage (audit gate)

| Suite | Focus |
| --- | --- |
| `foundation-model-cloud.spec.ts` | Hub catalog, honesty, GraphQL, no-TODO |
| `model-training-platform.spec.ts` | Methods, LoRA handoff, GraphQL, no-TODO |
| `model-evaluation-platform.spec.ts` | Suites, sandbox/handoff, leaderboard honesty, no-TODO |
| `model-registry.spec.ts` | Cards, versions, canary plan, rollback, no-TODO |
| `foundation-model-cloud-audit.spec.ts` | Integration + TODO scan + auth + honesty |

## Surface coverage

| Surface | Covered |
| --- | --- |
| REST engines (FMC/MTP/MEP/MR) | Yes |
| GraphQL façades | Yes |
| Console routes | Present (`/foundation-model-cloud`, `/model-training-platform`, `/model-evaluation-platform`, `/model-registry`) |
| SDK / CLI | Thin engine/product helpers |
| OpenAPI paths | Documented for hubs |
| Named FM training | Explicitly **not** covered (deferred) |

## Gaps (accepted)

- No frontier-scale training/eval corpora  
- No mesh traffic canary verification  
- Named-model scaffold phases not implemented (by Volume 9 README preference)
