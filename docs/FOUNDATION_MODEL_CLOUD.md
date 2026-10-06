# VerbaLab Foundation Model Cloud

**Status:** Volume MLOps track complete through Production Audit (VL-224 + VL-235–238 / library Phases 91 + 102–105)  
**Rule:** This volume ships **platform/MLOps scaffolding** — **not** trained competitive foundation weights. Extends Inference Cloud + AI Kernel. Do **not** regenerate Volumes 1–8 or claim OpenAI replacement. Roadmap: [`docs/roadmap/volume9-foundation-model-cloud/`](./roadmap/volume9-foundation-model-cloud/). Audit pack: [`docs/foundation-model-cloud-audit/`](./foundation-model-cloud-audit/).

Volume 9 README is explicit: Cursor can write training pipelines, evaluation harnesses, registries, and orchestration. It cannot train Atlas/Baobab/etc. without real datasets, GPU clusters, and a research team.

ADR-0041 deferred the *training program* (VL-112). VL-224+ ships an **honest platform hub + MLOps track** without fake completeness on weights.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Foundation Model Cloud Foundation | **VL-224** — `/foundation-model-cloud` + product catalog / overview |
| Atlas (Phase 92) | **Partial** — VL-225 ([`ATLAS.md`](./ATLAS.md)); scaffold only |
| Baobab … Translate (Phases 93–101) | **Deferred** scaffolds in catalog — no trained weights |
| Model Training Platform (Phase 102) | **Partial** — VL-235 ([`MODEL_TRAINING_PLATFORM.md`](./MODEL_TRAINING_PLATFORM.md)); over VL-111 |
| Model Evaluation Platform (Phase 103) | **Partial** — VL-236 ([`MODEL_EVALUATION_PLATFORM.md`](./MODEL_EVALUATION_PLATFORM.md)); over VL-100 |
| Model Registry (Phase 104) | **Partial** — VL-237 ([`MODEL_REGISTRY.md`](./MODEL_REGISTRY.md)); over VL-110 |
| Production Audit (Phase 105) | **Done** — **VL-238** evidence under [`foundation-model-cloud-audit/`](./foundation-model-cloud-audit/) |
| DDD / CQRS / Hexagonal | Bounded catalog CQRS slices — `hexagonalRewrite: false` |
| Terraform / Kubernetes | Shared platform — Fly default; optional EKS `af-south-1` |
| AI Fabric (library pitch) | **Not this volume** — Volume 10 when scheduled |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/foundation-model-cloud` |
| Training | `/model-training-platform` |
| Evaluation | `/model-evaluation-platform` |
| Registry hub | `/model-registry` |
| REST catalog | `GET /v1/foundation-model-cloud/products` (public) |
| REST engine | `GET /v1/foundation-model-cloud/engine` |
| REST overview | `GET /v1/foundation-model-cloud/overview` (Clerk session) |
| Monitoring | `GET /v1/foundation-model-cloud/monitoring` |
| GraphQL | `foundationModelCloudProducts` |
| OpenAPI | `/v1/openapi.json` |
| SDK | `foundationModelCloudProducts()` on `@verbalab/sdk` |
| CLI | `verbalab foundation-model-cloud-products` |

## Honesty

| Flag | Value |
| --- | --- |
| `customerFacingProduct` | true (discovery hub) |
| `trainsCompetitiveFoundationWeights` | false |
| `shipsTrainedAtlasBaobabEtc` | false |
| `openAiReplacementOs` | false |
| `regeneratesVolumes1to8` | false |
| `hexagonalRewrite` | false |
| `modelFamilyScaffoldCatalog` | true |

See ADR-0135 and ADR-0139.
