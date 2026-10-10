# Lugemi GPU Platform

**Status:** Partial (VL-205 / library Phase 72)  
**Parent:** [Inference Cloud](./INFERENCE_CLOUD.md)  
**Rule:** Sandbox GPU pools, scheduling, quotas, and autoscaling with **hard instance + spend ceilings**. Authed allocations are org/workspace-scoped. Logical allocations only — does **not** call AWS/GCP/Azure GPU APIs. Not a hyperscaler GPU OS, MIG sharing suite, or distributed training fabric.

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/gpu-platform` |
| Engine | `GET /v1/gpu-platform/engine` |
| Vendors / pools | `GET …/vendors` · `/pools` |
| Ceilings | `GET /v1/gpu-platform/ceilings` |
| Allocations | `GET/POST /v1/gpu-platform/allocations` |
| Scale / release | `POST …/allocations/:id/scale` · `/release` |
| Health / costs / analytics / monitoring | `GET …/health` · `/costs` · `/analytics` · `/monitoring` |
| GraphQL | `gpuPlatformEngine` |
| SDK / CLI | `gpuPlatformEngine()` · `lugemi gpu-platform-engine` |

## Spend safety (enforced)

| Control | Default | Env |
| --- | --- | --- |
| Provision mode | `sandbox` | `LUGEMI_GPU_PROVISION_MODE=disabled\|sandbox` |
| Max instances | 2 (cap 8) | `LUGEMI_GPU_MAX_INSTANCES` |
| Max estimated hourly spend | $25 (cap $500) | `LUGEMI_GPU_MAX_SPEND_USD` |

- Allocate/scale return **402** when hard ceilings would be exceeded.
- Scale clamps to ceiling — never open-ended autoscale.
- `disabled` mode forbids allocate/scale (catalog still public).
- Do **not** point at a production cloud billing account.

## Honesty

| Flag | Value |
| --- | --- |
| `gpuHyperscalerOs` | false |
| `callsCloudGpuApis` | false |
| `openEndedGpuAutoscale` | false |
| `hardSpendCeilingsRequired` | true |
| `sandboxLogicalOnly` | true |
| `migSharingOs` | false |
| `distributedTrainingOs` | false |

See ADR-0116.
