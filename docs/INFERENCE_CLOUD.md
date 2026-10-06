# VerbaLab Inference Cloud

**Status:** Volume complete through Production Audit (VL-204–213 / library Phases 71–80)  
**Rule:** Shared model runtime layer underneath AI Orchestration and every product cloud that calls a model. Extends **AI Gateway (VL-021)** + chat/embeddings. Do **not** regenerate Gateway, Intelligence, Knowledge, or invent a GPU hyperscaler / multi-region Inference OS. Follow the [12-layer Cloud Blueprint](./CLOUD_BLUEPRINT.md) (ADR-0080). Roadmap: [`docs/roadmap/volume7-inference-cloud/`](./roadmap/volume7-inference-cloud/). Evidence: [`docs/inference-cloud-audit/`](./inference-cloud-audit/).

Volumes 1–6 already ship Language, Speech, Voice, Intelligence, and Knowledge clouds. They call vendor models through the Gateway today — this volume layers a discoverable Inference hub without cloning those products.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Inference Cloud Foundation | **VL-204** — `/inference-cloud` + product catalog / overview |
| GPU Platform | **Partial** — **VL-205** `/gpu-platform` sandbox + hard ceilings; no cloud GPU APIs |
| Model Serving | **Partial** — **VL-206** `/model-serving` hub + sandbox canary/blue-green/rollback; not vLLM OS |
| AI Router | **Partial** — **VL-207** `/ai-router` dry-run resolve over Gateway; not a mesh |
| Streaming Runtime | **Partial** — **VL-208** `/streaming-runtime` SSE hub + sandbox LLM chunks; WS/gRPC/video deferred |
| Batch Runtime | **Partial** — **VL-209** `/batch-runtime` over BullMQ + sandbox runs; not Spark/Airflow |
| Intelligent Cache | **Partial** — **VL-210** `/intelligent-cache` opt-in exact-key store; not Redis/vector OS |
| Cost Optimization Engine | **Partial** — **VL-211** `/cost-optimization` hard daily/monthly enforce; not FinOps/Spot OS |
| AI Runtime Analytics | **Partial** — **VL-212** `/ai-runtime-analytics` Inference aggregates; ≠ VL-191/202; not BI/APM OS |
| Production Audit | **Done** — **VL-213** evidence pack under `docs/inference-cloud-audit/` |
| CPU Runtime | **Partial** — Nest + vendor HTTP adapters |
| Model Registry Integration | **Partial** — links `/models` (not regenerated) |
| Autoscaling / Multi Region | **Deferred** — hard ceilings; no open-ended GPU autoscale |
| GraphQL / CQRS | Bounded Inference Cloud catalog slice |
| Terraform / Kubernetes | Shared platform — Fly default; optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console hub | `/inference-cloud` |
| REST catalog | `GET /v1/inference-cloud/products` (public) |
| REST overview | `GET /v1/inference-cloud/overview` (Clerk session) |
| GraphQL | `inferenceProducts` |
| OpenAPI | `/v1/openapi.json` |
| SDK | `inferenceProducts()` on `@verbalab/sdk` |
| CLI | `verbalab inference-products` |
| GPU Platform | `/gpu-platform` · `GET /v1/gpu-platform/engine` (VL-205) |
| Model Serving | `/model-serving` · `GET /v1/model-serving/engine` (VL-206) |
| AI Router | `/ai-router` · `GET /v1/ai-router/engine` · `POST …/resolve` (VL-207) |
| Streaming Runtime | `/streaming-runtime` · `GET /v1/streaming-runtime/engine` · `POST …/stream` (VL-208) |
| Batch Runtime | `/batch-runtime` · `GET /v1/batch-runtime/engine` · `POST …/runs` (VL-209) |
| Intelligent Cache | `/intelligent-cache` · `GET /v1/intelligent-cache/engine` · `POST …/put|lookup` (VL-210) |
| Cost Optimization | `/cost-optimization` · `GET /v1/cost-optimization/engine` · `POST …/record|check` (VL-211) |
| AI Runtime Analytics | `/ai-runtime-analytics` · `GET /v1/ai-runtime-analytics/engine` · `/overview` (VL-212) |
| Existing Gateway | `/gateway` · VL-021 |
| Existing models | `/models` |

---

## Spend safety (README)

1. **Phase 72 / GPU Platform** — do not point at a production billing account without sandbox spend limits / budget alerts. Scaling must have a **hard ceiling** (max instances / max spend), not only a target.
2. **Phase 78 / Cost Optimization** — must **enforce** spend limits, not only report cost after the fact.
3. Compiling + green tests is **not** enough before connecting to a real cloud bill.

## Honesty

Inference Cloud is **not** a GPU hyperscaler, multi-region runtime OS, or replacement for the AI Gateway. It is a **bounded hub** that makes the shared model-runtime roadmap discoverable and schedules GPU/serving/router/cache/cost products with **spend-safety constraints from day one**. See ADR-0115.
