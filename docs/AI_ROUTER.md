# VerbaLab AI Router

**Status:** Partial (VL-207 / library Phase 74)  
**Parent:** [Inference Cloud](./INFERENCE_CLOUD.md)  
**Rule:** Dry-run **model / provider / inference** selection over **AI Gateway** adapters. Authed policies and decision logs are org/workspace-scoped. Extends Gateway routing + Model Serving canary weights. Does **not** invent a service mesh, multi-cloud router OS, or regenerate the Gateway. Spend caps are enforced via [Cost Optimization](./COST_OPTIMIZATION.md) (VL-211) on resolve (402 when over).

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/ai-router` |
| Engine | `GET /v1/ai-router/engine` |
| Features / providers | `GET …/features` · `/providers` |
| Policy | `GET/PUT /v1/ai-router/policies` |
| Resolve (dry-run) | `POST /v1/ai-router/resolve` |
| Decisions / analytics / monitoring | `GET …/decisions` · `/analytics` · `/monitoring` |
| GraphQL | `aiRouterEngine` |
| SDK / CLI | `aiRouterEngine()` · `verbalab ai-router-engine` |

## Capabilities

| Library ask | Status |
| --- | --- |
| Model / provider / inference selection | shipped (dry-run resolve) |
| Latency / cost / balanced / quality optimize | partial (estimated scores) |
| Regional routing | partial (`af-south-1` preference; multi-region mesh deferred) |
| Fallback | shipped (ordered chain) |
| Retries | partial (advisory `maxRetries`; Gateway owns HTTP retry) |
| Caching | partial → Intelligent Cache (VL-210) |
| Spend caps | enforced via Cost Optimization (VL-211) on resolve |
| Streaming | partial (capability flag; runtime VL-208) |
| Load balancing | partial (static weights + Model Serving traffic %) |

## Env

| Control | Default | Env |
| --- | --- | --- |
| Router mode | `sandbox` | `VERBALAB_AI_ROUTER_MODE=disabled\|sandbox` |

## Honesty

| Flag | Value |
| --- | --- |
| `serviceMeshOs` | false |
| `multiCloudRouterOs` | false |
| `regeneratesAiGateway` | false |
| `extendsAiGateway` | true |
| `dryRunResolveOnly` | true |
| `enforcesSpendCaps` | false |
| `inferenceCacheOs` | false |

See ADR-0118.
