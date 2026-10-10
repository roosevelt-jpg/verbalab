# Lugemi Model Serving

**Status:** Partial (VL-206 / library Phase 73)  
**Parent:** [Inference Cloud](./INFERENCE_CLOUD.md)  
**Rule:** Serving hub over **AI Gateway** + **`/v1/models`**. Authed sandbox deployments are org/workspace-scoped with light versioning, canary traffic %, blue/green slots, and rollback. Does **not** ship a vLLM, KServe, or Triton control plane. Inference traffic still goes through existing Gateway adapters.

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/model-serving` |
| Engine | `GET /v1/model-serving/engine` |
| Kinds / modes | `GET …/kinds` · `/modes` |
| Endpoints | `GET /v1/model-serving/endpoints` |
| Deployments | `GET/POST /v1/model-serving/deployments` |
| Traffic / promote / rollback / release | `POST …/deployments/:id/{traffic,promote,rollback,release,redeploy}` |
| Health / analytics / monitoring | `GET …/health` · `/analytics` · `/monitoring` |
| GraphQL | `modelServingEngine` |
| SDK / CLI | `modelServingEngine()` · `lugemi model-serving-engine` |

## Model kinds

| Kind | Status | Gateway path |
| --- | --- | --- |
| LLMs | partial | chat |
| Speech | partial | STT |
| Voice | partial | TTS |
| OCR | partial | OCR |
| Embedding | partial | embeddings |
| Vision | deferred | — |
| Reasoning | partial | Reasoning Cloud + chat |

## Serving modes

| Mode | Status |
| --- | --- |
| Streaming / Batch / Realtime | partial (existing Gateway / jobs; dedicated runtimes VL-208/209) |
| Autoscaling | deferred (GPU Platform hard ceilings for infra) |
| Canary / Blue-green / Rollback / Versioning | partial (sandbox deployment records) |

## Ceilings

| Control | Default | Env |
| --- | --- | --- |
| Serving mode | `sandbox` | `LUGEMI_MODEL_SERVING_MODE=disabled\|sandbox` |
| Max active deployments | 8 (cap 32) | `LUGEMI_MODEL_SERVING_MAX_ACTIVE` |

- Deploy returns **402** when the active-deployment ceiling would be exceeded.
- GPU spend ceilings remain on [GPU Platform](./GPU_PLATFORM.md) — Model Serving does not provision GPUs.

## Honesty

| Flag | Value |
| --- | --- |
| `vllmOs` | false |
| `kserveOs` | false |
| `tritonOs` | false |
| `selfHostedGpuServingOs` | false |
| `regeneratesAiGateway` | false |
| `extendsAiGateway` | true |
| `extendsModelRegistry` | true |
| `sandboxDeploymentsOnly` | true |
| `fullCanaryMeshOs` | false |
| `fullBlueGreenOs` | false |

See ADR-0117.
