# Lugemi Model Registry (Foundation Model Cloud)

**Status:** Partial (VL-237 / library Phase 104)  
**Rule:** Governance hub over **VL-110** `model_registry` / `/models`. Does **not** invent MLflow, SageMaker Model Registry, automatic weight deploy, or traffic-mesh canary/shadow/blue-green. Roadmap: [`docs/roadmap/volume9-foundation-model-cloud/`](./roadmap/volume9-foundation-model-cloud/).

Console `/models` (VL-110) remains the live adapter matrix. This hub adds cards, sandbox versions/approvals/rollbacks, and deploy strategy plans that hand off to Model Serving.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Model Registry | **VL-237** — `/model-registry` hub |
| Model Cards | **Partial** — derived from VL-110 entries |
| Versions | **Partial** — sandbox lineage |
| Approvals | **Partial** — sandbox approve/reject |
| Rollbacks | **Partial** — sandbox active pointer |
| Deployments | **Partial** — plans + Model Serving handoff |
| Canary / Shadow / Blue Green | **Partial** — strategy metadata only (`trafficMeshOs: false`) |
| DDD / CQRS / Hexagonal | Bounded catalog CQRS slice — `hexagonalRewrite: false` |
| Terraform / Kubernetes | Shared platform — Fly default; optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/model-registry` |
| REST engine | `GET /v1/model-registry/engine` |
| Cards | `GET /v1/model-registry/cards` |
| Versions | `GET/POST /v1/model-registry/versions` |
| Approvals | `POST /v1/model-registry/versions/:id/approve\|reject` |
| Rollback | `POST /v1/model-registry/versions/:id/rollback` |
| Deployments | `GET/POST /v1/model-registry/deployments` |
| Monitoring | `GET /v1/model-registry/monitoring` |
| GraphQL | `modelRegistryCapabilities` |
| SDK | `modelRegistryEngine()` |
| CLI | `lugemi model-registry-engine` |
| Underlying registry | `/v1/models`, `/v1/models/live` (VL-110, ADR-0039) |

## Honesty

| Flag | Value |
| --- | --- |
| `mlflowOs` | false |
| `trafficMeshOs` | false |
| `automaticWeightDeploy` | false |
| `regeneratesVl110` | false |
| `extendsVl110` | true |

See ADR-0138.
