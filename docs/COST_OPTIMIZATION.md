# Lugemi Cost Optimization Engine

**Status:** Partial (VL-211 / library Phase 78)  
**Parent:** [Inference Cloud](./INFERENCE_CLOUD.md)  
**Rule:** Org/workspace **hard daily/monthly spend caps** with enforce on `record` / `check` and AI Router `resolve`. Does **not** invent a FinOps OS, cloud Spot APIs, or reserved-instance marketplace. Spot/reserved are sandbox planning hints only.

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/cost-optimization` |
| Engine | `GET /v1/cost-optimization/engine` |
| Ceilings / budgets | `GET …/ceilings` · `GET|PUT …/budgets` |
| Check / record | `POST …/check` · `/record` |
| Optimize / GPU | `POST …/optimize` · `GET …/gpu` |
| Predictions / reports | `GET …/predictions` · `/reports` |
| Analytics / monitoring | `GET …/analytics` · `/monitoring` |
| GraphQL | `costOptimizationEngine` |
| SDK / CLI | `costOptimizationEngine()` · `lugemi cost-optimization-engine` |

## Enforcement (required)

1. `POST /record` and `POST /check` return **402** `cost_spend_ceiling` when projected spend exceeds daily or monthly cap and `enforce=true`.
2. AI Router `POST /v1/ai-router/resolve` calls the same gate before returning a plan.
3. Caps are **not** report-only — monitoring/reports exist, but the ledger gate refuses over-cap work.

## Env

| Control | Default | Env |
| --- | --- | --- |
| Mode | `sandbox` | `LUGEMI_COST_OPTIMIZATION_MODE=disabled\|sandbox` |
| Default daily cap | $10 | `LUGEMI_COST_DAILY_CAP_USD` |
| Default monthly cap | $100 | `LUGEMI_COST_MONTHLY_CAP_USD` |

## Honesty

| Flag | Value |
| --- | --- |
| `finOpsOs` | false |
| `cloudSpotApis` | false |
| `reservedInstanceMarketplace` | false |
| `openEndedAutoscale` | false |
| `enforcesSpendCaps` | true |
| `reportOnly` | false |

See ADR-0122.
